import { Stethoscope, ShieldCheck, X, Sparkles, User, Building2 } from "lucide-react";

export function SystemInfoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background gradient decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-100/70 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-100/70 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                System Info
              </span>
              <span className="text-xs text-slate-400">v1.0.0</span>
            </div>
            <h2 className="text-base font-bold text-slate-800 leading-snug mt-0.5">
              ระบบประเมินความพึงพอใจ
            </h2>
            <p className="text-xs text-slate-500 font-medium">หลักสูตรพยาบาลวิสัญญี</p>
          </div>
        </div>

        {/* Creator Info Box */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-4 border border-slate-200/80 mb-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ผู้พัฒนาและออกแบบระบบ (Developer)
              </span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                Chutikan Sangsup
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                สังกัด / หน่วยงาน (Affiliation)
              </span>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Nurse Anesthesia, Phramongkutklao Hospital
              </p>
              <p className="text-[11px] text-slate-500">
                พยาบาลวิสัญญี โรงพยาบาลพระมงกุฎเกล้า
              </p>
            </div>
          </div>
        </div>

        {/* Features / Purpose */}
        <div className="space-y-2 text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ระบบเก็บข้อมูลและประเมินแบบไม่เปิดเผยตัวตน (Anonymous)</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>รองรับการแยกข้อมูลและประเมินตามรุ่นการศึกษา (Batch System)</span>
          </div>
        </div>

        {/* Footer info & License */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          <span>© 2026 Chutikan Sangsup</span>
          <span className="text-[10px] text-slate-400">All rights reserved</span>
        </div>
      </div>
    </div>
  );
}
