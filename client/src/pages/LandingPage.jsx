import React from 'react';
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShoppingBag,
  WifiOff,
  CheckCircle2,
  Users,
  MapPin,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { getTranslation } from '../services/i18n.js';

export function LandingPage({ onNavigate, lang, onLanguageChange, onOpenAuth }) {
  const t = getTranslation(lang);

  return (
    <div style={{ backgroundColor: '#F8F6F0', color: '#112019', fontFamily: 'var(--font-editorial)' }}>
      {/* Top Floating Pill Navigation: Centered Logo & Website Name */}
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '12px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '999px',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: '56px',
          boxShadow: '0 2px 12px rgba(17, 32, 25, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          {/* Brand Logo & Website Name in the Exact Middle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#112019',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(17, 32, 25, 0.15)'
            }}>
              <Sprout size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#112019' }}>
              {t.brandName}
            </span>
          </div>

          {/* Right Action Buttons & Language Switcher (Positioned on the Right) */}
          <div style={{
            position: 'absolute',
            right: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {/* Language Picker */}
            <div style={{ display: 'flex', gap: '3px', background: '#F0F2EE', padding: '3px', borderRadius: '999px' }}>
              {['en', 'hi', 'mr'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLanguageChange && onLanguageChange(l)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: lang === l ? '#112019' : 'transparent',
                    color: lang === l ? '#FFFFFF' : '#4B5550'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="landing-auth-btn"
              style={{
                backgroundColor: '#112019',
                color: '#FFFFFF',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{t.hero.signInRegister}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{ padding: '24px 0 48px 0' }}>
        <div className="container">
          <div style={{
            position: 'relative',
            borderRadius: '28px',
            overflow: 'hidden',
            minHeight: '520px',
            backgroundColor: '#2A3B2F',
            backgroundImage: 'linear-gradient(rgba(17, 32, 25, 0.4), rgba(17, 32, 25, 0.65)), url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 40px',
            color: '#FFFFFF',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)'
          }}>
            {/* Top Left Title & Narrative */}
            <div style={{ maxWidth: '640px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '5px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '16px',
                textTransform: 'uppercase'
              }}>
                <Sprout size={14} color="#88D49E" />
                <span>{t.hero.tag}</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                lineHeight: 1.12,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                marginBottom: '18px'
              }}>
                {t.hero.headline}
              </h1>

              <p style={{
                fontSize: '1rem',
                color: '#E0E7E2',
                lineHeight: 1.6,
                maxWidth: '520px',
                marginBottom: '24px'
              }}>
                {t.hero.subhead}
              </p>

              {/* Pill Button with Arrow Circle */}
              <button
                type="button"
                onClick={onOpenAuth}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#112019',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '6px 6px 6px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <span>{t.hero.ctaPlan}</span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#112019',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>

            {/* Bottom Row: 3 Floating Metric Pills + Floating Image Card */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '20px',
              marginTop: '40px'
            }}>
              {/* 3 Metric Pills */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  color: '#112019',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>{t.hero.freeBadge}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#57625B', textTransform: 'uppercase', marginTop: '4px' }}>{t.hero.freeSub}</div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  color: '#112019',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>{t.hero.mandisBadge}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#57625B', textTransform: 'uppercase', marginTop: '4px' }}>{t.hero.mandisSub}</div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  color: '#112019',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>{t.hero.cropsBadge}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#57625B', textTransform: 'uppercase', marginTop: '4px' }}>{t.hero.cropsSub}</div>
                </div>
              </div>

              {/* Floating Preview Card */}
              <div style={{
                backgroundColor: 'rgba(17, 32, 25, 0.88)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '16px 20px',
                maxWidth: '280px',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#88D49E', textTransform: 'uppercase' }}>{t.hero.previewBadge}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FFFFFF', color: '#112019', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '10px' }}>
                  {t.hero.previewDecision}
                </div>
                <div style={{
                  height: '70px',
                  borderRadius: '10px',
                  backgroundImage: 'url("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=400&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section style={{ padding: '48px 0 64px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '120px',
                height: '80px',
                borderRadius: '14px',
                backgroundImage: 'url("https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=300&auto=format&fit=crop")',
                backgroundSize: 'cover',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-leaf-green)', textTransform: 'uppercase' }}>{lang === 'hi' ? 'हमारा संकल्प' : lang === 'mr' ? 'हमारा ध्येय' : 'Academic Vision'}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#112019' }}>{lang === 'hi' ? 'भारतीय किसानों के लिए सुगम तकनीक' : lang === 'mr' ? 'शेतकऱ्यांसाठी सुलभ व सोपे तंत्रज्ञान' : 'Software Usability for Real Indian Farms'}</div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#112019', lineHeight: 1.25, marginBottom: '14px' }}>
                {t.landing.whatWeSolveTitle}
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#4B5550', lineHeight: 1.6, marginBottom: '12px' }}>
                {t.landing.whatWeSolveSubtitle}
              </p>
              <p style={{ fontSize: '0.92rem', color: '#4B5550', lineHeight: 1.6 }}>
                {lang === 'hi'
                  ? 'यह प्रणाली मंडियों के भाव, फसल लागत का गणित और वॉइस असिस्टेंट से हर किसान को सही निर्णय लेने में सक्षम बनाती है।'
                  : lang === 'mr'
                  ? 'ही प्रणाली थेट बाजारभाव, पीक खर्च-नफा गणित आणि व्हॉईस असिस्टंटद्वारे प्रत्येक शेतकऱ्याला योग्य निर्णय घेण्यास मदत करते.'
                  : 'Today, the platform monitors benchmark APMC mandis, models crop production economics, and empowers smallholders through hands-free voice assistance in Marathi and Hindi.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DARK ANALYTICS & PRODUCTION SECTION */}
      <section style={{ padding: '0 0 64px 0' }}>
        <div className="container">
          <div style={{
            backgroundColor: '#151C18',
            borderRadius: '32px',
            padding: '48px 40px',
            color: '#FFFFFF',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'flex-start'
            }}>
              {/* Left Column: Geographic Coverage & Statistics */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#88D49E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'hi' ? 'क्षेत्रीय मंडी नेटवर्क' : lang === 'mr' ? 'प्रादेशिक बाजार समिती नेटवर्क' : 'Regional Mandi Coverage'}
                </span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', marginBottom: '20px' }}>
                  {lang === 'hi' ? 'एपीएमसी मंडी नेटवर्क और परिवहन कॉरिडोर' : lang === 'mr' ? 'बाजार समित्या व सामाईक वाहतूक कॉरिडोअर' : 'APMC Market Network & Transport Corridors'}
                </h3>

                {/* Simulated Geographic Route Diagram */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#A3B0A7', marginBottom: '8px' }}>
                    <span>{lang === 'hi' ? 'सक्रिय मार्ग: नासिक → मुंबई वाशी' : lang === 'mr' ? 'सक्रिय मार्ग: नाशिक → मुंबई वाशी' : 'Active Corridor: Nashik → Mumbai Vashi'}</span>
                    <strong style={{ color: '#88D49E' }}>188 km</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ width: '74%', height: '100%', background: '#88D49E', borderRadius: '3px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#A3B0A7', marginBottom: '8px' }}>
                    <span>{lang === 'hi' ? 'सक्रिय मार्ग: लासलगांव → पुणे एपीएमसी' : lang === 'mr' ? 'सक्रिय मार्ग: लासलगाव → पुणे बाजार समिती' : 'Active Corridor: Lasalgaon → Pune APMC'}</span>
                    <strong style={{ color: '#88D49E' }}>162 km</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ width: '62%', height: '100%', background: '#E9C46A', borderRadius: '3px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#A3B0A7', marginBottom: '8px' }}>
                    <span>{lang === 'hi' ? 'सक्रिय मार्ग: करनाल → आजादपुर राष्ट्रीय मंडी' : lang === 'mr' ? 'सक्रिय मार्ग: कर्नाल → आझादपूर राष्ट्रीय बाजार' : 'Active Corridor: Karnal → Azadpur National'}</span>
                    <strong style={{ color: '#88D49E' }}>128 km</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: '#88D49E', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* 3 Metric Pills */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    color: '#112019',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    flex: 1
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>25,00,000+</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase' }}>{lang === 'hi' ? 'क्विंटल उपज मॉडल' : lang === 'mr' ? 'क्विंटल उत्पादन नोंद' : 'Quintals Modeled'}</div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    color: '#112019',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    flex: 1
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>18,00,000+</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase' }}>{lang === 'hi' ? 'शुद्ध मुनाफा गणना' : lang === 'mr' ? 'निव्वळ नफा विश्लेषण' : 'Net Realizations'}</div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    color: '#112019',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    flex: 1
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>38%</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase' }}>{lang === 'hi' ? 'भाड़ा बचत' : lang === 'mr' ? 'वाहतूक खर्च बचत' : 'Freight Saved'}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Analysis of Production & Join Team Banner */}
              <div>
                {/* Chart Box */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '24px',
                  color: '#112019',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#112019' }}>{lang === 'hi' ? 'उत्पादन और फसल वितरण विश्लेषण' : lang === 'mr' ? 'उत्पादन व पीक वितरण विश्लेषण' : 'Analysis of production & crop distribution'}</h4>
                      <div style={{ fontSize: '0.78rem', color: '#57625B' }}>{lang === 'hi' ? 'उपज स्थिति और मंडी भाव में उतार-चढ़ाव' : lang === 'mr' ? 'उत्पादन स्थिती व बाजारभावातील चढ-उतार' : 'Current status of yield and mandi price volatility'}</div>
                    </div>
                    <span className="badge badge-wheat">2026 APMC Index</span>
                  </div>

                  {/* Monthly Histogram Bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '10px', borderBottom: '1px solid #E2DBD0' }}>
                    {[
                      { m: lang === 'hi' || lang === 'mr' ? 'जन' : 'Jan', h1: 30, h2: 45 },
                      { m: lang === 'hi' || lang === 'mr' ? 'फर' : 'Feb', h1: 40, h2: 60 },
                      { m: lang === 'hi' || lang === 'mr' ? 'मार्च' : 'Mar', h1: 55, h2: 80 },
                      { m: lang === 'hi' || lang === 'mr' ? 'अप्रै' : 'Apr', h1: 35, h2: 50 },
                      { m: lang === 'hi' || lang === 'mr' ? 'मई' : 'May', h1: 25, h2: 40 },
                      { m: lang === 'hi' || lang === 'mr' ? 'जून' : 'Jun', h1: 60, h2: 90 },
                      { m: lang === 'hi' || lang === 'mr' ? 'जुला' : 'Jul', h1: 75, h2: 110 },
                      { m: lang === 'hi' || lang === 'mr' ? 'अग' : 'Aug', h1: 70, h2: 100 },
                      { m: lang === 'hi' || lang === 'mr' ? 'सितं' : 'Sep', h1: 85, h2: 120 },
                      { m: lang === 'hi' || lang === 'mr' ? 'अक्टू' : 'Oct', h1: 65, h2: 95 },
                      { m: lang === 'hi' || lang === 'mr' ? 'नवं' : 'Nov', h1: 50, h2: 70 },
                      { m: lang === 'hi' || lang === 'mr' ? 'दिसं' : 'Dec', h1: 45, h2: 65 }
                    ].map((bar, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                          <div style={{ width: '8px', height: `${bar.h1}px`, background: '#D4A373', borderRadius: '2px 2px 0 0' }} />
                          <div style={{ width: '8px', height: `${bar.h2}px`, background: '#112019', borderRadius: '2px 2px 0 0' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#57625B', fontWeight: 600 }}>{bar.m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Banner */}
                <div style={{
                  backgroundColor: '#F7DC98',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  color: '#112019',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#112019', marginBottom: '4px' }}>
                      {t.landing.teamTitle}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#4A3D1E', maxWidth: '340px' }}>
                      {lang === 'hi'
                        ? 'यश बावने, रोहित कुंडू और मंथन टाकरखेड़े द्वारा निर्मित।'
                        : lang === 'mr'
                        ? 'यश बावने, रोहित कुंडू आणि मंथन टाकरखेडे यांनी विकसित केलेले।'
                        : 'Developed by Yash Bawane, Rohit Kundu, and Manthan Takerkhede for Software Usability.'}
                    </p>
                  </div>

                  {/* Avatar circles + Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', marginLeft: '10px' }}>
                      {['YB', 'RK', 'MT'].map((init, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#112019',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            border: '2px solid #F7DC98',
                            marginLeft: '-10px'
                          }}
                        >
                          {init}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('team-contributions');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        backgroundColor: '#112019',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '10px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{lang === 'hi' ? 'टीम से मिलें' : lang === 'mr' ? 'टीम भेटा' : 'Meet Team'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Panoramic Farmer Section */}
      <section style={{ padding: '0 0 64px 0' }}>
        <div className="container">
          <div style={{
            position: 'relative',
            borderRadius: '28px',
            overflow: 'hidden',
            minHeight: '440px',
            backgroundImage: 'linear-gradient(rgba(17, 32, 25, 0.35), rgba(17, 32, 25, 0.6)), url("https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=1920&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 40px',
            color: '#FFFFFF'
          }}>
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.2, color: '#FFFFFF', marginBottom: '14px' }}>
                {lang === 'hi'
                  ? 'फसल सुरक्षा, उचित मंडी मुनाफा और कृषि मानकों का सही पालन हमारा मुख्य उद्देश्य है।'
                  : lang === 'mr'
                  ? 'पिकाचे संरक्षण, बाजारातील खरा नफा आणि कृषी मानकांचे पालन हे आमचे उद्दिष्ट आहे.'
                  : 'We ensure high crop protection, stable net realizations, and compliance with agricultural safety standards.'}
              </h2>
            </div>

            {/* Floating Badges at Bottom */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                color: '#112019',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '14px 22px',
                minWidth: '140px'
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>№1</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase', marginTop: '2px' }}>{lang === 'hi' ? 'शुद्ध मुनाफा गणित' : lang === 'mr' ? 'निव्वळ नफा गणित' : 'Net Realization Mandi Math'}</div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                color: '#112019',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '14px 22px',
                minWidth: '140px'
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>94%</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase', marginTop: '2px' }}>{lang === 'hi' ? 'पत्ती रोग जांच सटीकता' : lang === 'mr' ? 'पान रोग अचूकता' : 'Leaf Diagnostic Accuracy'}</div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                color: '#112019',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '14px 22px',
                minWidth: '140px'
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>№1</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#57625B', textTransform: 'uppercase', marginTop: '2px' }}>{lang === 'hi' ? 'साझा वाहन व्यवस्था' : lang === 'mr' ? 'सामाईक वाहतूक व्यवस्था' : 'Regional Transport Pooling'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section style={{ padding: '0 0 80px 0' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-leaf-green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'hi' ? 'मुख्य सिद्धांत' : lang === 'mr' ? 'मार्गदर्शक तत्त्वे' : 'Guiding Principles'}
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#112019', marginTop: '4px' }}>
              {lang === 'hi' ? 'हमारी मूल मान्यताएं व मूल्य:' : lang === 'mr' ? 'आमची मूलभूत मूल्ये:' : 'Our values, which we adhere to:'}
            </h2>
          </div>

          <div className="grid-3" style={{ gap: '20px' }}>
            {/* Value Card 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-leaf-green)' }}>(01) {lang === 'hi' ? 'सतत विकास' : lang === 'mr' ? 'शाश्वत शेती' : 'Sustainable Development'}</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#112019', margin: '8px 0 14px 0' }}>{lang === 'hi' ? 'पर्यावरण-अनुकूल फसल सुरक्षा' : lang === 'mr' ? 'पर्यावरणपूरक पीक संरक्षण' : 'Eco-Centric Crop Protection'}</h3>
              <p style={{ fontSize: '0.86rem', color: '#57625B', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'hi'
                  ? 'हम ट्राइकोडर्मा और नीम अर्क जैसे जैविक उपचारों को प्राथमिकता देते हैं ताकि मिट्टी और कीट-मित्रों को नुकसान न पहुंचे।'
                  : lang === 'mr'
                  ? 'आम्ही ट्रायकोडर्मा आणि निंबोळी अर्कासारख्या सेंद्रिय उपायांना प्राधान्य देतो ज्यामुळे मातीचे आरोग्य टिकून राहते.'
                  : 'We prioritize organic remedies like Trichoderma and neem extracts to protect pollinators and prevent chemical soil degradation.'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Bio', 'Organic', 'Drip', 'Soil Health'].map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'var(--color-canvas-surface)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: '#112019' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Value Card 2 */}
            <div style={{
              backgroundColor: '#112019',
              color: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 10px 24px rgba(17, 32, 25, 0.2)'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#88D49E' }}>(02) {lang === 'hi' ? 'सीधा बाजार मुनाफा' : lang === 'mr' ? 'थेट बाजार नफा' : 'Direct Market Realization'}</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 14px 0' }}>{lang === 'hi' ? 'पारदर्शी भाड़ा एवं मंडी भाव' : lang === 'mr' ? 'पारदर्शक वाहतूक व बाजारभाव' : 'Transparent Logistics & Pricing'}</h3>
              <p style={{ fontSize: '0.86rem', color: '#CCD6D0', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'hi'
                  ? 'मंडी भाव में से गाड़ी भाड़ा और खर्चा काटकर असली मुनाफे की गणना की जाती है ताकि किसान को सही फायदा मिले।'
                  : lang === 'mr'
                  ? 'बाजारभावातून वाहतूक भाडे व खर्च वजा करून खऱ्या निव्वळ नफ्याची मोजणी केली जाते जेणेकरून शेतकरी तोट्यात जाणार नाही.'
                  : 'We subtract freight and market handling fees from raw APMC bids so the farmer keeps true take-home revenue.'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['APMC', 'Freight Net', 'Pooling', 'e-NAM'].map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Value Card 3 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-leaf-green)' }}>(03) {lang === 'hi' ? 'सरल और सुलभ' : lang === 'mr' ? 'सुलभ वापर' : 'Certified Usability'}</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#112019', margin: '8px 0 14px 0' }}>{lang === 'hi' ? 'आवाज और सरल कार्ड आधारित' : lang === 'mr' ? 'आवाज व सोप्या पर्यायांवर आधारित' : 'Low-Literacy & Voice Inclusive'}</h3>
              <p style={{ fontSize: '0.86rem', color: '#57625B', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'hi'
                  ? 'सरल दृश्य कार्ड, बड़े बटन और हिंदी व मराठी में बोलकर सवाल पूछने व सुनने की पूरी सुविधा।'
                  : lang === 'mr'
                  ? 'चित्रमय कार्ड, मोठे बटणे आणि मराठी व हिंदीत बोलून प्रश्न विचारण्याची व ऐकण्याची संपूर्ण सोय.'
                  : 'Guided visual cards, 48px touch targets, and voice read-aloud in Marathi and Hindi guarantee access for every farmer.'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Voice STT', 'Offline AI', 'मराठी', 'हिंदी'].map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'var(--color-canvas-surface)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: '#112019' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ padding: '64px 0', backgroundColor: '#112019', color: '#FFFFFF', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
            {lang === 'hi' ? 'आपका खेत। आपके निर्णय। सही जानकारी।' : lang === 'mr' ? 'तुमचे शेत. तुमचे निर्णय. अचूक माहिती.' : 'Your farm. Your decisions. Better information.'}
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#B3C4B8', lineHeight: 1.6, marginBottom: '28px' }}>
            {lang === 'hi' ? 'अपने खेत का प्रोफाइल बनाएं या हमारे इंटरैक्टिव कृषि टूल्स का उपयोग शुरू करें।' : lang === 'mr' ? 'आपल्या शेताचे नियोजन सुरू करा किंवा थेट प्रणालीचा वापर करा.' : 'Start with your customized farm context or explore our interactive tools designed for real field constraints.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenAuth}
              style={{
                backgroundColor: '#F7DC98',
                color: '#112019',
                border: 'none',
                borderRadius: '999px',
                padding: '12px 32px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {lang === 'hi' ? 'खेत का प्रोफाइल बनाएं' : lang === 'mr' ? 'शेती प्रोफाइल तयार करा' : 'Build My Farm Profile'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              style={{
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '999px',
                padding: '12px 28px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {lang === 'hi' ? 'डैशबोर्ड खोलें' : lang === 'mr' ? 'डॅशबोर्ड उघडा' : 'Open Live Dashboard'}
            </button>
          </div>
        </div>
      </section>

      {/* Team Contribution Section (Only on Landing Page) */}
      <section id="team-contributions" style={{
        padding: '80px 0',
        backgroundColor: '#FAF8F5',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#386641',
              backgroundColor: 'rgba(56, 102, 65, 0.1)',
              padding: '5px 16px',
              borderRadius: '999px',
              marginBottom: '12px'
            }}>
              {t.landing.teamTag}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#112019', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              {t.landing.teamTitle}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#57625B', lineHeight: 1.6 }}>
              {t.landing.teamSubtitle}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Team Member 1: Yash Bawane */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '30px',
              border: '1.5px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 8px 24px rgba(17, 32, 25, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#112019',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(17, 32, 25, 0.2)'
                }}>
                  YB
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#112019', margin: 0 }}>
                    Yash Bawane
                  </h3>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.landing.teamRole1}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#57625B', lineHeight: 1.55, marginBottom: '16px' }}>
                {lang === 'hi'
                  ? 'संपूर्ण उत्पाद डिजाइन, डिजाइन टोकन, उत्तरदायी यूजर इंटरफेस और किसान सुगमता प्रवाह के मुख्य वास्तुकार।'
                  : lang === 'mr'
                  ? 'संपूर्ण उत्पादन रचना, डिझाईन टोकन्स, शेतकरी-अनुकूल वापरकर्ता इंटरफेस आणि सुलभतेचे मुख्य रचनाकार.'
                  : 'Responsible for the holistic product design, design system tokens, responsive user interfaces, and end-to-end farmer usability journeys.'}
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#112019', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {lang === 'hi' ? 'प्रमुख योगदान:' : lang === 'mr' ? 'मुख्य योगदान:' : 'Key Contributions:'}
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#4B5550', lineHeight: 1.6 }}>
                  <li>{lang === 'hi' ? 'कर्व्ड नेविगेशन रेल और सुस्पष्ट किसान यूआई डिजाइन' : lang === 'mr' ? 'कर्व्हड नेव्हिगेशन व शेतकरी-अनुकूल यूआय डिझाईन' : 'Designed curved navigational rail & high-contrast farmer UI design system'}</li>
                  <li>{lang === 'hi' ? 'त्रिभाषी समर्थन (हिंदी, मराठी, अंग्रेजी)' : lang === 'mr' ? 'त्रिभाषिक भाषा समर्थन (मराठी, हिंदी, इंग्रजी)' : 'Multi-language support (English, Hindi, Marathi) with accessible touch targets'}</li>
                  <li>{lang === 'hi' ? 'फसल सलाहकार, मंडी पूलिंग और किसान प्रोफाइल प्रवाह' : lang === 'mr' ? 'पीक सल्लागार, बाजार वाहतूक आणि शेतकरी प्रोफाइल' : 'Interactive decision flows for Crop Advisor, Mandi Pooling, and Farmer Profile'}</li>
                </ul>
              </div>
            </div>

            {/* Team Member 2: Rohit Kundu */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '30px',
              border: '1.5px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 8px 24px rgba(17, 32, 25, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#E76F51',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(231, 111, 81, 0.25)'
                }}>
                  RK
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#112019', margin: 0 }}>
                    Rohit Kundu
                  </h3>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E76F51', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.landing.teamRole2}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#57625B', lineHeight: 1.55, marginBottom: '16px' }}>
                {lang === 'hi'
                  ? 'सर्वर आर्किटेक्चर, रेस्टफुल एपीआई लेयर, डेटाबेस स्कीमा और कृषि डेटा मॉडल का विकास।'
                  : lang === 'mr'
                  ? 'सर्व्हर रचना, रेस्ट एपीआय, डेटाबेस स्कीमा आणि कृषी डेटा मॉडेल्सचे मुख्य विकासक.'
                  : 'Architected the server architecture, RESTful API layer, SQLite database schemas, and agricultural data models.'}
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#112019', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {lang === 'hi' ? 'प्रमुख योगदान:' : lang === 'mr' ? 'मुख्य योगदान:' : 'Key Contributions:'}
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#4B5550', lineHeight: 1.6 }}>
                  <li>{lang === 'hi' ? 'एक्सप्रेस रेस्ट एपीआई और सुरक्षित डेटा दृढ़ता' : lang === 'mr' ? 'एक्सप्रेस रेस्ट एपीआय व सुरक्षित डेटाबेस व्यवस्थापन' : 'Built Express REST API with pure WASM SQLite persistence'}</li>
                  <li>{lang === 'hi' ? 'रियल-टाइम एपीएमसी मंडी भाड़ा-कटौती मूल्य एल्गोरिदम' : lang === 'mr' ? 'थेट बाजारभाव भाडे-वजावट व सामाईक वाहतूक अल्गोरिदम' : 'Real-time APMC Mandi freight-deduction pricing and logistics pooling algorithms'}</li>
                  <li>{lang === 'hi' ? 'फसल मुनाफा कैलकुलेटर और राज्यवार कृषि प्रोफाइल एपीआई' : lang === 'mr' ? 'पीक खर्च-नफा गणक व राज्यनिहाय शेतकरी प्रोफाइल एपीआय' : 'Crop ROI yield calculator and state-wise agricultural profile APIs'}</li>
                </ul>
              </div>
            </div>

            {/* Team Member 3: Manthan Takerkhede */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '30px',
              border: '1.5px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 8px 24px rgba(17, 32, 25, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#386641',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(56, 102, 65, 0.25)'
                }}>
                  MT
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#112019', margin: 0 }}>
                    Manthan Takerkhede
                  </h3>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#386641', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.landing.teamRole3}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#57625B', lineHeight: 1.55, marginBottom: '16px' }}>
                {lang === 'hi'
                  ? 'ऑफलाइन एआई रोग निदान पाइपलाइन, वॉइस एग्रोनॉमिस्ट इंटरेक्शन और सॉफ्टवेयर उपयोगिता शोध।'
                  : lang === 'mr'
                  ? 'ऑफलाइन एआय रोग निदान, व्हॉईस कृषी मित्र संवाद मॉडेल व सॉफ्टवेअर उपयुक्तता संशोधन.'
                  : 'Engineered the edge AI diagnostic pipeline, voice agronomist interaction model, and software usability research metrics.'}
              </p>
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#112019', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {lang === 'hi' ? 'प्रमुख योगदान:' : lang === 'mr' ? 'मुख्य योगदान:' : 'Key Contributions:'}
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#4B5550', lineHeight: 1.6 }}>
                  <li>{lang === 'hi' ? 'ऑफलाइन एआई पत्ती रोग निदान और जैविक उपचार सिफारिशें' : lang === 'mr' ? 'ऑफलाइन एआय पानावरील रोग निदान व सेंद्रिय उपचार' : 'Offline Edge AI leaf disease diagnostic model with organic treatment regimens'}</li>
                  <li>{lang === 'hi' ? 'आवाज द्वारा प्रश्न पूछने और सुनने वाला वॉइस एग्रोनॉमिस्ट' : lang === 'mr' ? 'आवाजाद्वारे संवाद साधणारा बहुभाषिक व्हॉईस कृषी सल्लागार' : 'Voice STT & TTS conversational Agronomist with offline query fallback'}</li>
                  <li>{lang === 'hi' ? 'कम कनेक्टिविटी में तेज प्रदर्शन और सुगमता परीक्षण' : lang === 'mr' ? 'कमी इंटरनेटमध्ये वेगवान कार्यक्षमता व सुलभता चाचणी' : 'Usability heuristic benchmarking, low-connectivity resilience, and testing'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
