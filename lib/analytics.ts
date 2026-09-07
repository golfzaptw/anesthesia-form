import { type FormConfig, isDeptAllowSkip } from "./formData";
import type { StoredSubmission } from "@/types";

export interface ScoreStat {
  label: string;
  average: number;
  count: number;
  distribution: number[]; // index 0 => score 1
  median: number;
  stdDev: number;
  topBoxRate: number; // % of 4-5
  lowBoxRate: number; // % of 1-2
}

export interface CommentEntry {
  label: string;
  evaluatorName: string;
  text: string;
  givenScore?: number;
}

function toScore(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

function summarise(label: string, values: unknown[]): ScoreStat {
  const distribution = [0, 0, 0, 0, 0];
  let sum = 0;
  let count = 0;
  const validScores: number[] = [];

  for (const v of values) {
    const score = toScore(v);
    if (score === null) continue;
    distribution[score - 1] += 1;
    sum += score;
    count += 1;
    validScores.push(score);
  }

  const average = count ? sum / count : 0;
  
  let median = 0;
  let stdDev = 0;
  let topBoxRate = 0;
  let lowBoxRate = 0;

  if (count > 0) {
    // Median
    validScores.sort((a, b) => a - b);
    const mid = Math.floor(count / 2);
    median = count % 2 !== 0 ? validScores[mid] : (validScores[mid - 1] + validScores[mid]) / 2;

    // Standard Deviation (Population)
    const variance = validScores.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / count;
    stdDev = Math.sqrt(variance);

    // Box rates
    const topBoxCount = distribution[3] + distribution[4]; // Scores 4 and 5
    const lowBoxCount = distribution[0] + distribution[1]; // Scores 1 and 2
    topBoxRate = (topBoxCount / count) * 100;
    lowBoxRate = (lowBoxCount / count) * 100;
  }

  return {
    label,
    average,
    count,
    distribution,
    median,
    stdDev,
    topBoxRate,
    lowBoxRate,
  };
}

function collectComments(
  subs: StoredSubmission[],
  key: string,
  label: string,
  scoreExtractor?: (s: StoredSubmission) => number | undefined
): CommentEntry[] {
  return subs
    .map((s) => ({
      label,
      evaluatorName: s.evaluatorName,
      text: String(s.answers[key] ?? "").trim(),
      givenScore: scoreExtractor ? scoreExtractor(s) : undefined,
    }))
    .filter((c) => c.text.length > 0);
}

export function analyseForm1(subs: StoredSubmission[], config: FormConfig) {
  const scores = config.form1Questions.map((q, i) =>
    summarise(`${i + 1}. ${q}`, subs.map((s) => s.answers[`q${i + 1}_score`]))
  );
  const comments = config.form1Questions.flatMap((q, i) =>
    collectComments(subs, `q${i + 1}_suggestion`, `${i + 1}. ${q}`, (s) => toScore(s.answers[`q${i + 1}_score`]) ?? undefined)
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
      comments: collectComments(subs, `i${i}_suggestion`, name, (s) => {
        let sum = 0;
        let count = 0;
        config.form2Questions.forEach((_, qi) => {
          const sc = toScore(s.answers[`i${i}_q${qi + 1}`]);
          if (sc !== null) {
            sum += sc;
            count++;
          }
        });
        return count > 0 ? sum / count : undefined;
      }),
    };
  });
}

export interface StaffFeedback {
  dept: string;
  allowSkip?: boolean;
  staff: { name: string; metCount: number; notMetCount: number; comments: CommentEntry[] }[];
}

export function analyseForm3(subs: StoredSubmission[], config: FormConfig): StaffFeedback[] {
  return config.form3Departments.map((d, di) => {
    const allowSkip = isDeptAllowSkip(d);
    return {
      dept: d.dept,
      allowSkip,
      staff: d.staff.map((name, si) => ({
        name,
        metCount: allowSkip ? subs.filter((s) => s.answers[`d${di}_s${si}_met`] === "เคย").length : 0,
        notMetCount: allowSkip ? subs.filter((s) => s.answers[`d${di}_s${si}_met`] === "ไม่เคย").length : 0,
        comments: collectComments(subs, `d${di}_s${si}`, name),
      })),
    };
  });
}

export function overallAverage(scores: ScoreStat[]): number {
  const rated = scores.filter((s) => s.count > 0);
  if (!rated.length) return 0;
  return rated.reduce((acc, s) => acc + s.average, 0) / rated.length;
}
