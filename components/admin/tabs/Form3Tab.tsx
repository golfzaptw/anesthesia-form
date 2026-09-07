import { Collapsible } from "@/components/admin/Collapsible";
import { CommentList } from "@/components/admin/CommentList";
import type { AdminTabProps } from "./types";

export function Form3Tab({ byForm, form3 }: AdminTabProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">จาก {byForm.form_3.length} คำตอบ</p>
      {form3.map((d, dIdx) => {
        const total = d.staff.reduce((acc, s) => acc + s.comments.length, 0);
        const totalMet = d.staff.reduce((acc, s) => acc + s.metCount, 0);
        return (
          <Collapsible
            key={`f3-dept-${dIdx}`}
            title={d.dept}
            badge={d.allowSkip
              ? `${total} ความเห็น · เคยเจอรวม ${totalMet} ครั้ง`
              : `${total} ความเห็น`
            }
          >
            <ul className="divide-y divide-gray-100 pt-1">
              {d.staff.map((s, sIdx) => (
                <li key={`f3-staff-${dIdx}-${sIdx}`} className="py-3">
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
        );
      })}
    </div>
  );
}
