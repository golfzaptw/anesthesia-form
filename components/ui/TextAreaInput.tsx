"use client";

import { type UseFormRegister } from "react-hook-form";
import { MessageSquareText } from "lucide-react";

interface TextAreaInputProps {
  name: string;
  label: string;
  placeholder?: string;
  questionNumber?: number | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: { message?: string };
  required?: boolean;
  rows?: number;
  staffName?: string;
}

export function TextAreaInput({
  name,
  label,
  placeholder = "ระบุความคิดเห็นหรือข้อเสนอแนะเพิ่มเติม (ถ้ามี)...",
  questionNumber,
  register,
  error,
  required = false,
  rows = 3,
  staffName,
}: TextAreaInputProps) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 bg-white ${
        error
          ? "border-rose-300 bg-rose-50/20 ring-1 ring-rose-300"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2.5">
        <MessageSquareText className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="flex-1 leading-snug">
          {questionNumber !== undefined && (
            <span className="mr-1 font-bold text-blue-600">{questionNumber}.</span>
          )}
          {staffName ? (
            <>
              <span className="text-blue-700 font-bold">{staffName}</span>
              {" — "}
              {label}
            </>
          ) : (
            label
          )}
          {required ? (
            <span className="text-rose-500 ml-1 font-bold">*</span>
          ) : (
            <span className="text-xs font-normal text-slate-400 ml-1.5">(ไม่บังคับ)</span>
          )}
        </span>
      </label>

      <textarea
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-xl border p-3 text-sm text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y ${
          error ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
        }`}
        {...register(name, required ? { required: "กรุณากรอกข้อมูล" } : {})}
      />

      {error && (
        <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          {error.message}
        </p>
      )}
    </div>
  );
}
