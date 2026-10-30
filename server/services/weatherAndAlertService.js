import { query, queryOne, run } from '../models/db.js';
import { findDistrict } from '../config/maharashtra.js';
import { tr, cropName } from '../config/serverI18n.js';

// District coordinates come from the shared Maharashtra config (all 36 districts)

// In-memory cache to prevent excessive external requests and provide sub-millisecond responses
const weatherCache = new Map();
const CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes

function getConditionFromWmo(code, isDay) {
    switch (code) {
        case 0:
            return isDay ? 'Sunny · Clear' : 'Clear Night Sky';
        case 1:
            return isDay ? 'Mainly Sunny' : 'Mainly Clear Night';
        case 2:
            return isDay ? 'Partly Cloudy' : 'Partly Cloudy Night';
        case 3:
            return isDay ? 'Overcast Sky' : 'Overcast Night';
        case 45:
        case 48:
            return isDay ? 'Morning Fog / Mist' : 'Night Fog / Mist';
        case 51:
        case 53:
        case 55:
            return 'Light Drizzle';
        case 61:
        case 63:
            return 'Moderate Rain';
        case 65:
            return 'Heavy Showers';
        case 80:
        case 81:
        case 82:
            return 'Passing Showers';
        case 95:
        case 96:
        case 99:
            return 'Thunderstorm Expected';
        default:
            return isDay ? 'Partly Cloudy' : 'Clear Night';
    }
}

// Time of day in IST, used to pick today's advice
function getTimePeriodKey(hour) {
    if (hour >= 22 || hour < 5) return { key: 'night', isDay: false, english: 'Night' };
    if (hour < 8) return { key: 'dawn', isDay: true, english: 'Early morning' };
    if (hour < 12) return { key: 'morning', isDay: true, english: 'Morning' };
    if (hour < 16) return { key: 'midday', isDay: true, english: 'Afternoon' };
    if (hour < 19) return { key: 'evening', isDay: true, english: 'Evening' };
    return { key: 'lateEvening', isDay: false, english: 'Night' };
}

function districtName(district, lang) {
    const d = findDistrict(district);
    if (!d || lang === 'en' || !d[lang]) return d?.name || district;
    return d[lang];
}

// Same Open-Meteo request the server makes; also used by the browser when the server's own request is blocked
export function openMeteoUrl(district) {
    const d = findDistrict(district) || findDistrict('Nashik');
    return `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m' +
        '&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max' +
        '&timezone=Asia%2FKolkata';
}

function weatherUnavailable(district) {
    const err = new Error(`Live weather for ${district} is unavailable right now. Please try again in a few minutes.`);
    err.status = 503;
    err.code = 'WEATHER_UNAVAILABLE';
    // Lets the browser fetch Open-Meteo itself and share the result (see WeatherService.acceptBrowserData)
    err.details = { district: findDistrict(district)?.name || district, openMeteoUrl: openMeteoUrl(district) };
    return err;
}

export class WeatherService {
    // Live weather from Open-Meteo (cached 8 minutes). Returns null if the service cannot be reached.
    static async fetchLiveMeteorology(district = 'Nashik') {
        const key = district.toLowerCase().trim();
        const cached = weatherCache.get(key);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            return cached.data;
        }

        const url = openMeteoUrl(district);

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (res.ok) {
                    const liveData = await res.json();
                    weatherCache.set(key, { data: liveData, timestamp: Date.now() });
                    return liveData;
                }
                console.warn(`[WeatherService] Open-Meteo HTTP ${res.status} for ${district} (attempt ${attempt})`);
            } catch (err) {
                console.warn(`[WeatherService] Open-Meteo unreachable for ${district} (attempt ${attempt}): ${err.message}`);
            }
        }

        // Serve slightly older data rather than nothing, but never invent weather
        return cached ? cached.data : null;
    }

    /**
     * Cloud servers share IP addresses that free weather APIs often block. When that happens the browser
     * downloads the same Open-Meteo forecast and sends it here. It is checked to be a real Open-Meteo
     * response for this district's coordinates and cached like a server-side fetch.
     */
    static acceptBrowserData(district, data) {
        const d = findDistrict(district);
        const valid = d && data && typeof data === 'object'
            && Math.abs(Number(data.latitude) - d.lat) < 0.2 && Math.abs(Number(data.longitude) - d.lon) < 0.2
            && typeof data.current?.temperature_2m === 'number'
            && Array.isArray(data.daily?.time) && data.daily.time.length > 0
            && Array.isArray(data.hourly?.temperature_2m);
        if (!valid) return false;
        weatherCache.set(district.toLowerCase().trim(), { data, timestamp: Date.now() });
        weatherCache.set(d.name.toLowerCase(), { data, timestamp: Date.now() });
        return true;
    }

    static async getWeatherForecast(district = 'Nashik', lang = 'en') {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const live = await this.fetchLiveMeteorology(district);
        if (!live?.daily?.time?.length) {
            throw weatherUnavailable(district);
        }

        const daily = live.daily;
        return daily.time.slice(0, 5).map((dateStr, i) => {
            const d = new Date(dateStr + 'T12:00:00+05:30');
            const rainProb = Math.round(daily.precipitation_probability_max?.[i] ?? 0);
            const tempMax = Math.round(daily.temperature_2m_max?.[i]);
            const tempMin = Math.round(daily.temperature_2m_min?.[i]);
            return {
                id: i + 1,
                district,
                record_date: dateStr,
                temp_max_c: tempMax,
                temp_min_c: tempMin,
                humidity_percent: daily.relative_humidity_2m_mean?.[i] != null ? Math.round(daily.relative_humidity_2m_mean[i]) : null,
                rainfall_prob_percent: rainProb,
                rainfall_mm: daily.precipitation_sum?.[i] != null ? Math.round(daily.precipitation_sum[i] * 10) / 10 : null,
                wind_speed_kmh: daily.wind_speed_10m_max?.[i] != null ? Math.round(daily.wind_speed_10m_max[i]) : null,
                condition: getConditionFromWmo(daily.weather_code?.[i] ?? 0, true),
                agro_summary: rainProb > 50 ? tr('forecast.rain', lang, { rain: rainProb }) : tr('forecast.dry', lang, { max: tempMax }),
                dayName: dayNames[d.getDay()],
                shortDay: dayNames[d.getDay()].slice(0, 3),
                formattedDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
                fullDateStr: `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`,
                source: 'Open-Meteo'
            };
        });
    }

    static async getTodayAgroWeather(district = 'Nashik', cropName = 'Tomato', cropStage = 'Vegetative Stage', lang = 'en') {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Current time in India (IST)
        const now = new Date();
        const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + 5.5 * 60 * 60 * 1000);
        const currentHour = istTime.getHours();
        const period = getTimePeriodKey(currentHour);
        const hour12 = currentHour % 12 || 12;
        const currentTimeFormatted = `${String(hour12).padStart(2, '0')}:${String(istTime.getMinutes()).padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;
        const dayName = dayNames[istTime.getDay()];
        const monthName = monthNames[istTime.getMonth()];

        const live = await this.fetchLiveMeteorology(district);
        if (!live?.current) {
            throw weatherUnavailable(district);
        }

        const currentTemp = Math.round(live.current.temperature_2m * 10) / 10;
        const humidity = Math.round(live.current.relative_humidity_2m);
        const windSpeed = Math.round(live.current.wind_speed_10m);
        const isDay = live.current.is_day === 1;
        const weatherCode = live.current.weather_code ?? 0;
        const tempMax = Math.round(live.daily?.temperature_2m_max?.[0]);
        const tempMin = Math.round(live.daily?.temperature_2m_min?.[0]);
        const rainProb = Math.round(live.daily?.precipitation_probability_max?.[0] ?? 0);

        // Real hourly temperatures for today: morning 9 am, afternoon 3 pm, evening 6 pm, night 9 pm
        const slotHours = { morning: 9, afternoon: 15, evening: 18, night: 21 };
        const todaySlots = Object.fromEntries(Object.entries(slotHours).map(([slot, h]) => [slot, {
            hour: h,
            temp_c: live.hourly?.temperature_2m?.[h] != null ? Math.round(live.hourly.temperature_2m[h]) : null,
            rain_prob: live.hourly?.precipitation_probability?.[h] ?? null,
            condition: getConditionFromWmo(live.hourly?.weather_code?.[h] ?? weatherCode, h >= 6 && h < 18)
        }]));

        const hourlySnapshots = [0, 3, 6, 9, 12, 15, 18, 21].map(h => ({
            hour: h,
            timeLabel: `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`,
            temp_c: live.hourly?.temperature_2m?.[h] != null ? Math.round(live.hourly.temperature_2m[h]) : null,
            condition: getConditionFromWmo(live.hourly?.weather_code?.[h] ?? weatherCode, h >= 6 && h < 18),
            isCurrent: Math.abs(currentHour - h) < 1.5 || (h === 21 && currentHour >= 22) || (h === 0 && currentHour < 1.5)
        }));

        // Most important advice first: rain > wind > humidity > heat > time of day
        const crop = cropName && cropName !== 'undefined' ? cropName : 'crop';
        const params = { crop: localCrop(crop, lang), rain: rainProb, humidity, temp: currentTemp, wind: windSpeed };
        let adviceKey = `advice.${period.key}`;
        if (rainProb > 60) adviceKey = 'advice.rain';
        else if (windSpeed > 20 && period.isDay) adviceKey = 'advice.wind';
        else if (humidity > 85 && period.key !== 'night') adviceKey = 'advice.humid';
        else if (currentTemp > 34) adviceKey = 'advice.heat';

        return {
            district,
            record_date: istTime.toISOString().split('T')[0],
            current_temp_c: currentTemp,
            feels_like_c: Math.round(live.current.apparent_temperature * 10) / 10,
            temp_max_c: tempMax,
            temp_min_c: tempMin,
            humidity_percent: humidity,
            rainfall_prob_percent: rainProb,
            wind_speed_kmh: windSpeed,
            is_day: isDay,
            weather_code: weatherCode,
            condition: getConditionFromWmo(weatherCode, isDay),
            currentTime: currentTimeFormatted,
            timePeriod: period.english,
            timePeriodLabel: tr(`period.${period.key}`, lang),
            dayName,
            formattedDate: `${istTime.getDate()} ${monthName.slice(0, 3)}`,
            fullDateStr: `${dayName}, ${istTime.getDate()} ${monthName} ${istTime.getFullYear()}`,
            farmImpactAdvice: tr(adviceKey, lang, params),
            adviceKey,
            todaySlots,
            hourlyProgression: hourlySnapshots,
            cropContext: { cropName, cropStage },
            source: 'Open-Meteo',
            fetchedAt: new Date().toISOString()
        };
    }
}

function localCrop(name, lang) {
    if (name === 'crop') return lang === 'mr' ? 'उभ्या' : lang === 'hi' ? 'खड़ी फसल' : 'the crop';
    return cropName(name, lang);
}

export class AlertRuleEngine {
    static RULES = [
        {
            id: 'RULE_FUNGAL_BLIGHT',
            severity: 'Critical',
            evaluate: (weather, crop) => {
                const isSolanaceous = ['tomato', 'potato', 'chilli', 'green chilli'].includes(crop?.toLowerCase());
                return isSolanaceous && (weather.humidity_percent >= 80 || weather.rainfall_prob_percent >= 50);
            },
            keys: { title: 'alert.fungal.title', reason: 'alert.fungal.reason', steps: ['alert.fungal.step1', 'alert.fungal.step2', 'alert.fungal.step3'] }
        },
        {
            id: 'RULE_WHEAT_MOISTURE',
            severity: 'Advisory',
            evaluate: (weather, crop) => crop?.toLowerCase().includes('wheat'),
            keys: { title: 'alert.wheat.title', reason: 'alert.wheat.reason', steps: ['alert.wheat.step1', 'alert.wheat.step2'] }
        },
        {
            id: 'RULE_HEAT_STRESS',
            severity: 'Warning',
            evaluate: (weather) => Math.max(weather.current_temp_c ?? 0, weather.temp_max_c ?? 0) >= 35,
            keys: { title: 'alert.heat.title', reason: 'alert.heat.reason', steps: ['alert.heat.step1', 'alert.heat.step2'] }
        }
    ];

    static async getActiveAlerts(district, crop, stage, lang = 'en') {
        const weather = await WeatherService.getTodayAgroWeather(district, crop, stage, lang);
        return this.evaluateAlerts(weather, crop, stage, lang);
    }

    static evaluateAlerts(weather, crop, stage, lang = 'en') {
        const params = {
            crop: localCrop(crop || 'crop', lang),
            district: districtName(weather.district, lang),
            humidity: weather.humidity_percent,
            rain: weather.rainfall_prob_percent,
            max: weather.temp_max_c,
            temp: Math.max(weather.current_temp_c ?? 0, weather.temp_max_c ?? 0)
        };
        return this.RULES
            .filter(rule => rule.evaluate(weather, crop, stage))
            .map(rule => ({
                id: rule.id,
                severity: rule.severity,
                severityLabel: tr(`severity.${rule.severity}`, lang),
                title: tr(rule.keys.title, lang, params),
                conditionSummary: tr(rule.keys.reason, lang, params),
                actionSteps: rule.keys.steps.map(k => tr(k, lang, params))
            }));
    }
}
