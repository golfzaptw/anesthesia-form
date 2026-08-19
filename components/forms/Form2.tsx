"use client";

import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ScaleInput } from "@/components/ui/ScaleInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";
import { ChevronDown, ChevronUp } from "lucide-react";


type Form2Values = Record<string, string>;

// ─────────────────────────────────────────────
// Single instructor section
// ─────────────────────────────────────────────
function InstructorSection({
  index,
  name,
  questions,
  register,
  errors,
}: {
  index: number;
  name: string;
  questions: string[];
  register: ReturnType<typeof useForm<Form2Values>>["register"];
  errors: FieldErrors<Form2Values>;
}) {
  const metKey = `i${index}_met`;
  const [met, setMet] = useState<string>("");
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
      {/* Instructor header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-indigo-50 px-5 py-3 text-left"
      >
        <span className="font-bold text-indigo-800 text-sm">{name}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-indigo-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {/* Met radio */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              เคยเจออาจารย์ท่านนี้หรือไม่
              <span className="text-red-500 ml-1">*</span>
            </p>
            <p className="text-xs text-gray-400 italic mb-3">ทำเครื่องหมายเพียงหนึ่งช่อง</p>
            <div className="space-y-2">
              {[
                { value: "เคย", label: "เคย" },
                { value: "ไม่เคย", label: "ไม่เคย" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    className="accent-blue-600"
                    {...register(metKey, { required: "กรุณาเลือก" })}
                    onChange={(e) => {
                      setMet(e.target.value);
                    }}
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors[metKey] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[metKey]?.message as string}
              </p>
            )}
          </div>

          {/* Evaluation questions — shown only when "met" */}
          {met === "เคย" && (
            <div className="space-y-3">
              {questions.map((q, qi) => {
                const scoreKey = `i${index}_q${qi + 1}`;
                return (
                  <ScaleInput
                    key={qi}
                    name={scoreKey}
                    label={q}
                    register={register}
                    error={errors[scoreKey]}
                    required
                  />
                );
              })}
              <TextAreaInput
                name={`i${index}_suggestion`}
                label="ข้อเสนอแนะ"
                register={register}
                rows={3}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Form 2 main component
// ─────────────────────────────────────────────
export function Form2({
  userId,
  instructors,
  questions,
}: {
  userId: string;
  instructors: string[];
  questions: string[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form2Values>();

  const onSubmit = async (data: Form2Values) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitFormResponse({
        formId: "form_2",
        userId,
        userEmail: user.email ?? "",
        evaluatorName: user.displayName ?? "",
        answers: data,
      });
      await markFormComplete(userId, "form_2");
      toast.success("ส่งแบบประเมินสำเร็จ!");
      router.replace("/hub");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="bg-indigo-700 text-white rounded-2xl p-6 mb-2">
        <h1 className="text-xl font-bold leading-snug">
          แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ 42
          ต่อบุคลากรระดับอาจารย์วิสัญญีแพทย์
        </h1>
        <p className="mt-3 text-indigo-200 text-xs leading-relaxed">
          กรุณาเลือกข้อคะแนนที่ตรงกับความคิดเห็นของท่านมากที่สุด เพียง 1 ข้อ
          <br />
          ** คะแนน 1=ควรปรับปรุง, 2=พอใช้, 3=ปานกลาง, 4=ดี, 5=ดีมาก
        </p>
      </div>

      <EvaluatorBadge name={user?.displayName ?? ""} />

      <div className="space-y-4">
        {instructors.map((name, i) => (
          <InstructorSection
            key={name}
            index={i}
            name={name}
            questions={questions}
            register={register}
            errors={errors}
          />
        ))}
      </div>

      <div className="pt-2 pb-8">
        <SubmitButton loading={submitting} />
      </div>
    </form>
  );
}
