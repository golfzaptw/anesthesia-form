"use client";

import { useState, useMemo } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ScaleInput } from "@/components/ui/ScaleInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  UserCheck,
  UserX,
  Sparkles,
  Search,
} from "lucide-react";

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
  formValues,
  isOpen,
  onToggleOpen,
}: {
  index: number;
  name: string;
  questions: string[];
  register: ReturnType<typeof useForm<Form2Values>>["register"];
  errors: FieldErrors<Form2Values>;
  formValues: Form2Values;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  const metKey = `i${index}_met`;
  const metValue = formValues[metKey];

  // Count answered evaluation questions for this instructor
  const answeredEvalCount = useMemo(() => {
    if (metValue !== "เคย") return 0;
    let count = 0;
    questions.forEach((_, qi) => {
      const scoreKey = `i${index}_q${qi + 1}`;
      if (formValues[scoreKey]) count += 1;
    });
    return count;
  }, [formValues, index, metValue, questions]);

  // Determine status pill
  let statusBadge = (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
      ยังไม่ระบุ
    </span>
  );

  if (metValue === "ไม่เคย") {
    statusBadge = (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 flex items-center gap-1">
        <UserX className="w-3 h-3 text-slate-400" />
        ไม่เคยเจอ (ข้าม)
      </span>
    );
  } else if (metValue === "เคย") {
    if (answeredEvalCount === questions.length) {
      statusBadge = (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ประเมินครบ ({answeredEvalCount}/{questions.length})
        </span>
      );
    } else {
      statusBadge = (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
          ตอบแล้ว {answeredEvalCount}/{questions.length} ข้อ
        </span>
      );
    }
  }

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
        metValue === "เคย" && answeredEvalCount === questions.length
          ? "border-emerald-200 bg-emerald-50/20 shadow-sm"
          : metValue === "ไม่เคย"
          ? "border-slate-200/80 bg-slate-50/40 opacity-90"
          : errors[metKey]
          ? "border-rose-300 ring-1 ring-rose-300"
          : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Instructor Card Header */}
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-gradient-to-r from-purple-50/90 via-fuchsia-50/30 to-slate-50 hover:bg-purple-50 transition-colors gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm">
            {index + 1}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm sm:text-base leading-snug block truncate">
              {name}
            </span>
            <span className="text-xs text-purple-700 font-medium">อาจารย์วิสัญญีแพทย์</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusBadge}
          <div className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4 border-t border-slate-100 bg-white">
          {/* Question: เคยเจอหรือไม่ (Modern Segmented Pills) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
            <p className="text-sm font-bold text-slate-800 mb-1">
              เคยปฏิบัติงานหรือเรียนกับอาจารย์ท่านนี้หรือไม่?
              <span className="text-rose-500 ml-1">*</span>
            </p>
            <p className="text-xs text-slate-400 mb-3">
              กรุณาเลือกเพื่อเปิดแบบประเมิน หรือข้ามหากไม่เคยเรียนด้วย
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Option: เคย */}
              <label
                className={`flex items-center justify-center gap-2 p-3 sm:py-3.5 rounded-xl border-2 cursor-pointer transition-all font-semibold text-sm text-center ${
                  metValue === "เคย"
                    ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  value="เคย"
                  className="sr-only"
                  {...register(metKey, { required: "กรุณาเลือกสถานะ" })}
                />
                <UserCheck className="w-4 h-4" />
                <span>เคยเจอ / เคยเรียนด้วย</span>
              </label>

              {/* Option: ไม่เคย */}
              <label
                className={`flex items-center justify-center gap-2 p-3 sm:py-3.5 rounded-xl border-2 cursor-pointer transition-all font-semibold text-sm text-center ${
                  metValue === "ไม่เคย"
                    ? "border-slate-600 bg-slate-700 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  value="ไม่เคย"
                  className="sr-only"
                  {...register(metKey, { required: "กรุณาเลือกสถานะ" })}
                />
                <UserX className="w-4 h-4" />
                <span>ไม่เคยเจออาจารย์</span>
              </label>
            </div>

            {errors[metKey] && (
              <p className="text-rose-600 text-xs font-medium mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                {errors[metKey]?.message as string}
              </p>
            )}
          </div>

          {/* If "ไม่เคย" chosen: Clean info badge */}
          {metValue === "ไม่เคย" && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ระบบได้บันทึกการข้ามการประเมินอาจารย์ท่านนี้แล้ว
              </span>
              <button
                type="button"
                onClick={onToggleOpen}
                className="text-purple-600 font-semibold hover:underline text-xs"
              >
                ย่อกล่องนี้
              </button>
            </div>
          )}

          {/* Evaluation questions — shown only when "met" */}
          {metValue === "เคย" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>เกณฑ์การประเมินอาจารย์ ({questions.length} ข้อ)</span>
              </div>

              {questions.map((q, qi) => {
                const scoreKey = `i${index}_q${qi + 1}`;
                return (
                  <ScaleInput
                    key={qi}
                    name={scoreKey}
                    label={q}
                    questionNumber={qi + 1}
                    register={register}
                    error={errors[scoreKey]}
                    value={formValues[scoreKey]}
                    required
                  />
                );
              })}

              <TextAreaInput
                name={`i${index}_suggestion`}
                label="ข้อเสนอแนะเพิ่มเติมสำหรับอาจารย์ท่านนี้"
                placeholder="ข้อเสนอแนะ ข้อคิดเห็น หรือความประทับใจ (ถ้ามี)..."
                register={register}
                rows={2}
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
  preview,
}: {
  userId: string;
  instructors: string[];
  questions: string[];
  preview?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "met" | "unmet" | "pending">("all");

  // Track which accordion sections are open (all open by default)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    instructors.forEach((_, i) => {
      initial[i] = true;
    });
    return initial;
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form2Values>();

  const formValues = watch();

  // Progress calculations
  const { totalInstructors, completedInstructors, percent } = useMemo(() => {
    const total = instructors.length;
    let completed = 0;

    instructors.forEach((_, i) => {
      const metVal = formValues[`i${i}_met`];
      if (metVal === "ไม่เคย") {
        completed += 1;
      } else if (metVal === "เคย") {
        // Check if all questions are answered
        let allAnswered = true;
        questions.forEach((_, qi) => {
          if (!formValues[`i${i}_q${qi + 1}`]) {
            allAnswered = false;
          }
        });
        if (allAnswered) {
          completed += 1;
        }
      }
    });

    return {
      totalInstructors: total,
      completedInstructors: completed,
      percent: Math.round((completed / total) * 100),
    };
  }, [instructors, questions, formValues]);

  const toggleAll = (open: boolean) => {
    const next: Record<number, boolean> = {};
    instructors.forEach((_, i) => {
      next[i] = open;
    });
    setOpenSections(next);
  };

  const onSubmit = async (data: Form2Values) => {
    if (preview) {
      toast.success("นี่คือโหมด Preview (ไม่มีการบันทึกข้อมูลจริง)");
      return;
    }
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

  // Filter instructors based on search & filter tabs
  const filteredInstructors = useMemo(() => {
    return instructors
      .map((name, i) => ({ name, index: i }))
      .filter((item) => {
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        const metVal = formValues[`i${item.index}_met`];
        if (filterMode === "pending") {
          return !metVal;
        }
        if (filterMode === "met") {
          return metVal === "เคย";
        }
        if (filterMode === "unmet") {
          return metVal === "ไม่เคย";
        }
        return true;
      });
  }, [instructors, searchTerm, filterMode, formValues]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-800 via-purple-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-purple-950/20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-purple-100 text-xs font-semibold mb-3 border border-white/10">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>แบบประเมินที่ 2 • อาจารย์วิสัญญีแพทย์</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ 42
          </h1>
          <p className="mt-1.5 text-purple-200 text-sm sm:text-base font-medium">
            ต่อบุคลากรระดับอาจารย์วิสัญญีแพทย์ (จำนวน {instructors.length} ท่าน)
          </p>

          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-purple-200">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
              เกณฑ์คะแนน: 1=ควรปรับปรุง, 2=พอใช้, 3=ปานกลาง, 4=ดี, 5=ดีมาก
            </span>
          </div>
        </div>
      </div>

      <EvaluatorBadge name={user?.displayName ?? ""} />

      {/* Live Sticky Progress Tracker */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold mb-2">
          <span className="text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            ความคืบหน้าการประเมินอาจารย์
          </span>
          <span className="text-purple-700 font-bold">
            {completedInstructors} / {totalInstructors} ท่าน ({percent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่ออาจารย์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Quick open/close buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
            >
              เปิดทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
            >
              ปิดทั้งหมด
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterMode === "all"
                ? "bg-slate-800 text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด ({instructors.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("pending")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterMode === "pending"
                ? "bg-purple-600 text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ยังไม่ได้ประเมิน
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("met")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterMode === "met"
                ? "bg-emerald-600 text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            เคยเจอ
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("unmet")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterMode === "unmet"
                ? "bg-slate-600 text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ไม่เคยเจอ (ข้าม)
          </button>
        </div>
      </div>

      {/* Instructors list */}
      <div className="space-y-4">
        {filteredInstructors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-600">ไม่พบรายชื่ออาจารย์ตามเงื่อนไขที่เลือก</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterMode("all");
              }}
              className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
            >
              ล้างการค้นหาและตัวกรอง
            </button>
          </div>
        ) : (
          filteredInstructors.map(({ name, index }) => (
            <InstructorSection
              key={name}
              index={index}
              name={name}
              questions={questions}
              register={register}
              errors={errors}
              formValues={formValues}
              isOpen={openSections[index] ?? true}
              onToggleOpen={() =>
                setOpenSections((prev) => ({
                  ...prev,
                  [index]: !prev[index],
                }))
              }
            />
          ))
        )}
      </div>

      {/* Bottom Submit action */}
      <div className="pt-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              สถานะ:{" "}
              {percent === 100
                ? "ประเมินอาจารย์ครบทุกท่านแล้ว"
                : `เหลืออีก ${totalInstructors - completedInstructors} ท่าน`}
            </span>
            <span>{percent}% เสร็จสิ้น</span>
          </div>
          <SubmitButton
            loading={submitting}
            label={
              percent === 100
                ? "ส่งแบบประเมินอาจารย์ทั้งหมด"
                : `ส่งแบบประเมิน (${completedInstructors}/${totalInstructors} ท่าน)`
            }
          />
        </div>
      </div>
    </form>
  );
}
