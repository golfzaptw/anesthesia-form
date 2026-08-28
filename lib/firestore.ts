import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  arrayUnion,
  updateDoc,
  serverTimestamp,
  Timestamp,
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
} from "./mockStore";
import type {
  FormId,
  FormSubmission,
  StoredSubmission,
  UserDoc,
  UserSummary,
} from "@/types";
import {
  FORM1_QUESTIONS,
  FORM2_EVAL_QUESTIONS,
  FORM2_INSTRUCTORS,
  FORM3_DEPARTMENTS,
  type FormConfig,
  isDeptAllowSkip,
} from "./formData";

export async function getOrCreateUserDoc(
  uid: string,
  email: string,
  displayName: string
): Promise<UserDoc> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserDoc;
  }

  const newDoc = {
    email,
    displayName,
    createdAt: serverTimestamp(),
    completedForms: [] as FormId[],
  };
  await setDoc(ref, newDoc);
  return {
    email,
    displayName,
    createdAt: null as unknown as UserDoc["createdAt"],
    completedForms: [],
  };
}

export async function getCompletedForms(uid: string): Promise<FormId[]> {
  if (IS_MOCK) return mockGetCompletedForms(uid);
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data() as UserDoc).completedForms ?? [];
}

export async function submitFormResponse(
  payload: Omit<FormSubmission, "submittedAt">
): Promise<void> {
  if (IS_MOCK) return mockSubmitFormResponse(payload);
  await addDoc(collection(db, "form_submissions"), {
    ...payload,
    submittedAt: serverTimestamp(),
  });
}

export async function markFormComplete(
  uid: string,
  formId: FormId
): Promise<void> {
  if (IS_MOCK) return mockMarkFormComplete(uid, formId);
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { completedForms: arrayUnion(formId) });
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return "";
}

export async function getAllSubmissions(): Promise<StoredSubmission[]> {
  if (IS_MOCK) return mockGetAllSubmissions();
  const snap = await getDocs(
    query(collection(db, "form_submissions"), orderBy("submittedAt", "desc"))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      formId: data.formId as FormId,
      userId: data.userId as string,
      userEmail: data.userEmail as string,
      evaluatorName: (data.evaluatorName as string) ?? "",
      submittedAt: toIso(data.submittedAt),
      answers: (data.answers as Record<string, unknown>) ?? {},
    };
  });
}

export async function getAllUsers(): Promise<UserSummary[]> {
  if (IS_MOCK) return mockGetAllUsers();
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data() as UserDoc;
    return {
      uid: d.id,
      email: data.email,
      displayName: data.displayName ?? "",
      completedForms: data.completedForms ?? [],
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function deleteUser(uid: string, email?: string): Promise<void> {
  if (IS_MOCK) return mockDeleteUser(uid, email);

  // 1. Delete user document from 'users'
  await deleteDoc(doc(db, "users", uid));

  // 2. Query and delete all submissions by this user
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
}

export const DEFAULT_FORM_CONFIG: FormConfig = {
  form1Questions: FORM1_QUESTIONS,
  form2Instructors: FORM2_INSTRUCTORS,
  form2Questions: FORM2_EVAL_QUESTIONS,
  form3Departments: FORM3_DEPARTMENTS,
  isForceClosed: false,
  startDate: "",
  endDate: "",
};

export async function getFormConfig(): Promise<FormConfig> {
  if (IS_MOCK) return DEFAULT_FORM_CONFIG;
  const configRef = doc(db, "config", "formData");
  const configSnap = await getDoc(configRef);
  
  if (configSnap.exists()) {
    const data = configSnap.data() as FormConfig;
    if (data.form3Departments) {
      data.form3Departments = data.form3Departments.map((d) => ({
        ...d,
        allowSkip: isDeptAllowSkip(d),
      }));
    }
    return data;
  }
  
  // If no config found, initialize it
  await setDoc(configRef, DEFAULT_FORM_CONFIG);
  return DEFAULT_FORM_CONFIG;
}

export async function saveFormConfig(config: FormConfig): Promise<void> {
  if (IS_MOCK) return;
  const configRef = doc(db, "config", "formData");
  await setDoc(configRef, config);
}
