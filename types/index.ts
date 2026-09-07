import { Timestamp } from "firebase/firestore";
import type { DepartmentData } from "@/lib/formData";

export type FormId = "form_1" | "form_2" | "form_3";

/** Minimal user shape shared by Firebase Auth and the mock store. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserDoc {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  completedForms: FormId[];
  batchId?: number;
  batches?: number[];
}

export interface BatchMeta {
  id: number;
  label: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminAuditLog {
  id: string;
  action: "config.save" | "batch.create" | "user.delete" | "force_close.toggle" | "config.import" | "migration.run" | "auth.login";
  actorEmail: string;
  targetLabel: string;
  batchId?: number;
  detail: string;
  at: string;
}

/**
 * Frozen copy of the list-shaped config used by one batch.
 *
 * Answers are stored with index-based keys (`i3_q2`, `d1_s4_met`, `q7_score`),
 * so reordering or deleting an entry in the live config would silently re-map
 * every past answer to the wrong person/question. Each batch therefore keeps
 * its own snapshot in `config/batch_{id}` and analytics reads that instead.
 */
export interface BatchConfigSnapshot {
  batchId: number;
  form1Questions: string[];
  form2Instructors: string[];
  form2Questions: string[];
  form3Departments: DepartmentData[];
  snapshotAt: string;
}

export interface FormSubmission {
  formId: FormId;
  userId: string;
  userEmail: string;
  evaluatorName: string;
  submittedAt: Timestamp;
  answers: Record<string, unknown>;
  batchId?: number;
  /** 0 = ส่งครั้งแรก, 1 = แก้ไขแล้ว 1 ครั้ง (ล็อคถาวร) */
  editCount?: number;
}

export interface FormCardMeta {
  id: FormId;
  title: string;
  description: string;
  href: string;
}

/** A submission as read back for admin reporting; date is normalised to ISO. */
export interface StoredSubmission {
  formId: FormId;
  userId: string;
  userEmail: string;
  evaluatorName: string;
  submittedAt: string;
  answers: Record<string, unknown>;
  batchId?: number;
  editCount?: number;
}

export interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  completedForms: FormId[];
  createdAt: string;
  batchId?: number;
  batches?: number[];
}
