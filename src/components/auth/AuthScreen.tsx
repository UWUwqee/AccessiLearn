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
    <div className="auth-shell min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -left-20 top-20 h-72 w-72 animate-float rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 animate-float rounded-full bg-cyan-500/15 blur-3xl" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="auth-intro animate-fade-up space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-white md:text-6xl">
                AccessiLearn
              </h1>
              <p className="max-w-xl text-base text-slate-300 md:text-lg">
                A support platform for learners.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {['WCAG-informed design', 'Google Classroom sync', 'Personalized accommodations'].map((item) => (
                <span
                  key={item}
                  className="auth-feature-pill rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-400/70 hover:bg-indigo-500/10"
                >
                  {item}
                </span>
              ))}
            </div>

          </div>

          <div className="auth-panel auth-card animate-fade-up rounded-[28px] p-6 shadow-2xl shadow-indigo-950/40">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="animate-pulse-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">AccessiLearn</p>
                  <p className="text-xs text-slate-400">Student access portal</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Connect your account</p>
                <p className="mt-2 text-sm text-slate-200">
                  Use your school or personal Google account to access your learning dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={loading}
                className="shimmer-button flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-slate-950/30 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500 disabled:opacity-70"
                aria-label="Connect to Google"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              {(localError || authError) && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                  <span>{localError || authError}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
