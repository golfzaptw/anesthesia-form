import { UserRound } from "lucide-react";

export function EvaluatorBadge({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
      <div className="bg-blue-100 text-blue-700 rounded-full p-2 shrink-0">
        <UserRound className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500">ผู้ประเมิน (นามสมมุติ)</p>
        <p className="text-sm font-semibold text-gray-800">{name || "—"}</p>
      </div>
    </div>
  );
}
