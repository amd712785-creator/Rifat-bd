import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Film,
  Tv,
  CheckCircle,
  XCircle,
  Server,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
  Shield,
  Eye,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllPayments,
  updatePaymentStatus,
  getAllReviews,
  deleteReview,
  getViewEvents,
  getAdminSettings,
  saveAdminSettings,
  getAllUsers,
} from '../../services/firestore';
import { fetchMovieDetails, fetchTVDetails } from '../../services/tmdb';
import { PaymentRequest, UserReview, ViewEvent, AdminSettings, VIPPlan } from '../../types';
import { HindiAdminSection } from './HindiAdminSection';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'payments' | 'hindi' | 'tmdb' | 'servers' | 'plans' | 'users' | 'reviews' | 'settings' | 'analytics'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [viewEvents, setViewEvents] = useState<ViewEvent[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // TMDB Import State
  const [tmdbIdInput, setTmdbIdInput] = useState('');
  const [tmdbTypeInput, setTmdbTypeInput] = useState<'movie' | 'tv'>('movie');
  const [importingTmdb, setImportingTmdb] = useState(false);
  const [importedPreview, setImportedPreview] = useState<any | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Action status message
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allP, allR, allU, allV, sett] = await Promise.all([
        getAllPayments(),
        getAllReviews(100),
        getAllUsers(100),
        getViewEvents(100),
        getAdminSettings(),
      ]);

      setPayments(allP);
      setReviews(allR);
      setUsersList(allU);
      setViewEvents(allV);
      setSettings(sett);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-neutral-400 max-w-md">
          Only authorized administrators (amd712785@gmail.com) can access this control center.
        </p>
      </div>
    );
  }

  // Payment approval / rejection
  const handlePaymentAction = async (
    payment: PaymentRequest,
    action: 'approved' | 'rejected'
  ) => {
    if (!user) return;
    const durationMap: Record<string, number> = {
      plan_7days: 7,
      plan_1month: 30,
      plan_3months: 90,
      plan_6months: 180,
      plan_1year: 365,
    };
    const days = durationMap[payment.planId] || 30;

    try {
      await updatePaymentStatus(payment.id, action, user.email || 'Admin', payment.userId, days);
      setPayments(
        payments.map((p) =>
          p.id === payment.id
            ? { ...p, status: action, reviewedBy: user.email || 'Admin', reviewedAt: new Date().toISOString() }
            : p
        )
      );
      setActionMessage(`Payment ${action.toUpperCase()} for ${payment.userEmail}`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Error updating payment: ${err.message}`);
    }
  };

  // Review delete
  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to remove this review?')) return;
    try {
      await deleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // TMDB Import preview
  const handleTmdbImportCheck = async () => {
    if (!tmdbIdInput.trim()) return;
    setImportingTmdb(true);
    setImportStatus(null);
    setImportedPreview(null);
    try {
      const data =
        tmdbTypeInput === 'movie'
          ? await fetchMovieDetails(tmdbIdInput.trim())
          : await fetchTVDetails(tmdbIdInput.trim());
      setImportedPreview(data);
      setImportStatus(`Found: ${data.title || data.name} (${data.vote_average?.toFixed(1)}/10)`);
    } catch (err: any) {
      setImportStatus(`Failed to fetch from TMDB: ${err.message}`);
    } finally {
      setImportingTmdb(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await saveAdminSettings(settings);
      setActionMessage('Website settings saved successfully!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const totalRevenueBDT = approvedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#11121d] p-6 rounded-3xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">MovieNest Admin Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
                Authorized
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Logged in as <span className="text-white font-mono">{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition"
        >
          Refresh Data
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-neutral-800">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'payments', label: `Payments (${pendingPayments.length})`, icon: CreditCard },
          { id: 'hindi', label: 'Hindi Movies & Playback', icon: Globe },
          { id: 'tmdb', label: 'TMDB Import', icon: Download },
          { id: 'servers', label: 'Video Servers', icon: Server },
          { id: 'plans', label: 'VIP Plans', icon: Sparkles },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'reviews', label: 'Reviews', icon: MessageSquare },
          { id: 'analytics', label: 'View Events', icon: Eye },
          { id: 'settings', label: 'Site Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#10111a] border border-neutral-800 space-y-2">
              <span className="text-xs font-medium text-neutral-400">Total Registered Users</span>
              <p className="text-3xl font-black text-white">{usersList.length}</p>
              <span className="text-[11px] text-neutral-500">Real database records</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#10111a] border border-neutral-800 space-y-2">
              <span className="text-xs font-medium text-neutral-400">Pending bKash Requests</span>
              <p className="text-3xl font-black text-amber-400">{pendingPayments.length}</p>
              <span className="text-[11px] text-neutral-500">Requires manual review</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#10111a] border border-neutral-800 space-y-2">
              <span className="text-xs font-medium text-neutral-400">Verified Revenue</span>
              <p className="text-3xl font-black text-emerald-400">৳{totalRevenueBDT} BDT</p>
              <span className="text-[11px] text-neutral-500">{approvedPayments.length} approved payments</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#10111a] border border-neutral-800 space-y-2">
              <span className="text-xs font-medium text-neutral-400">Playback View Events</span>
              <p className="text-3xl font-black text-white">{viewEvents.length}</p>
              <span className="text-[11px] text-neutral-500">Real streaming launches</span>
            </div>
          </div>

          {/* Quick pending approval preview */}
          {pendingPayments.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#12131d] border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Pending VIP Approval Requests ({pendingPayments.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs text-amber-400 hover:underline font-semibold"
                >
                  View All Payments →
                </button>
              </div>

              <div className="space-y-2">
                {pendingPayments.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{p.userEmail}</p>
                      <p className="text-[11px] text-neutral-400">
                        {p.planName} (৳{p.amount}) • bKash: {p.bKashNumber} • TrxID:{' '}
                        <span className="font-mono text-amber-300 font-bold">{p.trxId}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePaymentAction(p, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handlePaymentAction(p, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">Manual bKash Payment Verifications</h3>
            <span className="text-xs text-neutral-400">
              Payment Phone: <span className="font-mono text-pink-400">{settings?.paymentNumber}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">User Email</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">bKash Phone</th>
                  <th className="py-2.5 px-3">Trx ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-medium text-white">{p.userEmail}</td>
                    <td className="py-3 px-3">{p.planName}</td>
                    <td className="py-3 px-3">৳{p.amount}</td>
                    <td className="py-3 px-3 font-mono">{p.bKashNumber}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{p.trxId}</td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(p.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : p.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {p.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handlePaymentAction(p, 'approved')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handlePaymentAction(p, 'rejected')}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white font-semibold text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-neutral-500">
                          by {p.reviewedBy?.split('@')[0]}
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

      {/* Tab: HINDI MOVIES & PLAYBACK CONTROL */}
      {activeTab === 'hindi' && <HindiAdminSection />}

      {/* Tab: TMDB IMPORT */}
      {activeTab === 'tmdb' && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">TMDB Metadata Import & Verification</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Verify any TMDB title by ID. Real metadata is pulled directly from the TMDB API v3.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tmdbTypeInput}
              onChange={(e) => setTmdbTypeInput(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="movie">Movie</option>
              <option value="tv">TV Series</option>
            </select>

            <input
              type="text"
              placeholder="Enter TMDB ID (e.g. 550 for Fight Club, 1399 for Game of Thrones)"
              value={tmdbIdInput}
              onChange={(e) => setTmdbIdInput(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500"
            />

            <button
              onClick={handleTmdbImportCheck}
              disabled={importingTmdb}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              {importingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Fetch from TMDB</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs font-medium text-neutral-300">{importStatus}</p>
          )}

          {importedPreview && (
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-4">
              {importedPreview.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${importedPreview.poster_path}`}
                  alt=""
                  className="w-24 aspect-[2/3] object-cover rounded-lg"
                />
              )}
              <div className="space-y-1 text-xs">
                <h4 className="text-sm font-bold text-white">
                  {importedPreview.title || importedPreview.name}
                </h4>
                <p className="text-neutral-400 line-clamp-3">{importedPreview.overview}</p>
                <div className="flex gap-2 text-[11px] text-neutral-500 pt-1">
                  <span>Rating: {importedPreview.vote_average?.toFixed(1)}/10</span>
                  <span>Release: {importedPreview.release_date || importedPreview.first_air_date}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: VIDEO SERVERS */}
      {activeTab === 'servers' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Authorized Playback Server URLs</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Configure the iframe embed bases for Server 1 and Server 2.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Server 1 Base URL (Default CineSrc)
              </label>
              <input
                type="text"
                value={settings.server1BaseUrl}
                onChange={(e) =>
                  setSettings({ ...settings, server1BaseUrl: e.target.value })
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Formats: https://cinesrc.st/embed/movie/[tmdb_id] or https://cinesrc.st/embed/tv/[tmdb_id]?s=[season]&e=[episode]
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Server 2 Base URL (Mirror Provider)
              </label>
              <input
                type="text"
                value={settings.server2BaseUrl}
                onChange={(e) =>
                  setSettings({ ...settings, server2BaseUrl: e.target.value })
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Alternate fast mirror embed provider
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Server Configuration</span>
          </button>
        </form>
      )}

      {/* Tab: VIP PLANS */}
      {activeTab === 'plans' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">VIP Plan Pricing & bKash Number</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Adjust prices in BDT and official receiver number.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Official bKash Personal Number
            </label>
            <input
              type="text"
              value={settings.paymentNumber}
              onChange={(e) => setSettings({ ...settings, paymentNumber: e.target.value })}
              className="w-full sm:w-64 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-pink-400 font-mono font-bold"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Plan Prices (BDT)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(settings.plans || []).map((plan, idx) => (
                <div key={plan.id} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold text-white">{plan.name}</span>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-0.5">Price ৳ (BDT)</label>
                    <input
                      type="number"
                      value={plan.priceBDT}
                      onChange={(e) => {
                        const updated = [...(settings.plans || [])];
                        updated[idx].priceBDT = parseInt(e.target.value, 10) || 0;
                        setSettings({ ...settings, plans: updated });
                      }}
                      className="w-full bg-black/60 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save VIP Plan Pricing</span>
          </button>
        </form>
      )}

      {/* Tab: USERS */}
      {activeTab === 'users' && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">User Accounts Directory</h3>
            <span className="text-xs text-neutral-400">{usersList.length} registered accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2 px-3">UID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">VIP Status</th>
                  <th className="py-2 px-3">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {usersList.map((u) => (
                  <tr key={u.uid}>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">{u.uid.slice(0, 8)}...</td>
                    <td className="py-2.5 px-3 font-medium text-white">{u.displayName || '—'}</td>
                    <td className="py-2.5 px-3">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.isVIP ? (
                        <span className="text-amber-400 font-bold">VIP Active</span>
                      ) : (
                        <span className="text-neutral-500">Free</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500">
                      {u.vipExpiresAt ? new Date(u.vipExpiresAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">User Reviews Moderation</h3>
            <span className="text-xs text-neutral-400">{reviews.length} reviews loaded</span>
          </div>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{rev.userDisplayName}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-400 font-semibold">{rev.mediaTitle}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {rev.rating}/10
                    </span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">{rev.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 transition"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: ANALYTICS VIEW EVENTS */}
      {activeTab === 'analytics' && (
        <div className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">Real Playback View Events</h3>
            <span className="text-xs text-neutral-400">{viewEvents.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Media Type</th>
                  <th className="py-2 px-3">Media ID</th>
                  <th className="py-2 px-3">User UID</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {viewEvents.map((evt, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-white">{evt.title}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">{evt.mediaType}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-400">{evt.mediaId}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">{evt.userId?.slice(0, 8)}...</td>
                    <td className="py-2.5 px-3 text-neutral-500">{new Date(evt.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SITE SETTINGS & ADS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-[#10111a] p-6 rounded-2xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Website & AdSense Configuration</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Configure AdSense publisher slots and global announcements.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Global Header Announcement
              </label>
              <input
                type="text"
                value={settings.announcementNotice || ''}
                onChange={(e) => setSettings({ ...settings, announcementNotice: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">AdSense Integration</h4>
                  <p className="text-[11px] text-neutral-400">
                    Only active when valid publisher ID is provided.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.adPlacements?.enabled || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adPlacements: {
                        ...settings.adPlacements,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-red-600 bg-neutral-800 border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Google AdSense Publisher ID
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={settings.adPlacements?.publisherId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adPlacements: {
                        ...settings.adPlacements,
                        publisherId: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </form>
      )}
    </div>
  );
};
