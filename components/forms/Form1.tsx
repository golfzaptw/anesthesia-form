"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ScaleInput } from "@/components/ui/ScaleInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";

type Form1Values = Record<string, string>;

export function Form1({ userId, questions }: { userId: string; questions: string[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form1Values>();

  const onSubmit = async (data: Form1Values) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitFormResponse({
        formId: "form_1",
        userId,
        userEmail: user.email ?? "",
        evaluatorName: user.displayName ?? "",
        answers: data as unknown as Record<string, unknown>,
      });
      await markFormComplete(userId, "form_1");
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
      <div className="bg-blue-600 text-white rounded-2xl p-6 mb-2">
        <h1 className="text-xl font-bold leading-snug">
          แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ 42
          ต่อหลักสูตรวิสัญญีฯ
        </h1>
        <p className="mt-1 text-blue-100 text-sm font-medium">
          ด้านการจัดการเรียนการสอน
        </p>
        <p className="mt-3 text-blue-100 text-xs leading-relaxed">
          กรุณาเลือกข้อคะแนนที่ตรงกับความคิดเห็นของท่านมากที่สุด เพียง 1 ข้อ
          <br />
          ** คะแนน 1=ควรปรับปรุง, 2=พอใช้, 3=ปานกลาง, 4=ดี, 5=ดีมาก
          <br />
          (หากให้คะแนน 2 หรือ 1 กรุณาระบุเหตุผลและข้อเสนอแนะ)
        </p>
      </div>

      {/* Evaluator name */}
      <EvaluatorBadge name={user?.displayName ?? ""} />

      {/* Dynamic rated questions */}
      {questions.map((q, i) => {
        const num = i + 1;
        const scoreKey = `q${num}_score`;
        const suggKey = `q${num}_suggestion`;

        return (
          <div key={num} className="space-y-2">
            <ScaleInput
              name={scoreKey}
              label={`${num}. ${q}`}
              register={register}
              error={errors[scoreKey]}
              required
            />
            <TextAreaInput
              name={suggKey}
              label="ข้อเสนอแนะ"
              register={register}
              rows={3}
            />
          </div>
        );
      })}

      <div className="pt-2 pb-8">
        <SubmitButton loading={submitting} />
      </div>
    </form>
  );
}
