import { Request, Response } from 'express';

// Simulated weather generator for locations when API key is missing
const generateMockWeather = (district: string, state: string) => {
  const seed = (district + state).charCodeAt(0) || 10;
  const tempBase = 24 + (seed % 10); // 24 to 33 deg C
  const humidity = 60 + (seed % 30);  // 60% to 90%
  const windSpeed = 5 + (seed % 15);   // 5 to 20 km/h
  const pressure = 1008 - (seed % 10); // hPa
  const uvIndex = 4 + (seed % 6);
  const rainChance = (seed * 7) % 100; // 0 to 99%

  const forecast = Array.from({ length: 5 }).map((_, index) => {
    const daySeed = seed + index;
    const tempMax = tempBase + (daySeed % 5) - 2;
    const tempMin = tempMax - 6 - (daySeed % 3);
    const dayRainChance = (daySeed * 13) % 100;
    
    let main = 'Sunny';
    if (dayRainChance > 70) main = 'Heavy Rain';
    else if (dayRainChance > 40) main = 'Showers';
    else if (dayRainChance > 20) main = 'Partly Cloudy';

    return {
      date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tempMax,
      tempMin,
      humidity: Math.min(95, humidity + (daySeed % 10) - 5),
      rainChance: dayRainChance,
      main
    };
  });

  // Actionable advisory logic based on conditions
  const suitableForIrrigation = rainChance < 30 && tempBase > 26;
  const harvestToday = rainChance < 15;
  const avoidPesticideSpraying = windSpeed > 15 || rainChance > 40;

  return {
    location: `${district}, ${state}`,
    current: {
      temperature: tempBase,
      humidity,
      windSpeed,
      pressure,
      uvIndex,
      rainChance,
      main: rainChance > 50 ? 'Rain' : (humidity > 75 ? 'Clouds' : 'Clear'),
      description: rainChance > 50 ? 'light intensity shower rain' : (humidity > 75 ? 'broken clouds' : 'clear sky')
    },
    advisories: {
      suitableForIrrigation,
      harvestToday,
      avoidPesticideSpraying,
      message: rainChance > 40
        ? 'Rainfall expected. Avoid pesticide applications today and delay irrigation.'
        : (suitableForIrrigation
            ? 'Clear weather and warm temperatures. Highly suitable for planned irrigation.'
            : 'Moderate wind speeds. Spray pesticides only in the early morning hours.')
    },
    forecast
  };
};

export const getWeather = async (req: Request, res: Response) => {
  try {
    const { state, district } = req.query as { state?: string; district?: string };

    if (!state || !district) {
      return res.status(400).json({ success: false, message: 'State and district are required parameters' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // Fallback to simulated weather generator
      const mockData = generateMockWeather(district, state);
      return res.status(200).json({
        success: true,
        source: 'mock',
        data: mockData
      });
    }

    // Attempt real API fetch if key is provided (using a simplified fetch with coordinate lookup)
    try {
      // Fetch coordinates (Geocoding API)
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(district)},${encodeURIComponent(state)},IN&limit=1&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = (await geoRes.json()) as any;

      if (!geoData || geoData.length === 0) {
        throw new Error('Geocoding location not found');
      }

      const { lat, lon } = geoData[0];

      // Fetch weather data
      const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const weatherData = (await (await fetch(weatherUrl)).json()) as any;

      if (weatherData.cod !== '200') {
        throw new Error('Failed to retrieve forecast data');
      }

      const currentItem = weatherData.list[0];
      const current = {
        temperature: Math.round(currentItem.main.temp),
        humidity: currentItem.main.humidity,
        windSpeed: Math.round(currentItem.wind.speed * 3.6), // Convert to km/h
        pressure: currentItem.main.pressure,
        uvIndex: 5, // Default/estimate since standard forecast doesn't return UV
        rainChance: Math.round((currentItem.pop || 0) * 100),
        main: currentItem.weather[0].main,
        description: currentItem.weather[0].description
      };

      // Filter to get 1 forecast per day (5 days total)
      const list = weatherData.list;
      const dailyForecasts: Record<string, any> = {};

      list.forEach((item: any) => {
        const dateStr = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[dateStr] && dateStr !== new Date().toISOString().split('T')[0]) {
          dailyForecasts[dateStr] = item;
        }
      });

      const forecastKeys = Object.keys(dailyForecasts).slice(0, 5);
      const forecast = forecastKeys.map((key) => {
        const item = dailyForecasts[key];
        return {
          date: key,
          tempMax: Math.round(item.main.temp_max),
          tempMin: Math.round(item.main.temp_min),
          humidity: item.main.humidity,
          rainChance: Math.round((item.pop || 0) * 100),
          main: item.weather[0].main
        };
      });

      const rainChanceVal = current.rainChance;
      const windSpeedVal = current.windSpeed;
      const suitableForIrrigation = rainChanceVal < 30 && current.temperature > 24;
      const harvestToday = rainChanceVal < 20;
      const avoidPesticideSpraying = windSpeedVal > 15 || rainChanceVal > 45;

      return res.status(200).json({
        success: true,
        source: 'openweather',
        data: {
          location: `${district}, ${state}`,
          current,
          advisories: {
            suitableForIrrigation,
            harvestToday,
            avoidPesticideSpraying,
            message: rainChanceVal > 40
              ? 'Rain forecast. Delay spraying pesticides and limit active irrigation fields.'
              : 'Conditions stable. Suitable for normal farming operations.'
          },
          forecast
        }
      });

    } catch (apiError: any) {
      console.warn('Weather API failed, using mock fallback:', apiError.message);
      const mockData = generateMockWeather(district, state);
      return res.status(200).json({
        success: true,
        source: 'fallback-mock',
        data: mockData
      });
    }

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
