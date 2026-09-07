import { ScoreBar } from "@/components/admin/ScoreBar";
import type { AdminTabProps } from "./types";

export function Form1Tab({ byForm, form1 }: AdminTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-sm text-gray-800 mb-1">
          คะแนนเฉลี่ยรายข้อ
        </h2>
        <p className="text-xs text-gray-400 mb-2">
          จาก {byForm.form_1.length} คำตอบ
        </p>
        {form1.scores.map((s, idx) => {
          const questionComments = form1.comments.filter((c) => c.label === s.label);
          return (
            <ScoreBar 
              key={`f1-score-${idx}`} 
              {...s} 
              comments={questionComments} 
            />
          );
        })}
      </div>
    </div>
  );
}
