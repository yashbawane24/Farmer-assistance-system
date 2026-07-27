import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="flex justify-center items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-sans text-lg font-bold tracking-tight text-white">
            {t('common.brandName')}
          </span>
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} {t('common.brandName')} {t('footer.assistancePortal', 'Assistance Portal. All rights reserved.')}
        </p>
        <div className="flex justify-center gap-6 text-xs text-slate-500">
          <a href="#" className="hover:text-slate-300">{t('footer.privacyPolicy', 'Privacy Policy')}</a>
          <a href="#" className="hover:text-slate-300">{t('footer.termsOfService', 'Terms of Service')}</a>
          <a href="#" className="hover:text-slate-300">{t('footer.helpDesk', 'Help Desk')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
