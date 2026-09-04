"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { useDraftAutoSave } from "@/lib/useDraftAutoSave";
import { submitWithRetry, getSubmitErrorMessage } from "@/lib/submitWithRetry";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ScaleInput } from "@/components/ui/ScaleInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";
import { BookOpen, CheckCircle2, AlertCircle, HelpCircle, Save } from "lucide-react";

type Form1Values = Record<string, string>;

export function Form1({
  userId,
  questions,
  preview,
  batchId,
}: {
  userId: string;
  questions: string[];
  preview?: boolean;
  batchId?: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Form1Values>();

  const formValues = watch();

  // Auto-save draft to localStorage
  const onDraftRestored = useCallback(() => {
    toast.success("โหลดข้อมูลที่เคยกรอกค้างไว้แล้ว", { icon: "📋", duration: 4000 });
  }, []);

  const { lastSavedAt, clearDraft, isSaving } = useDraftAutoSave<Form1Values>({
    formId: "form_1",
    batchId,
    userId,
    getValues,
    setValue,
    watchedValues: formValues,
    onDraftRestored,
  });

  // Auto-clear suggestion errors when score changes to >= 3
  useEffect(() => {
    questions.forEach((_, i) => {
      const num = i + 1;
      const scoreKey = `q${num}_score`;
      const suggKey = `q${num}_suggestion`;
      const currentScore = Number(formValues[scoreKey] || 0);
      const isRequired = currentScore > 0 && currentScore <= 2;
      if (!isRequired && errors[suggKey]) {
        clearErrors(suggKey);
      }
    });
  }, [formValues, questions, errors, clearErrors]);

  // Calculate live completion progress
  const { answeredCount, totalCount, progressPercent } = useMemo(() => {
    const total = questions.length;
    let answered = 0;
    questions.forEach((_, i) => {
      const scoreKey = `q${i + 1}_score`;
      if (formValues[scoreKey]) {
        answered += 1;
      }
    });
    const percent = Math.round((answered / total) * 100);
    return { answeredCount: answered, totalCount: total, progressPercent: percent };
  }, [questions, formValues]);

  const onSubmit = async (data: Form1Values) => {
    if (preview) {
      toast.success("นี่คือโหมด Preview (ไม่มีการบันทึกข้อมูลจริง)");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      await submitWithRetry(async () => {
        await submitFormResponse({
          formId: "form_1",
          userId,
          userEmail: user.email ?? "",
          evaluatorName: user.displayName ?? "",
          answers: data as unknown as Record<string, unknown>,
          batchId,
        });
        await markFormComplete(userId, "form_1", batchId);
      });
      clearDraft();
      toast.success("ส่งแบบประเมินสำเร็จ!");
      router.replace("/hub");
    } catch (err) {
      toast.error(getSubmitErrorMessage(err), { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg shadow-blue-900/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold mb-2.5 sm:mb-3 border border-white/10">
            <BookOpen className="w-3.5 h-3.5" />
            <span>แบบประเมินที่ 1 • ด้านการจัดการเรียนการสอน</span>
          </div>

          <h1 className="text-lg sm:text-2xl font-bold leading-tight">
            แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ {batchId ?? 42}
          </h1>
          <p className="mt-1 text-blue-200 text-xs sm:text-base font-medium">
            ต่อหลักสูตรวิสัญญีฯ ด้านการจัดการเรียนการสอน
          </p>

          {/* Rating Scale Legend Bar */}
          <div className="mt-6 pt-5 border-t border-white/15">
            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-semibold mb-2.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>เกณฑ์การให้คะแนน (1 ถึง 5):</span>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-xs">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                <span className="font-bold text-rose-300">1</span>
                <span className="hidden sm:inline text-[11px] block text-blue-100">ควรปรับปรุง</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                <span className="font-bold text-amber-300">2</span>
                <span className="hidden sm:inline text-[11px] block text-blue-100">พอใช้</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                <span className="font-bold text-sky-300">3</span>
                <span className="hidden sm:inline text-[11px] block text-blue-100">ปานกลาง</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                <span className="font-bold text-indigo-200">4</span>
                <span className="hidden sm:inline text-[11px] block text-blue-100">ดี</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/10">
                <span className="font-bold text-emerald-300">5</span>
                <span className="hidden sm:inline text-[11px] block text-blue-100">ดีมาก</span>
              </div>
            </div>
            <p className="mt-2.5 text-blue-200 text-xs leading-relaxed flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>หากให้คะแนน 1 หรือ 2 กรุณาระบุข้อเสนอแนะเพื่อการปรับปรุง</span>
            </p>
          </div>
        </div>
      </div>

      {/* Guidance message */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
        💡 ข้อเสนอแนะของท่านมีความสำคัญอย่างยิ่ง ขอความกรุณาใช้ถ้อยคำที่สุภาพ
        หากไม่มีข้อมูลต้องการประเมินในหัวข้อนี้ สามารถพิมพ์ &quot;-&quot; ได้เลยครับ/ค่ะ
      </div>

      {/* Evaluator Badge */}
      <EvaluatorBadge name={user?.displayName ?? ""} />

      {/* Live Sticky Progress Card */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold mb-2">
          <span className="text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            ความคืบหน้าการตอบแบบสอบถาม
          </span>
          <span className="text-blue-600 font-bold">
            {answeredCount} / {totalCount} ข้อ ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Draft auto-save indicator */}
        {lastSavedAt && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Save className="w-3 h-3" />
            <span>
              {isSaving ? "กำลังบันทึกร่าง..." : `บันทึกร่างอัตโนมัติเมื่อ ${new Date(lastSavedAt).toLocaleTimeString("th-TH")}`}
            </span>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-5">
        {questions.map((q, i) => {
          const num = i + 1;
          const scoreKey = `q${num}_score`;
          const suggKey = `q${num}_suggestion`;
          const currentScore = Number(formValues[scoreKey] || 0);
          const needsSuggestionNotice = currentScore > 0 && currentScore <= 2;

          return (
            <div
              key={num}
              className="bg-slate-50/60 rounded-3xl border border-slate-200/80 p-4 sm:p-5 space-y-3 transition-all hover:border-slate-300 shadow-sm"
            >
              <ScaleInput
                name={scoreKey}
                label={q}
                questionNumber={num}
                register={register}
                error={errors[scoreKey]}
                value={formValues[scoreKey]}
                onChange={(val) => {
                  if (Number(val) > 2) {
                    clearErrors(suggKey);
                  }
                }}
                required
              />

              {needsSuggestionNotice && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    ท่านให้คะแนน {currentScore} ({currentScore === 1 ? "ควรปรับปรุง" : "พอใช้"}) — รบกวนระบุข้อเสนอแนะด้านล่างนี้
                  </span>
                </div>
              )}

              <TextAreaInput
                name={suggKey}
                label="ข้อเสนอแนะเพิ่มเติมสำหรับข้อนี้"
                placeholder={
                  needsSuggestionNotice
                    ? "กรุณาระบุสิ่งที่ควรปรับปรุงหรือข้อเสนอแนะเพิ่มเติม..."
                    : "ระบุข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                }
                register={register}
                error={errors[suggKey]}
                required={needsSuggestionNotice}
                rows={2}
              />
            </div>
          );
        })}
      </div>

      {/* Submit Button & Progress status */}
      <div className="pt-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>สถานะ: {progressPercent === 100 ? "ตอบครบทุกข้อแล้ว" : `เหลืออีก ${totalCount - answeredCount} ข้อ`}</span>
            <span>{progressPercent}% เรียบร้อย</span>
          </div>
          <SubmitButton
            loading={submitting}
            label={progressPercent === 100 ? "ส่งแบบประเมิน" : `ส่งแบบประเมิน (${answeredCount}/${totalCount} ข้อ)`}
          />
        </div>
      </div>
    </form>
  );
}
