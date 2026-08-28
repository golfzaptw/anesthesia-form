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
  signOut as firebaseSignOut,
  deleteUser as deleteAuthUser,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getOrCreateUserDoc, nameToSlug, getFormConfig } from "@/lib/firestore";
import { IS_MOCK } from "@/lib/mockMode";
import {
  mockOnAuthStateChanged,
  mockSignIn,
  mockSignOut,
  mockSignUp,
  mockRegisterGuest,
  mockLoginGuest,
} from "@/lib/mockStore";
import type { AppUser, FormId } from "@/types";

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
    const conf = await getFormConfig();
    const currentBatch = conf.currentBatch ?? 42;
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName });
    await getOrCreateUserDoc(newUser.uid, email, displayName, currentBatch);
    setUser({ uid: newUser.uid, email, displayName });
  };

  const signIn = async (email: string, password: string) => {
    if (IS_MOCK) return mockSignIn(email, password);
    const { user: existingUser } = await signInWithEmailAndPassword(auth, email, password);
    const conf = await getFormConfig();
    const currentBatch = conf.currentBatch ?? 42;
    await getOrCreateUserDoc(
      existingUser.uid,
      existingUser.email ?? "",
      existingUser.displayName ?? "",
      currentBatch
    );
  };

  const registerAsGuest = async (displayName: string) => {
    if (IS_MOCK) return mockRegisterGuest(displayName);
    const conf = await getFormConfig();
    const currentBatch = conf.currentBatch ?? 42;
    const trimmedName = displayName.trim();
    const slug = nameToSlug(trimmedName);
    const batchSlug = currentBatch === 42 ? slug : `${currentBatch}_${slug}`;

    // 1. Direct check on evaluator_names document
    const nameRef = doc(db, "evaluator_names", batchSlug);
    const nameSnap = await getDoc(nameRef);
    if (nameSnap.exists()) {
      throw new Error("auth/display-name-already-in-use");
    }

    const uniqueEmail = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@evaluator.local`;
    const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();

    // 2. Create fresh Firebase Auth user
    const { user: guestUser } = await createUserWithEmailAndPassword(auth, uniqueEmail, generatedPassword);

    try {
      await updateProfile(guestUser, { displayName: trimmedName });

      // 3. Save to both evaluator_names and users
      await Promise.all([
        setDoc(nameRef, {
          uid: guestUser.uid,
          email: uniqueEmail,
          displayName: trimmedName,
          batchId: currentBatch,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, "users", guestUser.uid), {
          email: uniqueEmail,
          displayName: trimmedName,
          createdAt: serverTimestamp(),
          completedForms: [] as FormId[],
          completedFormsByBatch: {} as Record<string, FormId[]>,
          batchId: currentBatch,
          batches: [currentBatch],
        }),
      ]);

      setUser({ uid: guestUser.uid, email: uniqueEmail, displayName: trimmedName });
      return generatedPassword;
    } catch (err) {
      if (auth.currentUser && auth.currentUser.uid === guestUser.uid) {
        await deleteAuthUser(guestUser).catch(() => {});
        await firebaseSignOut(auth);
      }
      throw err;
    }
  };

  const loginAsGuest = async (displayName: string, password: string) => {
    if (IS_MOCK) return mockLoginGuest(displayName, password);
    const conf = await getFormConfig();
    const currentBatch = conf.currentBatch ?? 42;
    const trimmedName = displayName.trim();
    const trimmedPass = password.trim();
    const slug = nameToSlug(trimmedName);
    const batchSlug = currentBatch === 42 ? slug : `${currentBatch}_${slug}`;

    let nameRef = doc(db, "evaluator_names", batchSlug);
    let nameSnap = await getDoc(nameRef);
    if (!nameSnap.exists() && currentBatch !== 42) {
      nameRef = doc(db, "evaluator_names", slug);
      nameSnap = await getDoc(nameRef);
    }

    let targetEmail: string;
    if (nameSnap.exists()) {
      targetEmail = nameSnap.data().email as string;
    } else {
      // Fallback for legacy accounts
      targetEmail = `${trimmedName.toLowerCase().replace(/\s+/g, "-")}@evaluator.local`;
    }

    const { user: guestUser } = await signInWithEmailAndPassword(auth, targetEmail, trimmedPass);
    setUser({ uid: guestUser.uid, email: guestUser.email, displayName: guestUser.displayName || trimmedName });
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
