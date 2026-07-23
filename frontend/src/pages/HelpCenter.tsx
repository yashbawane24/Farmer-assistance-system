import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { HelpCircle, PhoneCall, HelpCircle as HelpIcon, Send, Sparkles, Smile } from 'lucide-react';

const FAQList = [
  {
    q: 'How do I download the AI crop disease report?',
    a: 'Once you upload a crop leaf image on the Disease Detection page, the scanner diagnostic card details organic/chemical treatments. A "Download PDF Report" button is displayed at the bottom of the diagnosis card to compile a local PDF copy.'
  },
  {
    q: 'Can I bookmark government schemes and view them offline?',
    a: 'Yes, clicking the Bookmark icon on any scheme listing saves it to your account bookmarks list. Our system automatically caches schemes in local storage, allowing you to access them without internet access.'
  },
  {
    q: 'How do I operate the Voice Assistant?',
    a: 'Tap the green microphone floating button at the bottom-right of the dashboard. When the indicator changes to red/listening, speak out commands. Say "weather details" to check forecasts, "mandi prices" to check crop rates, or "read schemes" to listen to subsidy listings.'
  },
  {
    q: 'Who can I contact for physical verification queries?',
    a: 'You can query the central farmer helpline at our toll-free phone number 1800-123-4567. Regional advisors can also arrange field visits if needed.'
  }
];

const HelpCenter: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'usability' | 'feature' | 'bug' | 'other'>('usability');
  const [message, setMessage] = useState('');
  
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMsg('');
    setSubmitErr('');

    try {
      const response = await axios.post('/api/feedback', {
        name: user?.name || 'Anonymous Farmer',
        mobile: user?.mobile || '9999999999',
        rating,
        message,
        category: feedbackCategory
      });

      if (response.data.success) {
        setSubmitMsg(t('feedbackSuccess'));
        setMessage('');
        setRating(5);
      }
    } catch (err: any) {
      setSubmitErr('Failed to submit farmer feedback card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>❔</span> {t('helpCenterTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Access frequently asked questions, dial agriculture helpdesk, and submit system feedback.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: FAQ Catalog & Dial Support */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Support call banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 shrink-0">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Toll-Free Agricultural Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Speak directly with crop specialists and scheme registration agents.</p>
              <h4 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Dial 1800-123-4567</h4>
            </div>
          </div>

          {/* FAQs list */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HelpIcon className="h-5 w-5 text-primary-500" />
              Frequently Answered Queries
            </h3>

            <div className="space-y-3">
              {FAQList.map((faq, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{faq.q}</h4>
                  <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Feedback Submission Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmitFeedback} className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-md">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Smile className="h-5 w-5 text-primary-500" />
              {t('farmerFeedback')}
            </h3>

            {submitMsg && <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg">{submitMsg}</p>}
            {submitErr && <p className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">{submitErr}</p>}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t('ratingPrompt')}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setRating(stars)}
                    className={`h-10 w-10 text-lg font-bold rounded-full border transition-all ${
                      rating >= stars
                        ? 'border-amber-400 bg-amber-400 text-slate-900 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Feedback Category</label>
              <select
                value={feedbackCategory}
                onChange={(e: any) => setFeedbackCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
              >
                <option value="usability">Usability & Navigation</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Report a Bug / Issue</option>
                <option value="other">Other Queries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Message Description</label>
              <textarea
                required
                rows={4}
                placeholder="Type your feedback message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-primary-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default HelpCenter;
