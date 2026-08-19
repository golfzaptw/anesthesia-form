import type { StoredSubmission } from "@/types";

function escapeCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/** Flattens submissions to a wide CSV — one row per submission, one column per answer key. */
export function submissionsToCsv(subs: StoredSubmission[]): string {
  const answerKeys = Array.from(
    new Set(subs.flatMap((s) => Object.keys(s.answers)))
  ).sort();

  const header = ["evaluatorName", "userEmail", "submittedAt", ...answerKeys];
  const rows = subs.map((s) => [
    s.evaluatorName,
    s.userEmail,
    s.submittedAt,
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
