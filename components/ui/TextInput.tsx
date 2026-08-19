"use client";

import { type UseFormRegister } from "react-hook-form";

interface TextInputProps {
  name: string;
  label: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: { message?: string };
  required?: boolean;
  questionNumber?: number | string;
}

export function TextInput({
  name,
  label,
  placeholder,
  register,
  error,
  required = false,
  questionNumber,
}: TextInputProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        {questionNumber !== undefined && (
          <span className="mr-1">{questionNumber}.</span>
        )}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full border-b-2 bg-transparent pb-1 text-sm focus:outline-none focus:border-blue-500 transition-colors ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        {...register(name, required ? { required: "กรุณากรอกข้อมูล" } : {})}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
