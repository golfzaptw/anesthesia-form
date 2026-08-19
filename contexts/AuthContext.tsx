"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getOrCreateUserDoc } from "@/lib/firestore";
import { IS_MOCK } from "@/lib/mockMode";
import {
  mockOnAuthStateChanged,
  mockSignIn,
  mockSignOut,
  mockSignUp,
  mockRegisterGuest,
  mockLoginGuest,
} from "@/lib/mockStore";
import type { AppUser } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  registerAsGuest: (displayName: string) => Promise<string>;
  loginAsGuest: (displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_MOCK) {
      return mockOnAuthStateChanged((mockUser) => {
        setUser(mockUser);
        setLoading(false);
      });
    }
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            }
          : null
      );
      setLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    if (IS_MOCK) return mockSignUp(email, password, displayName);
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName });
    await getOrCreateUserDoc(newUser.uid, email, displayName);
    setUser({ uid: newUser.uid, email, displayName });
  };

  const signIn = async (email: string, password: string) => {
    if (IS_MOCK) return mockSignIn(email, password);
    const { user: existingUser } = await signInWithEmailAndPassword(auth, email, password);
    await getOrCreateUserDoc(
      existingUser.uid,
      existingUser.email ?? "",
      existingUser.displayName ?? ""
    );
  };

  const registerAsGuest = async (displayName: string) => {
    if (IS_MOCK) return mockRegisterGuest(displayName);
    const slug = displayName.toLowerCase().replace(/\s+/g, "-");
    const email = `${slug}@evaluator.local`;
    const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();
    const { user: guestUser } = await createUserWithEmailAndPassword(auth, email, generatedPassword);
    await updateProfile(guestUser, { displayName });
    await getOrCreateUserDoc(guestUser.uid, email, displayName);
    setUser({ uid: guestUser.uid, email, displayName });
    return generatedPassword;
  };

  const loginAsGuest = async (displayName: string, password: string) => {
    if (IS_MOCK) return mockLoginGuest(displayName, password);
    const slug = displayName.toLowerCase().replace(/\s+/g, "-");
    const email = `${slug}@evaluator.local`;
    const { user: guestUser } = await signInWithEmailAndPassword(auth, email, password);
    await getOrCreateUserDoc(guestUser.uid, email, displayName);
    setUser({ uid: guestUser.uid, email, displayName });
  };

  const signOut = async () => {
    if (IS_MOCK) return mockSignOut();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, registerAsGuest, loginAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
