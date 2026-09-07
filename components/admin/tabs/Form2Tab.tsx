import { ScoreBar } from "@/components/admin/ScoreBar";
import { Collapsible } from "@/components/admin/Collapsible";
import { CommentList } from "@/components/admin/CommentList";
import { ExportActions } from "@/components/admin/ExportActions";
import type { AdminTabProps } from "./types";

export function Form2Tab({ byForm, form2, onDownloadAll, onGeneratePDF, isGeneratingPDF, activeBatch }: AdminTabProps) {
  return (
    <div className="space-y-3">
      <ExportActions />

      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-lg font-bold text-gray-900 leading-relaxed">
          แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี {activeBatch ? `รุ่นที่ ${activeBatch}` : ""} <br/> 
          ต่อหลักสูตรวิสัญญี ด้านอาจารย์แพทย์
        </h1>
      </div>
      <p className="text-xs text-gray-400">
        จาก {byForm.form_2.length} คำตอบ — เรียงตามคะแนนเฉลี่ย
      </p>
      {[...form2]
        .sort((a, b) => b.overallAverage - a.overallAverage)
        .map((ins, idx) => (
          <Collapsible
            key={`f2-ins-${idx}`}
            title={ins.name}
            badge={
              ins.metCount
                ? `${ins.overallAverage.toFixed(2)} · เคยเจอ ${ins.metCount}`
                : "ยังไม่มีผู้ประเมิน"
            }
          >
            <div className="pt-2">
              {ins.scores.map((s, sIdx) => (
                <ScoreBar key={`f2-score-${sIdx}`} {...s} />
              ))}
              {ins.comments.length > 0 && (
                <div className="mt-3 border-t border-gray-100">
                  <CommentList comments={ins.comments} />
                </div>
              )}
            </div>
          </Collapsible>
        ))}
    </div>
  );
}
