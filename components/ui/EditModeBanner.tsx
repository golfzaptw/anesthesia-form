import { Pencil } from "lucide-react";

export function EditModeBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
        <Pencil className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-900">คุณกำลังแก้ไขแบบประเมินที่ส่งไปแล้ว</p>
        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
          ระบบได้ดึงคำตอบเดิมของท่านกลับมาให้แล้ว — แก้ไขได้เพียง 1 ครั้งเท่านั้น
          หลังจากกดส่งครั้งนี้จะไม่สามารถแก้ไขได้อีก
        </p>
      </div>
    </div>
  );
}
