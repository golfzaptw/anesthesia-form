import type { FormConfig } from "./formData";
import type { StoredSubmission } from "@/types";

export interface ScoreStat {
  label: string;
  average: number;
  count: number;
  distribution: number[]; // index 0 => score 1
}

export interface CommentEntry {
  label: string;
  evaluatorName: string;
  text: string;
}

function toScore(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

function summarise(label: string, values: unknown[]): ScoreStat {
  const distribution = [0, 0, 0, 0, 0];
  let sum = 0;
  let count = 0;

  for (const v of values) {
    const score = toScore(v);
    if (score === null) continue;
    distribution[score - 1] += 1;
    sum += score;
    count += 1;
  }

  return {
    label,
    average: count ? sum / count : 0,
    count,
    distribution,
  };
}

function collectComments(
  subs: StoredSubmission[],
  key: string,
  label: string
): CommentEntry[] {
  return subs
    .map((s) => ({
      label,
      evaluatorName: s.evaluatorName,
      text: String(s.answers[key] ?? "").trim(),
    }))
    .filter((c) => c.text.length > 0);
}

export function analyseForm1(subs: StoredSubmission[], config: FormConfig) {
  const scores = config.form1Questions.map((q, i) =>
    summarise(`${i + 1}. ${q}`, subs.map((s) => s.answers[`q${i + 1}_score`]))
  );
  const comments = config.form1Questions.flatMap((q, i) =>
    collectComments(subs, `q${i + 1}_suggestion`, `${i + 1}. ${q}`)
  );
  return { scores, comments };
}

export interface InstructorStat {
  name: string;
  metCount: number;
  notMetCount: number;
  overallAverage: number;
  scores: ScoreStat[];
  comments: CommentEntry[];
}

export function analyseForm2(subs: StoredSubmission[], config: FormConfig): InstructorStat[] {
  return config.form2Instructors.map((name, idx) => {
    const i = idx;
    const metCount = subs.filter((s) => s.answers[`i${i}_met`] === "เคย").length;
    const notMetCount = subs.filter((s) => s.answers[`i${i}_met`] === "ไม่เคย").length;

    const scores = config.form2Questions.map((q, qi) =>
      summarise(q, subs.map((s) => s.answers[`i${i}_q${qi + 1}`]))
    );

    const rated = scores.filter((s) => s.count > 0);
    const overallAverage = rated.length
      ? rated.reduce((acc, s) => acc + s.average, 0) / rated.length
      : 0;

    return {
      name,
      metCount,
      notMetCount,
      overallAverage,
      scores,
      comments: collectComments(subs, `i${i}_suggestion`, name),
    };
  });
}

export interface StaffFeedback {
  dept: string;
  staff: { name: string; comments: CommentEntry[] }[];
}

export function analyseForm3(subs: StoredSubmission[], config: FormConfig): StaffFeedback[] {
  return config.form3Departments.map((d, di) => ({
    dept: d.dept,
    staff: d.staff.map((name, si) => ({
      name,
      comments: collectComments(subs, `d${di}_s${si}`, name),
    })),
  }));
}

export function overallAverage(scores: ScoreStat[]): number {
  const rated = scores.filter((s) => s.count > 0);
  if (!rated.length) return 0;
  return rated.reduce((acc, s) => acc + s.average, 0) / rated.length;
}
