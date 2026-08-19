import Link from "next/link";
import { CheckCircle, ClipboardList, ChevronRight } from "lucide-react";
import type { FormId } from "@/types";

interface FormCardProps {
  id: FormId;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

export function FormCard({ title, description, href, completed, disabled, disabledMessage }: FormCardProps) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 flex flex-col gap-4 transition-shadow ${
        completed
          ? "border-green-200 bg-green-50"
          : disabled
          ? "border-gray-200 bg-gray-50 opacity-75"
          : "border-gray-200 bg-white hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg p-2.5 shrink-0 ${disabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
          <ClipboardList className="w-5 h-5" />
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            ทำเรียบร้อยแล้ว
          </span>
        ) : disabled ? (
          <span className="inline-flex items-center bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
            ปิดรับการประเมิน
          </span>
        ) : (
          <span className="inline-flex items-center bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
            รอดำเนินการ
          </span>
        )}
      </div>

      <div>
        <h3 className="font-bold text-gray-800 text-base leading-snug mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>

      {completed ? (
        <button
          disabled
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
        >
          ส่งแบบประเมินแล้ว
        </button>
      ) : disabled ? (
        <button
          disabled
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
        >
          {disabledMessage || "ไม่สามารถทำแบบประเมินได้"}
        </button>
      ) : (
        <Link
          href={href}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white text-center flex items-center justify-center gap-1 transition-colors"
        >
          เริ่มทำแบบประเมิน
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
