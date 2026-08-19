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
}

export interface FormSubmission {
  formId: FormId;
  userId: string;
  userEmail: string;
  evaluatorName: string;
  submittedAt: Timestamp;
  answers: Record<string, unknown>;
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
}

export interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  completedForms: FormId[];
  createdAt: string;
}
