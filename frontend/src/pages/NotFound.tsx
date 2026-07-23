import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 space-y-5">
      <span className="text-[120px] select-none">🍂</span>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">Page Not Found (404)</h1>
      <p className="text-slate-500 max-w-md text-base leading-relaxed">
        The agricultural resource you are looking for has been harvested, moved, or is temporarily out of season.
      </p>
      <Link
        to="/dashboard"
        className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
