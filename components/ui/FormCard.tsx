import Link from "next/link";
import { CheckCircle2, BookOpen, GraduationCap, Users2, ArrowRight, Lock } from "lucide-react";
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

export function FormCard({ id, title, description, href, completed, disabled, disabledMessage }: FormCardProps) {
  // Select icon & color themes per form
  const theme = {
    form_1: {
      icon: BookOpen,
      iconBg: "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
      badge: "ด้านการจัดการเรียนการสอน",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      accentBorder: "group-hover:border-blue-300",
      btnBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
    },
    form_2: {
      icon: GraduationCap,
      iconBg: "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white",
      badge: "อาจารย์วิสัญญีแพทย์",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      accentBorder: "group-hover:border-indigo-300",
      btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20",
    },
    form_3: {
      icon: Users2,
      iconBg: "bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white",
      badge: "พยาบาลวิสัญญีตามแผนก",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      accentBorder: "group-hover:border-teal-300",
      btnBg: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20",
    },
  }[id] || {
    icon: BookOpen,
    iconBg: "bg-blue-100 text-blue-700",
    badge: "แบบประเมิน",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    accentBorder: "group-hover:border-blue-300",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
  };

  const IconComponent = theme.icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between gap-5 ${
        completed
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 shadow-sm"
          : disabled
          ? "border-slate-200 bg-slate-50/70 opacity-80"
          : `border-slate-200/90 bg-white hover:shadow-xl hover:shadow-slate-200/50 ${theme.accentBorder}`
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 shadow-sm ${
                completed ? "bg-emerald-100 text-emerald-700" : disabled ? "bg-slate-200 text-slate-500" : theme.iconBg
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${theme.badgeColor}`}>
              {theme.badge}
            </span>
          </div>

          {completed ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 shrink-0 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              เสร็จสิ้นแล้ว
            </span>
          ) : disabled ? (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
              <Lock className="w-3.5 h-3.5" />
              ปิดรับคำตอบ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200/80 shrink-0 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              รอดำเนินการ
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-snug mb-2 group-hover:text-blue-900 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>

      <div>
        {completed ? (
          <div className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            คุณส่งแบบประเมินชุดนี้เรียบร้อยแล้ว
          </div>
        ) : disabled ? (
          <button
            disabled
            className="w-full py-3 rounded-xl text-sm font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-center"
          >
            {disabledMessage || "ไม่สามารถทำแบบประเมินได้ในขณะนี้"}
          </button>
        ) : (
          <Link
            href={href}
            className={`w-full py-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${theme.btnBg} group-hover:translate-y-[-1px]`}
          >
            <span>เริ่มทำแบบประเมิน</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  );
}
