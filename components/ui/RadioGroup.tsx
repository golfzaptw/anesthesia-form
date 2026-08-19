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
}

export function RadioGroup({
  name,
  label,
  options,
  register,
  error,
  required = false,
  questionNumber,
}: RadioGroupProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-800 mb-1">
        {questionNumber !== undefined && (
          <span className="mr-1">{questionNumber}.</span>
        )}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <p className="text-xs text-gray-400 italic mb-3">ทำเครื่องหมายเพียงหนึ่งช่อง</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              value={opt.value}
              className="mt-0.5 accent-blue-600 cursor-pointer"
              {...register(name, required ? { required: "กรุณาเลือก" } : {})}
            />
            <span className="text-sm text-gray-700">
              {opt.label}
              {opt.hint && (
                <span className="ml-2 text-xs text-gray-400 italic">{opt.hint}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error.message}</p>}
    </div>
  );
}
