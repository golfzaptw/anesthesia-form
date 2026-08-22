import { User, ShieldCheck } from "lucide-react";

export function EvaluatorBadge({ name }: { name: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-100/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {name ? name.slice(0, 1) : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                ผู้ทำแบบประเมิน
              </span>
              <span className="text-xs text-slate-400">• นามสมมุติ</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
              {name || "ผู้ใช้งาน"}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>บันทึกแบบไม่เปิดเผยตัวตน</span>
        </div>
      </div>
    </div>
  );
}
