import type { AppUser, FormId, FormSubmission, StoredSubmission, UserSummary } from "@/types";

const USERS_KEY = "mock_users";
const SESSION_KEY = "mock_session";
const SUBMISSIONS_KEY = "mock_submissions";

interface MockUserRecord {
  uid: string;
  email: string;
  displayName: string;
  password: string;
  completedForms: FormId[];
  createdAt: string;
}

type Listener = (user: AppUser | null) => void;
const listeners = new Set<Listener>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getUsers(): MockUserRecord[] {
  return read<MockUserRecord[]>(USERS_KEY, []);
}

function notify(user: AppUser | null): void {
  listeners.forEach((fn) => fn(user));
}

// Small delay so loading states behave like the real network.
const delay = () => new Promise((r) => setTimeout(r, 250));

export function mockGetCurrentUser(): AppUser | null {
  return read<AppUser | null>(SESSION_KEY, null);
}

export function mockOnAuthStateChanged(listener: Listener): () => void {
  listeners.add(listener);
  listener(mockGetCurrentUser());
  return () => listeners.delete(listener);
}

export async function mockSignUp(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  await delay();
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error("auth/email-already-in-use");
  }
  const record: MockUserRecord = {
    uid: `mock_${Date.now()}`,
    email,
    displayName,
    password,
    completedForms: [],
    createdAt: new Date().toISOString(),
  };
  write(USERS_KEY, [...users, record]);

  const session: AppUser = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
  };
  write(SESSION_KEY, session);
  notify(session);
}

export async function mockSignIn(email: string, password: string): Promise<void> {
  await delay();
  const found = getUsers().find((u) => u.email === email);
  if (!found) throw new Error("auth/user-not-found");
  if (found.password !== password) throw new Error("auth/wrong-password");

  const session: AppUser = {
    uid: found.uid,
    email: found.email,
    displayName: found.displayName,
  };
  write(SESSION_KEY, session);
  notify(session);
}

export async function mockSignOut(): Promise<void> {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  notify(null);
}

export async function mockRegisterGuest(displayName: string): Promise<string> {
  await delay();
  const users = getUsers();
  const slug = displayName.toLowerCase().replace(/\s+/g, "-");
  const email = `${slug}@evaluator.local`;

  if (users.some((u) => u.email === email)) {
    throw new Error("auth/email-already-in-use");
  }

  const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();
  
  const record: MockUserRecord = {
    uid: `guest_${Date.now()}`,
    email,
    displayName,
    password: generatedPassword,
    completedForms: [],
    createdAt: new Date().toISOString(),
  };
  write(USERS_KEY, [...users, record]);

  const session: AppUser = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
  };
  write(SESSION_KEY, session);
  notify(session);

  return generatedPassword;
}

export async function mockLoginGuest(displayName: string, password: string): Promise<void> {
  const slug = displayName.toLowerCase().replace(/\s+/g, "-");
  const email = `${slug}@evaluator.local`;
  return mockSignIn(email, password);
}

export async function mockGetCompletedForms(uid: string): Promise<FormId[]> {
  await delay();
  return getUsers().find((u) => u.uid === uid)?.completedForms ?? [];
}

export async function mockMarkFormComplete(uid: string, formId: FormId): Promise<void> {
  const users = getUsers().map((u) =>
    u.uid === uid && !u.completedForms.includes(formId)
      ? { ...u, completedForms: [...u.completedForms, formId] }
      : u
  );
  write(USERS_KEY, users);
}

export async function mockSubmitFormResponse(
  payload: Omit<FormSubmission, "submittedAt">
): Promise<void> {
  await delay();
  const all = read<unknown[]>(SUBMISSIONS_KEY, []);
  write(SUBMISSIONS_KEY, [
    ...all,
    { ...payload, submittedAt: new Date().toISOString() },
  ]);
}

export async function mockGetAllSubmissions(): Promise<StoredSubmission[]> {
  await delay();
  return read<StoredSubmission[]>(SUBMISSIONS_KEY, []);
}

export async function mockGetAllUsers(): Promise<UserSummary[]> {
  await delay();
  return getUsers().map((u) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    completedForms: u.completedForms,
    createdAt: u.createdAt,
  }));
}

/** Clears all mock data — handy for re-testing a form from scratch. */
export function mockReset(): void {
  if (typeof window === "undefined") return;
  [USERS_KEY, SESSION_KEY, SUBMISSIONS_KEY].forEach((k) =>
    window.localStorage.removeItem(k)
  );
  notify(null);
}
