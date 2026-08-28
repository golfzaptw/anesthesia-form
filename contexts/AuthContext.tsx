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
  deleteUser as deleteAuthUser,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
    const trimmedName = displayName.trim();
    const uniqueEmail = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@evaluator.local`;
    const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();

    // 1. Create a fresh Firebase Auth user
    const { user: guestUser } = await createUserWithEmailAndPassword(auth, uniqueEmail, generatedPassword);

    try {
      // 2. Check if an active user with this displayName already exists in Firestore
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("displayName", "==", trimmedName))
      );

      const existingActive = usersSnap.docs.filter((d) => d.id !== guestUser.uid);
      if (existingActive.length > 0) {
        // Clean up the newly created Auth user immediately
        await deleteAuthUser(guestUser).catch(() => {});
        await firebaseSignOut(auth);
        throw new Error("auth/display-name-already-in-use");
      }

      // 3. Save to Firestore
      await updateProfile(guestUser, { displayName: trimmedName });
      await setDoc(doc(db, "users", guestUser.uid), {
        email: uniqueEmail,
        displayName: trimmedName,
        guestPassword: generatedPassword,
        createdAt: serverTimestamp(),
        completedForms: [] as FormId[],
      });

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
    const trimmedName = displayName.trim();
    const trimmedPass = password.trim();

    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch {
        // Anonymous auth not enabled, proceed to query directly
      }
    }

    const usersSnap = await getDocs(
      query(collection(db, "users"), where("displayName", "==", trimmedName))
    );

    if (usersSnap.empty) {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        await firebaseSignOut(auth);
      }
      throw new Error("auth/user-not-found");
    }

    const userDocData = usersSnap.docs[0].data();
    const userEmail = userDocData.email as string;

    const { user: guestUser } = await signInWithEmailAndPassword(auth, userEmail, trimmedPass);
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
