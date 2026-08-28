import type { AppUser, BatchMeta, FormId, FormSubmission, StoredSubmission, UserSummary } from "@/types";
import { DEFAULT_FORM_CONFIG, type FormConfig } from "@/lib/formData";

const USERS_KEY = "mock_users";
const SESSION_KEY = "mock_session";
const SUBMISSIONS_KEY = "mock_submissions";
const CONFIG_KEY = "mock_form_config";

interface MockUserRecord {
  uid: string;
  email: string;
  displayName: string;
  password: string;
  completedForms: FormId[];
  completedFormsByBatch: Record<string, FormId[]>;
  batchId?: number;
  batches?: number[];
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
  const config = await mockGetFormConfig();
  const currentBatch = config.currentBatch ?? 42;
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
    completedFormsByBatch: {},
    batchId: currentBatch,
    batches: [currentBatch],
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
  const config = await mockGetFormConfig();
  const currentBatch = config.currentBatch ?? 42;
  const users = getUsers();
  const trimmed = displayName.trim();

  // Check if active user already exists with this name IN THE CURRENT BATCH
  if (users.some((u) => {
    const uBatches = u.batches ?? [u.batchId ?? 42];
    return uBatches.includes(currentBatch) && u.displayName.toLowerCase() === trimmed.toLowerCase();
  })) {
    throw new Error("auth/display-name-already-in-use");
  }

  const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();
  const record: MockUserRecord = {
    uid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: `eval_${Date.now()}@evaluator.local`,
    displayName: trimmed,
    password: generatedPassword,
    completedForms: [],
    completedFormsByBatch: {},
    batchId: currentBatch,
    batches: [currentBatch],
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
  await delay();
  const trimmed = displayName.trim();
  const found = getUsers().find(
    (u) => u.displayName.toLowerCase() === trimmed.toLowerCase()
  );
  if (!found) throw new Error("auth/user-not-found");
  if (found.password !== password.trim()) throw new Error("auth/wrong-password");

  const session: AppUser = {
    uid: found.uid,
    email: found.email,
    displayName: found.displayName,
  };
  write(SESSION_KEY, session);
  notify(session);
}

export async function mockGetCompletedForms(uid: string, batchId?: number): Promise<FormId[]> {
  await delay();
  const user = getUsers().find((u) => u.uid === uid);
  if (!user) return [];

  if (batchId !== undefined) {
    const byBatch = user.completedFormsByBatch ?? {};
    return byBatch[String(batchId)] ?? [];
  }

  return user.completedForms ?? [];
}

export async function mockMarkFormComplete(uid: string, formId: FormId, batchId?: number): Promise<void> {
  const users = getUsers().map((u) => {
    if (u.uid !== uid) return u;

    if (batchId !== undefined) {
      const byBatch = u.completedFormsByBatch ?? {};
      const key = String(batchId);
      const existing = byBatch[key] ?? [];
      if (!existing.includes(formId)) {
        byBatch[key] = [...existing, formId];
      }
      return { ...u, completedFormsByBatch: byBatch };
    }

    // Legacy
    if (!u.completedForms.includes(formId)) {
      return { ...u, completedForms: [...u.completedForms, formId] };
    }
    return u;
  });
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

export async function mockGetAllSubmissions(batchId?: number): Promise<StoredSubmission[]> {
  await delay();
  const all = read<StoredSubmission[]>(SUBMISSIONS_KEY, []);

  if (batchId !== undefined) {
    return all.filter((s) => {
      // Submissions without batchId are assumed to be batch 42 (legacy)
      const subBatch = s.batchId ?? 42;
      return subBatch === batchId;
    });
  }

  return all;
}

export async function mockGetAllUsers(): Promise<UserSummary[]> {
  await delay();
  return getUsers().map((u) => {
    const userBatch = u.batchId ?? u.batches?.[0] ?? 42;
    const userBatches = u.batches ?? [userBatch];
    return {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      completedForms: u.completedForms,
      createdAt: u.createdAt,
      batchId: userBatch,
      batches: userBatches,
    };
  });
}

export async function mockDeleteUser(uid: string, email?: string): Promise<void> {
  await delay();
  const users = getUsers().filter((u) => u.uid !== uid && (email ? u.email !== email : true));
  write(USERS_KEY, users);

  const submissions = read<StoredSubmission[]>(SUBMISSIONS_KEY, []).filter(
    (s) => s.userId !== uid && (email ? s.userEmail !== email : true)
  );
  write(SUBMISSIONS_KEY, submissions);
}

export async function mockGetFormConfig(): Promise<FormConfig> {
  await delay();
  const config = read<Partial<FormConfig>>(CONFIG_KEY, {});

  // Migration: ensure batch fields exist
  return {
    ...DEFAULT_FORM_CONFIG,
    ...config,
    currentBatch: config.currentBatch ?? DEFAULT_FORM_CONFIG.currentBatch,
    batches: config.batches ?? DEFAULT_FORM_CONFIG.batches,
  };
}

export async function mockSaveFormConfig(config: FormConfig): Promise<void> {
  await delay();
  write(CONFIG_KEY, config);
}

export async function mockCreateNewBatch(
  currentConfig: FormConfig,
  newBatchNumber: number
): Promise<FormConfig> {
  await delay();

  const newBatch: BatchMeta = {
    id: newBatchNumber,
    label: `รุ่นที่ ${newBatchNumber}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  const updatedBatches = currentConfig.batches.map((b) => ({
    ...b,
    isActive: false,
  }));

  const newConfig: FormConfig = {
    ...currentConfig,
    currentBatch: newBatchNumber,
    batches: [...updatedBatches, newBatch],
    isForceClosed: false,
    startDate: "",
    endDate: "",
  };

  write(CONFIG_KEY, newConfig);
  return newConfig;
}

/** Clears all mock data — handy for re-testing a form from scratch. */
export function mockReset(): void {
  if (typeof window === "undefined") return;
  [USERS_KEY, SESSION_KEY, SUBMISSIONS_KEY, CONFIG_KEY].forEach((k) =>
    window.localStorage.removeItem(k)
  );
  notify(null);
}
