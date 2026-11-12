import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Send,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VIPPlan, PaymentRequest } from '../../types';
import {
  getAdminSettings,
  submitPayment,
  getUserPayments,
  DEFAULT_PLANS,
} from '../../services/firestore';

interface VipPageProps {
  onRequireAuth: () => void;
}

export const VipPage: React.FC<VipPageProps> = ({ onRequireAuth }) => {
  const { user, userProfile, isVIP } = useAuth();
  const [plans, setPlans] = useState<VIPPlan[]>(DEFAULT_PLANS);
  const [paymentNumber, setPaymentNumber] = useState('01648335782');
  const [userPayments, setUserPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal payment state
  const [selectedPlan, setSelectedPlan] = useState<VIPPlan | null>(null);
  const [senderBkashNumber, setSenderBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const settings = await getAdminSettings();
        if (mounted) {
          if (settings.plans && settings.plans.length > 0) {
            setPlans(settings.plans);
          }
          if (settings.paymentNumber) {
            setPaymentNumber(settings.paymentNumber);
          }
        }

        if (user) {
          const payments = await getUserPayments(user.uid);
          if (mounted) setUserPayments(payments);
        }
      } catch (err) {
        console.error('Error loading VIP settings', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPayment = (plan: VIPPlan) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setSelectedPlan(plan);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;
    if (!trxId.trim()) {
      setSubmitError('Please enter the bKash Transaction ID (TrxID).');
      return;
    }
    if (!senderBkashNumber.trim()) {
      setSubmitError('Please enter your bKash mobile number.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const paymentId = await submitPayment({
        userId: user.uid,
        userEmail: user.email || '',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.priceBDT,
        bKashNumber: senderBkashNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
      });

      const newRecord: PaymentRequest = {
        id: paymentId,
        userId: user.uid,
        userEmail: user.email || '',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.priceBDT,
        bKashNumber: senderBkashNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      setUserPayments([newRecord, ...userPayments]);
      setSubmitSuccess('Payment submitted! Admin will verify and activate your VIP access.');
      setSenderBkashNumber('');
      setTrxId('');
      setTimeout(() => {
        setSelectedPlan(null);
        setSubmitSuccess(null);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-neutral-900 via-[#181216] to-[#120a10] border border-amber-500/20 p-8 sm:p-12 text-center shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400" />
          MOVIE NEST VIP PASS
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Unlock Unlimited <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">VIP Streaming</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto mt-3 leading-relaxed">
          Stream movies and TV series in crystal-clear 4K UHD, enjoy premium high-speed mirrors, unlock VIP Live TV channels, and stream completely ad-free.
        </p>

        {/* Current status chip */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {isVIP ? (
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 shadow">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                VIP Active {userProfile?.vipExpiresAt && `(Expires: ${new Date(userProfile.vipExpiresAt).toLocaleDateString()})`}
              </span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs font-medium">
              Current Membership: <span className="text-white font-bold">Standard Free</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isHighlight = plan.badge === 'Popular' || plan.badge === 'Best Value';
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                isHighlight
                  ? 'bg-[#15121c] border-2 border-amber-500/60 shadow-xl shadow-amber-950/20 scale-[1.02]'
                  : 'bg-[#10111a] border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-neutral-400">{plan.durationDays} Days Unlimited</p>

                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">৳{plan.priceBDT}</span>
                  <span className="text-xs text-neutral-400 font-medium">BDT</span>
                </div>

                <div className="border-t border-neutral-800/80 my-4" />

                <ul className="space-y-2.5 text-xs text-neutral-300 mb-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment(plan)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 ${
                  isHighlight
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-600/30'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Select Plan</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Manual bKash Payment Instructions Guide */}
      <div className="bg-[#10111a] p-6 sm:p-8 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center">
            <span className="text-pink-500 font-black text-sm">bKash</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">How Manual bKash Payment Works</h3>
            <p className="text-xs text-neutral-400">
              Safe, direct transfer verified by our support staff
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white">Send Money via bKash</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Open your bKash app and send the exact plan amount to our official bKash Personal number:
            </p>
            <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-neutral-800 font-mono text-xs text-pink-400 font-bold">
              <span>{paymentNumber}</span>
              <button
                onClick={handleCopyNumber}
                className="text-neutral-400 hover:text-white p-1"
                title="Copy Number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>}
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white">Copy Transaction ID</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Once the transfer completes, copy the 8-10 digit Transaction ID (e.g. <span className="font-mono text-white">BLM7892K</span>) from your bKash SMS or app.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white">Submit for Verification</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Submit your bKash phone number and Transaction ID. Admin verifies the statement and activates VIP within minutes.
            </p>
          </div>
        </div>
      </div>

      {/* User Submission History */}
      {user && userPayments.length > 0 && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Your Payment History</h3>
            </div>
            <span className="text-xs text-neutral-400">{userPayments.length} submissions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Trx ID</th>
                  <th className="py-2.5 px-3">Submitted</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {userPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-semibold text-white">{p.planName}</td>
                    <td className="py-3 px-3">৳{p.amount} BDT</td>
                    <td className="py-3 px-3 font-mono text-neutral-400">{p.trxId}</td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(p.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : p.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Pending Admin Approval
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Submission Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#12131d] rounded-2xl border border-neutral-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  bKash Payment Verification
                </span>
                <h3 className="text-lg font-bold text-white">{selectedPlan.name}</h3>
                <p className="text-xs text-neutral-400">Total: ৳{selectedPlan.priceBDT} BDT</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span>Send Money to bKash Number:</span>
                <button
                  onClick={handleCopyNumber}
                  className="text-pink-400 hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  {paymentNumber} <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Send ৳{selectedPlan.priceBDT} BDT via 'Send Money'. Then enter your sender number & Transaction ID below.
              </p>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Your bKash Mobile Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderBkashNumber}
                  onChange={(e) => setSenderBkashNumber(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Transaction ID (TrxID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9J8AKL12"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Payment Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
