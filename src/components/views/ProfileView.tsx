import React, { useState } from 'react';
import {
  User,
  Mail,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  LogOut,
  Copy,
  Check,
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileViewProps {
  onNavigate: (tab: string) => void;
  onRequireAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, onRequireAuth }) => {
  const { user, userProfile, isVIP, isAdmin, logout, resendVerification } = useAuth();
  const [copiedUid, setCopiedUid] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <User className="w-12 h-12 text-neutral-600" />
        <h2 className="text-xl font-bold text-white">MovieNest User Profile</h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          Please sign in to view your account details, membership tier, and preferences.
        </p>
        <button
          onClick={onRequireAuth}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleResend = async () => {
    try {
      await resendVerification();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Profile Card */}
      <div className="ios-glass-elevated rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/25 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-700 border-2 border-white/25 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            {isVIP && (
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md border border-amber-300">
                VIP
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {user.displayName || user.email?.split('@')[0] || 'MovieNest Member'}
              </h2>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white uppercase tracking-wider border border-red-400/40">
                  Admin
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-300/80 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>{user.email}</span>
            </p>

            {/* Stable Unique User ID */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ios-glass border border-white/10 font-mono text-[11px] text-neutral-300">
                <Fingerprint className="w-3.5 h-3.5 text-neutral-400" />
                <span>UID: {user.uid}</span>
              </div>
              <button
                onClick={handleCopyUid}
                className="p-1.5 rounded-xl ios-glass hover:bg-white/15 text-neutral-400 hover:text-white transition active:scale-90"
                title="Copy User ID"
              >
                {copiedUid ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Verification banner if email not verified */}
        {!user.emailVerified && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Your email address has not been verified yet.</span>
            </div>
            <button
              onClick={handleResend}
              disabled={verificationSent}
              className="text-xs font-semibold text-amber-300 hover:underline disabled:opacity-50"
            >
              {verificationSent ? 'Verification Link Sent!' : 'Resend Verification'}
            </button>
          </div>
        )}

        {/* Membership Tier Box */}
        <div className="p-5 rounded-2xl ios-glass-card border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Subscription Status
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {isVIP ? 'MovieNest VIP Access' : 'Standard Free Tier'}
              </span>
              {isVIP && <ShieldCheck className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-neutral-300/80">
              {isVIP
                ? userProfile?.vipExpiresAt
                  ? `Active until ${new Date(userProfile.vipExpiresAt).toLocaleDateString()}`
                  : 'Lifetime or Admin Active'
                : 'Standard quality streaming with public CDN'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('vip')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 ${
              isVIP
                ? 'ios-glass-btn-secondary text-amber-300 border border-amber-400/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-600/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isVIP ? 'Renew / Extend VIP' : 'Upgrade to VIP'}</span>
          </button>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onNavigate('mylist')}
            className="p-4 rounded-2xl ios-glass-card border border-white/10 hover:border-white/20 text-left transition space-y-1.5 active:scale-95"
          >
            <Bookmark className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold text-white">My Watchlist</h4>
            <p className="text-[10px] text-neutral-400">Manage saved content</p>
          </button>

          <button
            onClick={() => onNavigate('mylist')}
            className="p-4 rounded-2xl ios-glass-card border border-white/10 hover:border-white/20 text-left transition space-y-1.5 active:scale-95"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Watch History</h4>
            <p className="text-[10px] text-neutral-400">Resume playback</p>
          </button>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-[11px] text-neutral-400">
            Account created: {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl ios-glass-btn-secondary text-neutral-300 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
