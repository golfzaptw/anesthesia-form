"use client";

import { type UseFormRegister } from "react-hook-form";

interface ScaleInputProps {
  name: string;
  label: string;
  questionNumber?: number | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: { message?: string };
  required?: boolean;
}

const SCALE_LABELS: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
};

export function ScaleInput({
  name,
  label,
  questionNumber,
  register,
  error,
  required = true,
}: ScaleInputProps) {
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

      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs text-gray-500 mr-1 w-20 shrink-0">ควรปรับปรุง</span>
        {[1, 2, 3, 4, 5].map((val) => (
          <label
            key={val}
            className="flex flex-col items-center gap-1 cursor-pointer select-none"
          >
            <span className="text-xs text-gray-500">{SCALE_LABELS[val]}</span>
            <input
              type="radio"
              value={val}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
              {...register(name, required ? { required: "กรุณาเลือกคะแนน" } : {})}
            />
          </label>
        ))}
        <span className="text-xs text-gray-500 ml-1">ดีมาก</span>
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error.message}</p>
      )}
    </div>
  );
}
