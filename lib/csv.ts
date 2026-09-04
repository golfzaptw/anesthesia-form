import type { FormId, StoredSubmission } from "@/types";
import type { FormConfig } from "@/lib/formData";

function escapeCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function getHeaderLabel(key: string, formId?: FormId, config?: FormConfig): string {
  if (!formId || !config) return key;

  if (formId === "form_1") {
    const scoreMatch = key.match(/^q(\d+)_score$/);
    if (scoreMatch) {
      const idx = parseInt(scoreMatch[1], 10) - 1;
      const q = config.form1Questions[idx];
      return q ? `ข้อ ${idx + 1}. ${q} (คะแนน)` : key;
    }
    const suggMatch = key.match(/^q(\d+)_suggestion$/);
    if (suggMatch) {
      const idx = parseInt(suggMatch[1], 10) - 1;
      const q = config.form1Questions[idx];
      return q ? `ข้อ ${idx + 1}. ${q} (ข้อเสนอแนะ)` : key;
    }
  }

  if (formId === "form_2") {
    const metMatch = key.match(/^i(\d+)_met$/);
    if (metMatch) {
      const idx = parseInt(metMatch[1], 10);
      const name = config.form2Instructors[idx];
      return name ? `[${name}] เคยเจอหรือไม่` : key;
    }
    const qMatch = key.match(/^i(\d+)_q(\d+)$/);
    if (qMatch) {
      const iIdx = parseInt(qMatch[1], 10);
      const qIdx = parseInt(qMatch[2], 10) - 1;
      const name = config.form2Instructors[iIdx];
      const q = config.form2Questions[qIdx];
      return name && q ? `[${name}] ${q}` : key;
    }
    const suggMatch = key.match(/^i(\d+)_suggestion$/);
    if (suggMatch) {
      const idx = parseInt(suggMatch[1], 10);
      const name = config.form2Instructors[idx];
      return name ? `[${name}] ข้อเสนอแนะ` : key;
    }
  }

  if (formId === "form_3") {
    const metMatch = key.match(/^d(\d+)_s(\d+)_met$/);
    if (metMatch) {
      const dIdx = parseInt(metMatch[1], 10);
      const sIdx = parseInt(metMatch[2], 10);
      const name = config.form3Departments[dIdx]?.staff[sIdx];
      return name ? `[${name}] เคยเจอหรือไม่` : key;
    }
    const txtMatch = key.match(/^d(\d+)_s(\d+)$/);
    if (txtMatch) {
      const dIdx = parseInt(txtMatch[1], 10);
      const sIdx = parseInt(txtMatch[2], 10);
      const name = config.form3Departments[dIdx]?.staff[sIdx];
      return name ? `[${name}] ข้อคิดเห็น` : key;
    }
  }

  return key;
}

/** Flattens submissions to a wide CSV — one row per submission, one column per answer key. */
export function submissionsToCsv(subs: StoredSubmission[], formId?: FormId, config?: FormConfig): string {
  const answerKeys = Array.from(
    new Set(subs.flatMap((s) => Object.keys(s.answers)))
  ).sort();

  const header = [
    "evaluatorName", 
    "userEmail", 
    "submittedAt", 
    "editCount",
    ...answerKeys.map(k => getHeaderLabel(k, formId, config))
  ];
  const rows = subs.map((s) => [
    s.evaluatorName,
    s.userEmail,
    s.submittedAt,
    s.editCount ?? 0,
    ...answerKeys.map((k) => s.answers[k] ?? ""),
  ]);

  return [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM keeps Excel from mangling Thai characters.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
