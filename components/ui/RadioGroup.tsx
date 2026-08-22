"use client";

import { type UseFormRegister, type FieldError } from "react-hook-form";

interface RadioOption {
  value: string;
  label: string;
  hint?: string;
}

interface RadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  questionNumber?: number | string;
  value?: string;
  onChange?: (val: string) => void;
}

export function RadioGroup({
  name,
  label,
  options,
  register,
  error,
  required = false,
  questionNumber,
  value,
  onChange,
}: RadioGroupProps) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 bg-white ${
        error
          ? "border-rose-300 bg-rose-50/20 ring-1 ring-rose-300"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      <p className="text-sm font-semibold text-slate-800 mb-1 leading-snug">
        {questionNumber !== undefined && (
          <span className="mr-1 text-blue-600 font-bold">{questionNumber}.</span>
        )}
        {label}
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </p>
      <p className="text-xs text-slate-400 mb-3">กรุณาเลือกหนึ่งตัวเลือก</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/60 text-blue-900 shadow-sm"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
                {...register(name, {
                  required: required ? "กรุณาเลือก" : false,
                  onChange: (e) => onChange?.(e.target.value),
                })}
              />
              <div className="flex-1 text-sm">
                <span className="font-medium">{opt.label}</span>
                {opt.hint && (
                  <p className="text-xs text-slate-400 mt-0.5">{opt.hint}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-rose-600 text-xs font-medium mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          {error.message}
        </p>
      )}
    </div>
  );
}
