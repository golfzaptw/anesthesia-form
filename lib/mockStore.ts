import type { AppUser, BatchConfigSnapshot, BatchMeta, FormId, FormSubmission, StoredSubmission, UserSummary, AdminAuditLog } from "@/types";
import { DEFAULT_FORM_CONFIG, toBatchConfigSnapshot, type FormConfig } from "@/lib/formData";

const USERS_KEY = "mock_users";
const SESSION_KEY = "mock_session";
const SUBMISSIONS_KEY = "mock_submissions";
const CONFIG_KEY = "mock_form_config";
const BATCH_SNAPSHOTS_KEY = "mock_batch_config_snapshots";
const AUDIT_LOGS_KEY = "mock_admin_audit_logs";

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

function readSnapshots(): Record<string, BatchConfigSnapshot> {
  return read<Record<string, BatchConfigSnapshot>>(BATCH_SNAPSHOTS_KEY, {});
}

function writeSnapshot(snapshot: BatchConfigSnapshot): void {
  write(BATCH_SNAPSHOTS_KEY, {
    ...readSnapshots(),
    [String(snapshot.batchId)]: snapshot,
  });
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
  payload: Omit<FormSubmission, "submittedAt">,
  isEdit?: boolean
): Promise<void> {
  await delay();
  const all = read<StoredSubmission[]>(SUBMISSIONS_KEY, []);
  const record = {
    ...payload,
    submittedAt: new Date().toISOString(),
    editCount: isEdit ? 1 : 0,
  } as StoredSubmission;

  const index = all.findIndex((s) => isSameSubmission(s, payload.userId, payload.formId, payload.batchId));
  if (index >= 0) {
    all[index] = record;
    write(SUBMISSIONS_KEY, all);
    return;
  }

  write(SUBMISSIONS_KEY, [...all, record]);
}

function isSameSubmission(
  s: StoredSubmission,
  userId: string,
  formId: FormId,
  batchId?: number
): boolean {
  return s.userId === userId && s.formId === formId && (s.batchId ?? 42) === (batchId ?? 42);
}

export async function mockGetEditCount(
  userId: string,
  formId: FormId,
  batchId?: number
): Promise<number> {
  await delay();
  const found = read<StoredSubmission[]>(SUBMISSIONS_KEY, []).find((s) =>
    isSameSubmission(s, userId, formId, batchId)
  );
  if (!found) return -1;
  return found.editCount ?? 0;
}

export async function mockGetExistingSubmission(
  userId: string,
  formId: FormId,
  batchId?: number
): Promise<Record<string, unknown> | null> {
  await delay();
  const found = read<StoredSubmission[]>(SUBMISSIONS_KEY, []).find((s) =>
    isSameSubmission(s, userId, formId, batchId)
  );
  return found?.answers ?? null;
}

/** Mock store already keys submissions by user/form/batch, so there is nothing to move. */
export async function mockMigrateSubmissionIds(): Promise<{ migrated: number; skipped: number }> {
  await delay();
  const all = read<StoredSubmission[]>(SUBMISSIONS_KEY, []);
  return { migrated: 0, skipped: all.length };
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
  writeSnapshot(toBatchConfigSnapshot(config.currentBatch, config));
}

export async function mockGetBatchConfigSnapshot(
  batchId: number
): Promise<BatchConfigSnapshot | null> {
  await delay();
  return readSnapshots()[String(batchId)] ?? null;
}

export async function mockSaveBatchConfigSnapshot(
  batchId: number,
  config: FormConfig
): Promise<void> {
  await delay();
  writeSnapshot(toBatchConfigSnapshot(batchId, config));
}

export async function mockCreateNewBatch(
  currentConfig: FormConfig,
  newBatchNumber: number
): Promise<FormConfig> {
  await delay();

  // Freeze the outgoing batch before its wording can be edited for the new one.
  writeSnapshot(toBatchConfigSnapshot(currentConfig.currentBatch, currentConfig));

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
  writeSnapshot(toBatchConfigSnapshot(newBatchNumber, newConfig));
  return newConfig;
}

/** Clears all mock data — handy for re-testing a form from scratch. */
export function mockReset(): void {
  if (typeof window === "undefined") return;
  [USERS_KEY, SESSION_KEY, SUBMISSIONS_KEY, CONFIG_KEY, BATCH_SNAPSHOTS_KEY, AUDIT_LOGS_KEY].forEach((k) =>
    window.localStorage.removeItem(k)
  );
  notify(null);
}

export function mockLogAdminAction(
  action: AdminAuditLog["action"],
  actorEmail: string,
  targetLabel: string,
  detail: string,
  batchId?: number
): void {
  const all = read<AdminAuditLog[]>(AUDIT_LOGS_KEY, []);
  const log: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    actorEmail,
    targetLabel,
    detail,
    batchId,
    at: new Date().toISOString(),
  };
  write(AUDIT_LOGS_KEY, [log, ...all]);
}

export function mockGetAuditLogs(limitCount = 50): AdminAuditLog[] {
  const all = read<AdminAuditLog[]>(AUDIT_LOGS_KEY, []);
  return all.slice(0, limitCount);
}
