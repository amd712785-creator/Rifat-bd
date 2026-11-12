import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle, Film, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  message,
}) => {
  const { loginWithEmail, registerWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) throw new Error('Please enter both email and password.');
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!email || !password) throw new Error('Please enter email and password.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');
        await registerWithEmail(email, password, name);
        setSuccess('Account created! A verification link was sent to your email.');
        setTimeout(() => onClose(), 1500);
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your account email.');
        await resetPassword(email);
        setSuccess('Password reset link sent to your email inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-ios-backdrop">
      <div className="relative w-full max-w-md ios-glass-elevated rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden p-6 sm:p-8 animate-ios-modal">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full ios-glass hover:bg-white/20 text-neutral-300 hover:text-white border border-white/20 transition active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/movienest-logo.png"
            alt="MovieNest Logo"
            className="h-16 w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(239,68,68,0.45)] mb-3"
          />
          <h3 className="text-xl font-black text-white tracking-tight">
            {mode === 'login'
              ? 'Welcome Back to MovieNest'
              : mode === 'register'
              ? 'Join MovieNest Free'
              : 'Reset Your Password'}
          </h3>
          <p className="text-xs text-neutral-300/80 mt-1 max-w-xs leading-relaxed">
            {message ||
              (mode === 'login'
                ? 'Sign in to access your Watchlist, Watch History, and HD playback'
                : mode === 'register'
                ? 'Create an account to start streaming movies, TV shows, and live TV'
                : 'Enter your email to receive recovery instructions')}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Google One-Click Auth */}
        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl ios-glass-btn-secondary text-white font-medium text-xs flex items-center justify-center gap-3 transition shadow-sm disabled:opacity-50 active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#11121d] px-3 text-[11px] text-neutral-400 uppercase tracking-wider">
                Or with Email
              </span>
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Alex Drake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] transition"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] transition"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] transition"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl ios-glass-btn-primary text-white text-xs font-bold shadow-[0_12px_32px_rgba(239,68,68,0.45)] flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'Sign In to MovieNest'
                    : mode === 'register'
                    ? 'Create Free Account'
                    : 'Send Password Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 text-center text-xs text-neutral-400 border-t border-white/10 pt-4">
          {mode === 'login' ? (
            <p>
              New to MovieNest?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-bold text-red-400 hover:text-red-300 transition"
              >
                Sign up now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-red-400 hover:text-red-300 transition"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
