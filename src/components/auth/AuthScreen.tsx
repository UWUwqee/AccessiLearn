import React, { useState } from 'react';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleConnect = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to connect with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 relative z-10">
        
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-9 h-9 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AccessiLearn</h1>
            <p className="text-sm font-semibold text-indigo-300 mt-1">
              Inclusive & Accessible Learning Portal
            </p>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Empowering learners with tailored assistive tools, screen adaptations, and personalized accommodations.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {(localError || authError) && (
          <div
            role="alert"
            className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Google Authentication Box */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleConnect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-md transition-all transform active:scale-98 focus:outline-none focus:ring-4 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
            aria-label="Connect to Google"
          >
            {/* Google G icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Connect to Google'}</span>
          </button>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Supports institutional Google Workspace accounts (<span className="text-slate-300 font-medium">@*.edu.ph</span>) and personal Gmail accounts (<span className="text-slate-300 font-medium">@gmail.com</span>).
          </p>
        </div>

      </div>
    </div>
  );
};
