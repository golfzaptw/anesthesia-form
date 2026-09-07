"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Collapsible } from "@/components/admin/Collapsible";
import { CommentList } from "@/components/admin/CommentList";
import { ExportActions } from "@/components/admin/ExportActions";
import type { AdminTabProps } from "./types";

export function Form3Tab({ byForm, form3, activeBatch }: AdminTabProps) {
  const [printDeptIdx, setPrintDeptIdx] = useState<number | null>(null);

  const handlePrintDept = (idx: number) => {
    setPrintDeptIdx(idx);
    setTimeout(() => {
      window.print();
      setPrintDeptIdx(null);
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className={printDeptIdx !== null ? "print:hidden" : ""}>
        <ExportActions />
      </div>

      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-lg font-bold text-gray-900 leading-relaxed">
          แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี {activeBatch ? `รุ่นที่ ${activeBatch}` : ""} <br/> 
          ต่อหลักสูตรวิสัญญี ด้านสิ่งสนับสนุนการเรียนรู้และบุคลากรอื่น
          {printDeptIdx !== null && form3[printDeptIdx] && (
            <>
              <br/>
              แผนก: {form3[printDeptIdx].dept}
            </>
          )}
        </h1>
      </div>
      <p className={`text-xs text-gray-400 ${printDeptIdx !== null ? "print:hidden" : ""}`}>
        จาก {byForm.form_3.length} คำตอบ
      </p>
      {form3.map((d, dIdx) => {
        const total = d.staff.reduce((acc, s) => acc + s.comments.length, 0);
        const totalMet = d.staff.reduce((acc, s) => acc + s.metCount, 0);
        return (
          <div key={`f3-dept-${dIdx}`} className={printDeptIdx !== null && printDeptIdx !== dIdx ? "hidden print:hidden" : ""}>
            <Collapsible
              title={d.dept}
              badge={d.allowSkip
                ? `${total} ความเห็น · เคยเจอรวม ${totalMet} ครั้ง`
                : `${total} ความเห็น`
              }
              action={
                <button
                  type="button"
                  onClick={() => handlePrintDept(dIdx)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  title={`พิมพ์เฉพาะแผนก ${d.dept}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์
                </button>
              }
            >
              <ul className="divide-y divide-gray-100 pt-1">
                {d.staff.map((s, sIdx) => (
                  <li key={`f3-staff-${dIdx}-${sIdx}`} className={`py-3 ${sIdx > 0 ? "print:break-before-page print:border-t-0 print:pt-6" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      {d.allowSkip && (
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          {s.metCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                              เคยเจอ {s.metCount}
                            </span>
                          )}
                          {s.notMetCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                              ไม่เคยเจอ {s.notMetCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {s.comments.length === 0 ? (
                      <p className="text-xs text-gray-300 mt-0.5 px-4">ยังไม่มีความเห็น</p>
                    ) : (
                      <div className="mt-1">
                        <CommentList comments={s.comments} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}
