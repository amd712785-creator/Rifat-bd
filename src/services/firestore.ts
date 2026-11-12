import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  WatchlistItem,
  WatchHistoryItem,
  UserReview,
  PaymentRequest,
  LiveTvFavorite,
  ViewEvent,
  AdminSettings,
  VIPPlan,
} from '../types';

export const DEFAULT_PLANS: VIPPlan[] = [
  {
    id: 'plan_7days',
    name: '7 Days Access',
    durationDays: 7,
    priceBDT: 50,
    features: ['Ultra HD / 4K Playback', 'Multi-server access', 'Zero Ads', 'Fast CDN Priority'],
  },
  {
    id: 'plan_1month',
    name: '1 Month Standard',
    durationDays: 30,
    priceBDT: 150,
    badge: 'Popular',
    features: ['Ultra HD / 4K Playback', 'Multi-server access', 'Zero Ads', 'VIP Live TV Streams'],
  },
  {
    id: 'plan_3months',
    name: '3 Months Quarter',
    durationDays: 90,
    priceBDT: 400,
    features: ['All VIP Features', 'Priority Support', 'Save 11% compared to monthly', 'Unlimited Devices'],
  },
  {
    id: 'plan_6months',
    name: '6 Months Half-Year',
    durationDays: 180,
    priceBDT: 750,
    badge: 'Best Value',
    features: ['All VIP Features', 'Save 17% discount', 'Full Access to 4K mirrors', 'VIP Discord / Support'],
  },
  {
    id: 'plan_1year',
    name: '1 Year Annual Pass',
    durationDays: 365,
    priceBDT: 1400,
    badge: 'Ultimate Saver',
    features: ['All VIP Features', 'Full 365 days coverage', 'Maximum savings', 'VIP Badge on Profile'],
  },
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  paymentNumber: '01648335782',
  server1BaseUrl: 'https://cinesrc.st/embed',
  server2BaseUrl: 'https://vidsrc.to/embed',
  adPlacements: {
    enabled: false,
    publisherId: '',
    headerSlotId: '',
    playerBottomSlotId: '',
    sidebarSlotId: '',
  },
  announcementNotice: 'Welcome to MovieNest! Enjoy cinema-quality streaming in full HD.',
  plans: DEFAULT_PLANS,
};

/**
 * Recursively strips undefined fields from an object so Firestore operations never fail
 * with "Unsupported field value: undefined".
 */
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

// ----------------- WATCHLIST ----------------- //

export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<string> {
  const path = 'watchlists';
  try {
    const docId = `${item.userId}_${item.mediaType}_${item.mediaId}`;
    const docRef = doc(db, path, docId);
    const dataToSave = cleanUndefined({
      ...item,
      posterPath: item.posterPath || null,
      releaseDate: item.releaseDate || '',
      addedAt: new Date().toISOString(),
    });
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function removeFromWatchlist(userId: string, mediaType: string, mediaId: string): Promise<void> {
  const path = 'watchlists';
  try {
    const docId = `${userId}_${mediaType}_${mediaId}`;
    await deleteDoc(doc(db, path, docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function isMediaInWatchlist(userId: string, mediaType: string, mediaId: string): Promise<boolean> {
  const path = 'watchlists';
  try {
    const docId = `${userId}_${mediaType}_${mediaId}`;
    const snap = await getDoc(doc(db, path, docId));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return false;
  }
}

export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const path = 'watchlists';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('addedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ----------------- WATCH HISTORY ----------------- //

export async function recordWatchHistory(item: Omit<WatchHistoryItem, 'id' | 'watchedAt'>): Promise<void> {
  const path = 'watchHistory';
  try {
    const docId = `${item.userId}_${item.mediaType}_${item.mediaId}`;
    const docRef = doc(db, path, docId);
    
    // Explicitly construct fields and ensure NO undefined values are passed to Firestore
    const dataToSave: Record<string, any> = {
      userId: item.userId,
      mediaId: String(item.mediaId),
      mediaType: item.mediaType,
      title: item.title,
      watchedAt: new Date().toISOString(),
    };
    if (item.posterPath) {
      dataToSave.posterPath = item.posterPath;
    }
    if (item.mediaType === 'tv') {
      if (typeof item.season === 'number') {
        dataToSave.season = item.season;
      }
      if (typeof item.episode === 'number') {
        dataToSave.episode = item.episode;
      }
    }

    await setDoc(docRef, cleanUndefined(dataToSave), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  const path = 'watchHistory';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('watchedAt', 'desc'),
      limit(40)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ----------------- REVIEWS ----------------- //

export async function addReview(review: Omit<UserReview, 'id' | 'createdAt'>): Promise<string> {
  const path = 'reviews';
  try {
    const dataToSave = cleanUndefined({
      ...review,
      userPhoto: review.userPhoto || '',
      createdAt: new Date().toISOString(),
    });
    const docRef = await addDoc(collection(db, path), dataToSave);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getMediaReviews(mediaId: string, mediaType: 'movie' | 'tv'): Promise<UserReview[]> {
  const path = 'reviews';
  try {
    const q = query(
      collection(db, path),
      where('mediaId', '==', mediaId),
      where('mediaType', '==', mediaType),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function getAllReviews(limitCount = 50): Promise<UserReview[]> {
  const path = 'reviews';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  const path = 'reviews';
  try {
    await deleteDoc(doc(db, path, reviewId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ----------------- PAYMENTS (VIP) ----------------- //

export async function submitPayment(
  data: Omit<PaymentRequest, 'id' | 'status' | 'submittedAt'>
): Promise<string> {
  const path = 'payments';
  try {
    const dataToSave = cleanUndefined({
      ...data,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });
    const docRef = await addDoc(collection(db, path), dataToSave);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getUserPayments(userId: string): Promise<PaymentRequest[]> {
  const path = 'payments';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function getAllPayments(): Promise<PaymentRequest[]> {
  const path = 'payments';
  try {
    const q = query(collection(db, path), orderBy('submittedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'approved' | 'rejected',
  reviewedByEmail: string,
  targetUserId: string,
  durationDays: number
): Promise<void> {
  const path = 'payments';
  try {
    const paymentRef = doc(db, path, paymentId);
    await updateDoc(paymentRef, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedByEmail,
    });

    if (status === 'approved') {
      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      let expiry = new Date();
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.vipExpiresAt && new Date(uData.vipExpiresAt).getTime() > Date.now()) {
          expiry = new Date(uData.vipExpiresAt);
        }
      }
      expiry.setDate(expiry.getDate() + durationDays);

      await updateDoc(userRef, {
        isVIP: true,
        vipExpiresAt: expiry.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// ----------------- LIVE TV FAVORITES ----------------- //

export async function toggleLiveTvFavorite(item: LiveTvFavorite): Promise<boolean> {
  const path = 'liveTvFavorites';
  try {
    const docId = `${item.userId}_${item.channelId}`;
    const docRef = doc(db, path, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await deleteDoc(docRef);
      return false;
    } else {
      const dataToSave = cleanUndefined({
        userId: item.userId,
        channelId: item.channelId,
        name: item.name,
        logo: item.logo || '',
        country: item.country || '',
        category: item.category || '',
      });
      await setDoc(docRef, dataToSave);
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function getUserLiveTvFavorites(userId: string): Promise<LiveTvFavorite[]> {
  const path = 'liveTvFavorites';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ----------------- VIEW EVENTS (ANALYTICS) ----------------- //

export async function logViewEvent(event: Omit<ViewEvent, 'timestamp'>): Promise<void> {
  const path = 'viewEvents';
  try {
    await addDoc(collection(db, path), {
      ...event,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal analytics logging
    console.warn('Analytics event log error', err);
  }
}

export async function getViewEvents(limitCount = 100): Promise<ViewEvent[]> {
  const path = 'viewEvents';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ----------------- ADMIN SETTINGS ----------------- //

export async function getAdminSettings(): Promise<AdminSettings> {
  const path = 'adminSettings';
  try {
    const docRef = doc(db, path, 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_ADMIN_SETTINGS, ...snap.data() } as AdminSettings;
    } else {
      return DEFAULT_ADMIN_SETTINGS;
    }
  } catch (err) {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
  const path = 'adminSettings';
  try {
    const docRef = doc(db, path, 'global');
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// ----------------- USERS LIST (ADMIN) ----------------- //

export async function getAllUsers(limitCount = 100) {
  const path = 'users';
  try {
    const q = query(collection(db, path), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}
