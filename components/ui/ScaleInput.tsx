"use client";

import { type UseFormRegister } from "react-hook-form";
import { Check } from "lucide-react";

interface ScaleInputProps {
  name: string;
  label: string;
  questionNumber?: number | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: { message?: string };
  required?: boolean;
  value?: string | number;
  onChange?: (val: string) => void;
}

const SCALE_OPTIONS = [
  {
    val: 1,
    label: "1",
    desc: "ควรปรับปรุง",
    activeClass: "bg-rose-500 text-white border-rose-500 ring-rose-300 shadow-rose-200",
    hoverClass: "hover:border-rose-300 hover:bg-rose-50/50",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
  {
    val: 2,
    label: "2",
    desc: "พอใช้",
    activeClass: "bg-amber-500 text-white border-amber-500 ring-amber-300 shadow-amber-200",
    hoverClass: "hover:border-amber-300 hover:bg-amber-50/50",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    val: 3,
    label: "3",
    desc: "ปานกลาง",
    activeClass: "bg-blue-500 text-white border-blue-500 ring-blue-300 shadow-blue-200",
    hoverClass: "hover:border-blue-300 hover:bg-blue-50/50",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    val: 4,
    label: "4",
    desc: "ดี",
    activeClass: "bg-indigo-600 text-white border-indigo-600 ring-indigo-300 shadow-indigo-200",
    hoverClass: "hover:border-indigo-300 hover:bg-indigo-50/50",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    val: 5,
    label: "5",
    desc: "ดีมาก",
    activeClass: "bg-emerald-600 text-white border-emerald-600 ring-emerald-300 shadow-emerald-200",
    hoverClass: "hover:border-emerald-300 hover:bg-emerald-50/50",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

export function ScaleInput({
  name,
  label,
  questionNumber,
  register,
  error,
  required = true,
  value,
  onChange,
}: ScaleInputProps) {
  const currentVal = value !== undefined ? Number(value) : undefined;
  const currentOption = SCALE_OPTIONS.find((opt) => opt.val === currentVal);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 bg-white ${
        error
          ? "border-rose-300 bg-rose-50/30 ring-1 ring-rose-300 shadow-sm"
          : currentOption
          ? "border-slate-200/90 shadow-sm"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          {questionNumber !== undefined && (
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              {questionNumber}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {label}
              {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </p>
          </div>
        </div>

        {currentOption && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 transition-all ${currentOption.badgeClass}`}
          >
            <Check className="w-3 h-3" />
            {currentOption.val} — {currentOption.desc}
          </span>
        )}
      </div>

      {/* Scale Buttons Container */}
      <div className="pt-1">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {SCALE_OPTIONS.map((opt) => {
            const isSelected = currentVal === opt.val;

            return (
              <label
                key={opt.val}
                className={`relative flex flex-col items-center justify-center py-2.5 px-1 sm:px-2 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none text-center ${
                  isSelected
                    ? `${opt.activeClass} shadow-md scale-[1.02] ring-2 ring-offset-1`
                    : `bg-slate-50/80 border-slate-200 text-slate-700 ${opt.hoverClass} active:scale-95`
                }`}
              >
                <input
                  type="radio"
                  value={opt.val}
                  className="sr-only"
                  {...register(name, {
                    required: required ? "กรุณาเลือกคะแนน" : false,
                    onChange: (e) => onChange?.(e.target.value),
                  })}
                />
                <span
                  className={`text-base sm:text-lg font-bold tracking-tight ${
                    isSelected ? "text-white" : "text-slate-800"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-medium line-clamp-1 mt-0.5 transition-colors ${
                    isSelected ? "text-white/95 font-semibold" : "text-slate-500"
                  }`}
                >
                  {opt.desc}
                </span>
              </label>
            );
          })}
        </div>

        {/* Mobile selected summary indicator */}
        {currentOption && (
          <div className="sm:hidden mt-2.5 flex items-center justify-center">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentOption.badgeClass}`}
            >
              <Check className="w-3 h-3" />
              คุณเลือก: {currentOption.val} ({currentOption.desc})
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2.5 text-rose-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
}
