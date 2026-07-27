import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Sprout, Cloud, ShieldAlert, IndianRupee, Volume2, ShieldCheck, HeartHandshake, PhoneCall, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import TeamSection from '../components/home/TeamSection';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { readTextAloud } = useAccessibility();
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const features = [
    {
      icon: Cloud,
      title: t('landing.featWeatherTitle'),
      desc: t('landing.featWeatherDesc')
    },
    {
      icon: Sprout,
      title: t('landing.featCropTitle'),
      desc: t('landing.featCropDesc')
    },
    {
      icon: ShieldAlert,
      title: t('landing.featDiseaseTitle'),
      desc: t('landing.featDiseaseDesc')
    },
    {
      icon: IndianRupee,
      title: t('landing.featMandiTitle'),
      desc: t('landing.featMandiDesc')
    }
  ];

  const benefits = [
    {
      icon: Volume2,
      title: t('landing.accVoiceTitle'),
      desc: t('landing.accVoiceDesc')
    },
    {
      icon: ShieldCheck,
      title: t('landing.accEaseTitle'),
      desc: t('landing.accEaseDesc')
    },
    {
      icon: HeartHandshake,
      title: t('landing.accSchemesTitle'),
      desc: t('landing.accSchemesDesc')
    }
  ];

  const faqs = [
    {
      q: t('landing.faq1Q'),
      a: t('landing.faq1A')
    },
    {
      q: t('landing.faq2Q'),
      a: t('landing.faq2A')
    },
    {
      q: t('landing.faq3Q'),
      a: t('landing.faq3A')
    }
  ];

  const toggleFaq = (index: number) => {
    setFaqOpen({ ...faqOpen, [index]: !faqOpen[index] });
  };

  const handleReadIntroduction = () => {
    readTextAloud(
      t('landing.heroTitle') + ". " + t('landing.heroSubtitle') + " " + t('landing.accessDashboard')
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/30 to-white dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-200/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                {t('landing.heroBadge')}
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white">
                {t('landing.heroTitle').split('with')[0]} {t('landing.heroTitle').includes('with') && 'with'} <br />
                <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  {t('landing.heroTitle').includes('with') ? t('landing.heroTitle').split('with')[1] : t('landing.heroTitle')}
                </span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300 mx-auto lg:mx-0">
                {t('landing.heroSubtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  to="/login"
                  className="rounded-xl bg-primary-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-primary-700 transition-all text-center"
                >
                  {t('landing.accessDashboard')}
                </Link>
                <button
                  onClick={handleReadIntroduction}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <Volume2 className="h-5 w-5 text-primary-500" />
                  {t('landing.listenAloud')}
                </button>
              </div>
            </div>

            {/* Illustration Card */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative glass-panel rounded-3xl p-6 shadow-xl max-w-sm border border-slate-200 dark:border-slate-800 text-center"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-white text-3xl shadow-lg">
                  🌾
                </div>
                <div className="pt-10 space-y-4">
                  <h3 className="text-xl font-bold">{t('landing.testimonialAuthor')}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('landing.testimonialQuote')}
                  </p>
                  <div className="flex justify-center text-amber-500 font-bold">⭐️⭐️⭐️⭐️⭐️</div>
                  <div className="text-xs text-primary-600 font-bold dark:text-primary-400">{t('landing.testimonialRole')}</div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{t('landing.featuresTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t('landing.featuresSubtitle')}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all space-y-4">
                  <div className="inline-flex p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accessibility & Voice Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            <div className="lg:col-span-5 flex justify-center">
              <span className="text-[140px] md:text-[180px] select-none">🚜</span>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <h2 className="text-3xl font-extrabold sm:text-4xl">{t('landing.accessibilityTitle')}</h2>
              
              <div className="space-y-6">
                {benefits.map((benefit, idx) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold">{benefit.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold">{t('landing.faqTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t('landing.faqSubtitle')}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/55"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen[idx] && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-8 md:p-12 shadow-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-tr from-emerald-500/10 via-transparent to-green-500/5">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              
              <div className="md:col-span-7 space-y-4">
                <h2 className="text-3xl font-extrabold">{t('landing.contactTitle')}</h2>
                <p className="text-slate-600 dark:text-slate-300">{t('landing.contactSubtitle')}</p>
                <div className="flex items-center gap-2 text-primary-600 font-bold text-xl dark:text-primary-400">
                  <PhoneCall className="h-6 w-6" />
                  <span>{t('landing.callTollFree')}</span>
                </div>
              </div>

              <div className="md:col-span-5">
                <form className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md" onSubmit={(e) => { e.preventDefault(); alert(t('landing.callbackSuccess')); }}>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">{t('landing.callbackName')}</label>
                    <input required type="text" className="w-full rounded-lg border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1">{t('landing.callbackPhone')}</label>
                    <input required type="tel" className="w-full rounded-lg border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm" />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary-600 p-3 text-sm font-bold text-white shadow-sm hover:bg-primary-700"
                  >
                    {t('landing.callbackButton')}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <TeamSection />

    </div>
  );
};

export default LandingPage;
