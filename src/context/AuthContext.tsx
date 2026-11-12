import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirestoreConnection } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVIP: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['amd712785@gmail.com', 'rifatyt123042@gmail.com'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Test connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const fetchProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userRef);
      const isConfiguredAdmin = !!(firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase()));

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If email matches designated admin but role isn't admin, sync role
        if (isConfiguredAdmin && data.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin' });
          data.role = 'admin';
        }
        setUserProfile(data);
        return data;
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
          photoURL: firebaseUser.photoURL || '',
          role: isConfiguredAdmin ? 'admin' : 'user',
          isVIP: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser);
        } catch (e) {
          console.error('Failed to load user profile', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchProfile(res.user);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Google sign-in failed');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await fetchProfile(res.user);
      }
    } catch (err: any) {
      let msg = err.message || 'Login failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later.';
      }
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        // Send email verification
        try {
          await sendEmailVerification(res.user);
        } catch (vErr) {
          console.warn('Verification email could not be sent', vErr);
        }

        const isConfiguredAdmin = !!(res.user.email && ADMIN_EMAILS.includes(res.user.email.toLowerCase()));
        const initialProfile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: name.trim() || email.split('@')[0],
          photoURL: '',
          role: isConfiguredAdmin ? 'admin' : 'user',
          isVIP: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err: any) {
      let msg = err.message || 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      throw new Error(msg);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send password reset email');
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  // Check VIP validity (must be isVIP and not expired)
  const isVIP = React.useMemo(() => {
    if (!userProfile?.isVIP) return false;
    if (!userProfile.vipExpiresAt) return true;
    return new Date(userProfile.vipExpiresAt).getTime() > Date.now();
  }, [userProfile]);

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
    return userProfile?.role === 'admin';
  }, [user, userProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isVIP,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerification,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
