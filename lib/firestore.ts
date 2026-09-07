import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  collection,
  updateDoc,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { IS_MOCK } from "./mockMode";
import {
  mockGetAllSubmissions,
  mockGetAllUsers,
  mockGetCompletedForms,
  mockMarkFormComplete,
  mockSubmitFormResponse,
  mockDeleteUser,
  mockGetFormConfig,
  mockSaveFormConfig,
  mockCreateNewBatch,
  mockGetEditCount,
  mockGetExistingSubmission,
  mockMigrateSubmissionIds,
  mockGetBatchConfigSnapshot,
  mockSaveBatchConfigSnapshot,
  mockGetAuditLogs,
  mockLogAdminAction,
} from "./mockStore";
import type {
  BatchConfigSnapshot,
  BatchMeta,
  FormId,
  FormSubmission,
  StoredSubmission,
  UserDoc,
  UserSummary,
  AdminAuditLog,
} from "@/types";
import {
  FORM1_QUESTIONS,
  FORM2_EVAL_QUESTIONS,
  FORM2_INSTRUCTORS,
  FORM3_DEPARTMENTS,
  DEFAULT_FORM_CONFIG,
  type FormConfig,
  isDeptAllowSkip,
  toBatchConfigSnapshot,
} from "./formData";

export async function getOrCreateUserDoc(
  uid: string,
  email: string,
  displayName: string,
  batchId?: number
): Promise<UserDoc> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data() as UserDoc;
    if (batchId !== undefined) {
      const existingBatches = existing.batches ?? (existing.batchId ? [existing.batchId] : [42]);
      if (!existingBatches.includes(batchId)) {
        const updatedBatches = [...existingBatches, batchId];
        await updateDoc(ref, { batches: updatedBatches, batchId });
      }
    }
    return existing;
  }

  const resolvedBatch = batchId ?? 42;
  const newDoc = {
    email,
    displayName,
    createdAt: serverTimestamp(),
    completedForms: [] as FormId[],
    completedFormsByBatch: {} as Record<string, FormId[]>,
    batchId: resolvedBatch,
    batches: [resolvedBatch],
  };
  await setDoc(ref, newDoc);
  return {
    email,
    displayName,
    createdAt: null as unknown as UserDoc["createdAt"],
    completedForms: [],
    batchId: resolvedBatch,
    batches: [resolvedBatch],
  };
}

export async function getCompletedForms(uid: string, batchId?: number): Promise<FormId[]> {
  if (IS_MOCK) return mockGetCompletedForms(uid, batchId);
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data();

  // If batchId is provided, use the batch-aware map
  if (batchId !== undefined) {
    const byBatch = (data.completedFormsByBatch as Record<string, FormId[]>) ?? {};
    return byBatch[String(batchId)] ?? [];
  }

  // Fallback: legacy completedForms field
  return (data as UserDoc).completedForms ?? [];
}

/** Deterministic submission id so a user can overwrite their own submission when editing. */
export function submissionDocId(userId: string, formId: FormId, batchId?: number): string {
  return `${userId}_${formId}_${batchId ?? 42}`;
}

export async function submitFormResponse(
  payload: Omit<FormSubmission, "submittedAt">,
  isEdit?: boolean
): Promise<void> {
  if (IS_MOCK) return mockSubmitFormResponse(payload, isEdit);
  const docId = submissionDocId(payload.userId, payload.formId, payload.batchId);
  await setDoc(doc(db, "form_submissions", docId), {
    ...payload,
    submittedAt: serverTimestamp(),
    editCount: isEdit ? 1 : 0,
  });
}

/** Returns the stored editCount, or -1 when no readable submission exists (i.e. not editable). */
export async function getEditCount(
  userId: string,
  formId: FormId,
  batchId?: number
): Promise<number> {
  if (IS_MOCK) return mockGetEditCount(userId, formId, batchId);
  try {
    const snap = await getDoc(doc(db, "form_submissions", submissionDocId(userId, formId, batchId)));
    if (!snap.exists()) return -1;
    return (snap.data().editCount as number) ?? 0;
  } catch (err) {
    console.warn("Could not read submission editCount:", err);
    return -1;
  }
}

export async function getExistingSubmission(
  userId: string,
  formId: FormId,
  batchId?: number
): Promise<Record<string, unknown> | null> {
  if (IS_MOCK) return mockGetExistingSubmission(userId, formId, batchId);
  try {
    const snap = await getDoc(doc(db, "form_submissions", submissionDocId(userId, formId, batchId)));
    if (!snap.exists()) return null;
    return (snap.data().answers as Record<string, unknown>) ?? null;
  } catch (err) {
    console.warn("Could not read existing submission:", err);
    return null;
  }
}

/**
 * Moves legacy submissions (random `addDoc` ids) onto the deterministic id scheme
 * so they become editable. Newest submission wins when duplicates exist.
 */
export async function migrateSubmissionIds(actorEmail: string = "admin@example.com"): Promise<{ migrated: number; skipped: number }> {
  if (IS_MOCK) return mockMigrateSubmissionIds();

  const snap = await getDocs(
    query(collection(db, "form_submissions"), orderBy("submittedAt", "desc"))
  );

  let migrated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const userId = data.userId as string | undefined;
    const formId = data.formId as FormId | undefined;

    if (!userId || !formId) {
      skipped += 1;
      continue;
    }

    const targetId = submissionDocId(userId, formId, data.batchId as number | undefined);
    if (d.id === targetId) {
      skipped += 1;
      continue;
    }

    const targetRef = doc(db, "form_submissions", targetId);
    if ((await getDoc(targetRef)).exists()) {
      // A newer submission already occupies the deterministic id — drop the stale duplicate.
      await deleteDoc(d.ref);
      skipped += 1;
      continue;
    }

    await setDoc(targetRef, { ...data, editCount: (data.editCount as number) ?? 0 });
    await deleteDoc(d.ref);
    migrated += 1;
  }

  await logAdminAction(
    "migration.run",
    actorEmail,
    "Migrate Submissions",
    `ดำเนินการ Migrate: สำเร็จ ${migrated}, ข้าม ${skipped}`
  );

  return { migrated, skipped };
}

export async function markFormComplete(
  uid: string,
  formId: FormId,
  batchId?: number
): Promise<void> {
  if (IS_MOCK) return mockMarkFormComplete(uid, formId, batchId);
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const byBatch = (data.completedFormsByBatch as Record<string, FormId[]>) ?? {};

  if (batchId !== undefined) {
    const key = String(batchId);
    const existing = byBatch[key] ?? [];
    if (!existing.includes(formId)) {
      byBatch[key] = [...existing, formId];
    }
    const existingBatches: number[] = data.batches ?? (data.batchId ? [data.batchId] : [42]);
    const updatedBatches = existingBatches.includes(batchId)
      ? existingBatches
      : [...existingBatches, batchId];

    await updateDoc(ref, {
      completedFormsByBatch: byBatch,
      batches: updatedBatches,
      batchId,
    });
  } else {
    // Legacy: update the old completedForms array
    const existing = (data.completedForms as FormId[]) ?? [];
    if (!existing.includes(formId)) {
      await updateDoc(ref, { completedForms: [...existing, formId] });
    }
  }
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return "";
}

export async function getAllSubmissions(batchId?: number): Promise<StoredSubmission[]> {
  if (IS_MOCK) return mockGetAllSubmissions(batchId);

  const q = query(collection(db, "form_submissions"), orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  const all: StoredSubmission[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      formId: data.formId as FormId,
      userId: data.userId as string,
      userEmail: data.userEmail as string,
      evaluatorName: (data.evaluatorName as string) ?? "",
      submittedAt: toIso(data.submittedAt),
      answers: (data.answers as Record<string, unknown>) ?? {},
      batchId: (data.batchId as number) ?? 42,
      editCount: (data.editCount as number) ?? 0,
    };
  });

  if (batchId !== undefined) {
    return all.filter((s) => (s.batchId ?? 42) === batchId);
  }

  return all;
}

export async function getAllUsers(): Promise<UserSummary[]> {
  if (IS_MOCK) return mockGetAllUsers();
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data() as UserDoc;
    const userBatch = (data as { batchId?: number }).batchId ?? (data as { batches?: number[] }).batches?.[0] ?? 42;
    const userBatches = (data as { batches?: number[] }).batches ?? [userBatch];
    return {
      uid: d.id,
      email: data.email,
      displayName: data.displayName ?? "",
      completedForms: data.completedForms ?? [],
      createdAt: toIso(data.createdAt),
      batchId: userBatch,
      batches: userBatches,
    };
  });
}

export function nameToSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, "_"));
}

export async function deleteUser(uid: string, email?: string, displayName?: string, actorEmail: string = "admin@example.com"): Promise<void> {
  if (IS_MOCK) return mockDeleteUser(uid, email);

  // 1. Delete user document from 'users'
  await deleteDoc(doc(db, "users", uid));

  // 2. Delete evaluator_names entry if displayName provided
  if (displayName) {
    try {
      await deleteDoc(doc(db, "evaluator_names", nameToSlug(displayName)));
    } catch (e) {
      console.warn("Warning deleting evaluator_names doc:", e);
    }
  }

  // 3. Query and delete all submissions by this user
  try {
    const subSnap = await getDocs(
      query(collection(db, "form_submissions"), where("userId", "==", uid))
    );
    const deletePromises = subSnap.docs.map((d) => deleteDoc(d.ref));

    if (email) {
      const emailSnap = await getDocs(
        query(collection(db, "form_submissions"), where("userEmail", "==", email))
      );
      emailSnap.docs.forEach((d) => {
        if (!subSnap.docs.some((sd) => sd.id === d.id)) {
          deletePromises.push(deleteDoc(d.ref));
        }
      });
    }

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (subErr) {
    console.warn("Warning while deleting associated form_submissions:", subErr);
  }

  await logAdminAction(
    "user.delete",
    actorEmail,
    email || displayName || uid,
    `ลบผู้ใช้: ${email || displayName || uid}`,
  );
}

export { DEFAULT_FORM_CONFIG };

export async function getFormConfig(): Promise<FormConfig> {
  if (IS_MOCK) return mockGetFormConfig();
  try {
    const configRef = doc(db, "config", "formData");
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data() as Partial<FormConfig>;

      // Migration: add batch fields if missing
      const currentBatch = data.currentBatch ?? 42;
      const batches: BatchMeta[] = data.batches ?? [
        { id: 42, label: "รุ่นที่ 42", createdAt: new Date().toISOString(), isActive: true },
      ];

      const config: FormConfig = {
        form1Questions: data.form1Questions || FORM1_QUESTIONS,
        form2Instructors: data.form2Instructors || FORM2_INSTRUCTORS,
        form2Questions: data.form2Questions || FORM2_EVAL_QUESTIONS,
        form3Departments: (data.form3Departments || FORM3_DEPARTMENTS).map((d) => ({
          ...d,
          allowSkip: isDeptAllowSkip(d),
        })),
        isForceClosed: Boolean(data.isForceClosed),
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        currentBatch,
        batches,
      };

      // Auto-save migration if batch fields were missing
      if (data.currentBatch === undefined || data.batches === undefined) {
        try {
          await setDoc(configRef, config);
        } catch (migrationErr) {
          console.warn("Could not auto-migrate batch fields:", migrationErr);
        }
      }

      return config;
    }
    
    // If no config found, initialize it
    await setDoc(configRef, DEFAULT_FORM_CONFIG);
    return DEFAULT_FORM_CONFIG;
  } catch (err) {
    console.warn("Could not fetch form config from Firestore:", err);
    return DEFAULT_FORM_CONFIG;
  }
}

export async function saveFormConfig(config: FormConfig, actorEmail: string = "admin@example.com"): Promise<void> {
  if (IS_MOCK) return mockSaveFormConfig(config);
  const configRef = doc(db, "config", "formData");
  const cleanConfig: FormConfig = {
    form1Questions: config.form1Questions || [],
    form2Instructors: config.form2Instructors || [],
    form2Questions: config.form2Questions || [],
    form3Departments: (config.form3Departments || []).map((d) => ({
      dept: d.dept || "",
      staff: d.staff || [],
      allowSkip: d.allowSkip !== undefined ? d.allowSkip : isDeptAllowSkip(d),
    })),
    isForceClosed: Boolean(config.isForceClosed),
    startDate: config.startDate || "",
    endDate: config.endDate || "",
    currentBatch: config.currentBatch,
    batches: config.batches || [],
  };
  await setDoc(configRef, cleanConfig);

  // Keep the current batch's snapshot in step with the live config so the
  // snapshot always reflects the latest wording that batch was shown.
  try {
    await saveBatchConfigSnapshot(cleanConfig.currentBatch, cleanConfig);
  } catch (err) {
    console.warn("Could not refresh batch config snapshot:", err);
  }

  await logAdminAction(
    "config.save",
    actorEmail,
    "ตั้งค่าระบบ",
    `บันทึกการตั้งค่าระบบ (รุ่นที่ ${cleanConfig.currentBatch})`,
    cleanConfig.currentBatch
  );
}

function batchConfigRef(batchId: number) {
  return doc(db, "config", `batch_${batchId}`);
}

/** Freezes the current question/instructor/department lists for one batch. */
export async function saveBatchConfigSnapshot(
  batchId: number,
  config: FormConfig
): Promise<void> {
  if (IS_MOCK) return mockSaveBatchConfigSnapshot(batchId, config);
  await setDoc(batchConfigRef(batchId), toBatchConfigSnapshot(batchId, config));
}

/** Returns the frozen config for a batch, or `null` when none was taken. */
export async function getBatchConfigSnapshot(
  batchId: number
): Promise<BatchConfigSnapshot | null> {
  if (IS_MOCK) return mockGetBatchConfigSnapshot(batchId);
  try {
    const snap = await getDoc(batchConfigRef(batchId));
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<BatchConfigSnapshot>;
    return {
      batchId,
      form1Questions: data.form1Questions ?? [],
      form2Instructors: data.form2Instructors ?? [],
      form2Questions: data.form2Questions ?? [],
      form3Departments: data.form3Departments ?? [],
      snapshotAt: data.snapshotAt ?? "",
    };
  } catch (err) {
    console.warn(`Could not read config snapshot for batch ${batchId}:`, err);
    return null;
  }
}

/**
 * Creates snapshots from the current config for every batch that has none yet.
 * Existing snapshots are never overwritten — they are the historical record.
 */
export async function backfillBatchConfigSnapshots(
  config: FormConfig
): Promise<{ created: number[]; skipped: number[] }> {
  const created: number[] = [];
  const skipped: number[] = [];

  for (const batch of config.batches || []) {
    const existing = await getBatchConfigSnapshot(batch.id);
    if (existing) {
      skipped.push(batch.id);
      continue;
    }
    await saveBatchConfigSnapshot(batch.id, config);
    created.push(batch.id);
  }

  return { created, skipped };
}

/**
 * Create a new academic year batch.
 * - Adds a new entry to config.batches
 * - Sets config.currentBatch to the new batch
 * - Resets all user completedFormsByBatch for the new batch (empty arrays)
 * - Resets startDate/endDate
 */
export async function createNewBatch(
  currentConfig: FormConfig,
  newBatchNumber: number,
  actorEmail: string = "admin@example.com"
): Promise<FormConfig> {
  if (IS_MOCK) return mockCreateNewBatch(currentConfig, newBatchNumber);

  // Freeze the outgoing batch first — once the new batch starts, admins will
  // edit the live config and the old batch's answers must stay interpretable.
  try {
    await saveBatchConfigSnapshot(currentConfig.currentBatch, currentConfig);
  } catch (err) {
    console.warn("Could not snapshot the outgoing batch config:", err);
  }

  const newBatch: BatchMeta = {
    id: newBatchNumber,
    label: `รุ่นที่ ${newBatchNumber}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  // Mark old batches as inactive
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

  // Save config
  await saveFormConfig(newConfig);

  // Reset completedFormsByBatch for all users
  // The new batch key will simply not exist yet, so users won't have any completed forms
  // We don't need to actively write empty arrays — the getCompletedForms function
  // returns [] for missing batch keys.

  // Log action
  await logAdminAction(
    "batch.create",
    actorEmail,
    newBatch.label,
    `สร้างรุ่นใหม่ ${newBatch.label}`,
    newBatchNumber
  );

  return newConfig;
}

export async function logAdminAction(
  action: AdminAuditLog["action"],
  actorEmail: string,
  targetLabel: string,
  detail: string,
  batchId?: number
): Promise<void> {
  if (IS_MOCK) return mockLogAdminAction(action, actorEmail, targetLabel, detail, batchId);
  try {
    const newDocRef = doc(collection(db, "admin_audit"));
    await setDoc(newDocRef, {
      action,
      actorEmail,
      targetLabel,
      detail,
      batchId: batchId ?? null,
      at: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to log admin action:", err);
  }
}

export async function getAuditLogs(limitCount = 50): Promise<AdminAuditLog[]> {
  if (IS_MOCK) return mockGetAuditLogs(limitCount);
  try {
    const q = query(
      collection(db, "admin_audit"),
      orderBy("at", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        action: data.action,
        actorEmail: data.actorEmail,
        targetLabel: data.targetLabel,
        detail: data.detail,
        batchId: data.batchId,
        at: toIso(data.at),
      } as AdminAuditLog;
    });
  } catch (err) {
    console.warn("Failed to get audit logs:", err);
    return [];
  }
}

