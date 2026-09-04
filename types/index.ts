import { Timestamp } from "firebase/firestore";

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
