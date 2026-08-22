"use client";

import { useState, useMemo } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  CheckCircle2,
  Search,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import type { DepartmentData } from "@/lib/formData";

type Form3Values = Record<string, string>;

// ─────────────────────────────────────────────
// Collapsible department section
// ─────────────────────────────────────────────
function DeptSection({
  dept,
  staff,
  deptIndex,
  register,
  errors,
  formValues,
  isOpen,
  onToggleOpen,
  searchTerm,
}: {
  dept: string;
  staff: string[];
  deptIndex: number;
  register: ReturnType<typeof useForm<Form3Values>>["register"];
  errors: FieldErrors<Form3Values>;
  formValues: Form3Values;
  isOpen: boolean;
  onToggleOpen: () => void;
  searchTerm?: string;
}) {
  // Count how many staff in this department have feedback entered
  const { filledCount, hasErrors } = useMemo(() => {
    let count = 0;
    let err = false;
    staff.forEach((_, si) => {
      const fieldKey = `d${deptIndex}_s${si}`;
      const val = formValues[fieldKey];
      if (val && val.trim().length > 0) count += 1;
      if (errors[fieldKey]) err = true;
    });
    return { filledCount: count, hasErrors: err };
  }, [staff, deptIndex, formValues, errors]);

  const isAllFilled = filledCount === staff.length;

  // Filter staff by search term if provided
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff.map((name, i) => ({ name, index: i }));
    return staff
      .map((name, i) => ({ name, index: i }))
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [staff, searchTerm]);

  if (filteredStaff.length === 0 && searchTerm) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-sm ${hasErrors
          ? "border-rose-300 ring-1 ring-rose-300 bg-rose-50/10"
          : isAllFilled
            ? "border-teal-200 bg-teal-50/20"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
    >
      {/* Department Header */}
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-slate-50 hover:bg-teal-50 transition-colors gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${hasErrors
                ? "bg-rose-500 text-white"
                : isAllFilled
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-br from-teal-600 to-emerald-600 text-white"
              }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm sm:text-base leading-snug block truncate">
              {dept}
            </span>
            <span className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>{staff.length} ท่าน (จำเป็นต้องกรอกทุกคน)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasErrors ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ยังไม่ครบ
            </span>
          ) : isAllFilled ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ครบแล้ว ({filledCount}/{staff.length})
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {filledCount}/{staff.length} ท่าน
            </span>
          )}
          <div className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Staff Cards */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4 border-t border-teal-100/60 bg-slate-50/40">
          {filteredStaff.map(({ name, index }) => {
            const fieldKey = `d${deptIndex}_s${index}`;
            const currentValue = formValues[fieldKey] || "";
            const isFilled = currentValue.trim().length > 0;
            const fieldError = errors[fieldKey];

            return (
              <div
                key={index}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-150 ${fieldError
                    ? "border-rose-300 bg-rose-50/30 ring-1 ring-rose-300"
                    : isFilled
                      ? "border-teal-200 bg-white shadow-sm ring-1 ring-teal-200/50"
                      : "border-slate-200/80 bg-white hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {name}
                        <span className="text-rose-500 ml-1 font-bold">*</span>
                      </p>
                      <p className="text-xs text-slate-400">พยาบาลวิสัญญี / เจ้าหน้าที่</p>
                    </div>
                  </div>

                  {isFilled && (
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      ระบุข้อความแล้ว
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <textarea
                    rows={2}
                    placeholder={`กรุณาระบุข้อเสนอแนะ ความประทับใจ หรือข้อคิดเห็นสำหรับ ${name}...`}
                    className={`w-full rounded-xl border p-3 text-sm text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-y ${fieldError ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                      }`}
                    {...register(fieldKey, {
                      required: "กรุณาระบุข้อคิดเห็น/ข้อเสนอแนะสำหรับท่านนี้",
                      validate: (v) => (v && v.trim().length > 0) || "กรุณากรอกข้อความ",
                    })}
                  />
                </div>

                {fieldError && (
                  <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    {fieldError.message as string}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Form 3 main component
// ─────────────────────────────────────────────
export function Form3({
  userId,
  departments,
  preview,
}: {
  userId: string;
  departments: DepartmentData[];
  preview?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Track accordion open state (all closed by default)
  const [openDepts, setOpenDepts] = useState<Record<number, boolean>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form3Values>();

  const formValues = watch();

  // Calculate total staff & total feedback written
  const { totalStaffCount, filledFeedbackCount, percent } = useMemo(() => {
    let total = 0;
    let filled = 0;

    departments.forEach((d, di) => {
      total += d.staff.length;
      d.staff.forEach((_, si) => {
        const val = formValues[`d${di}_s${si}`];
        if (val && val.trim().length > 0) filled += 1;
      });
    });

    const p = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { totalStaffCount: total, filledFeedbackCount: filled, percent: p };
  }, [departments, formValues]);

  const toggleAll = (open: boolean) => {
    const next: Record<number, boolean> = {};
    departments.forEach((_, i) => {
      next[i] = open;
    });
    setOpenDepts(next);
  };

  const onSubmit = async (data: Form3Values) => {
    if (preview) {
      toast.success("นี่คือโหมด Preview (ไม่มีการบันทึกข้อมูลจริง)");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      await submitFormResponse({
        formId: "form_3",
        userId,
        userEmail: user.email ?? "",
        evaluatorName: user.displayName ?? "",
        answers: data,
      });
      await markFormComplete(userId, "form_3");
      toast.success("ส่งแบบประเมินสำเร็จ!");
      router.replace("/hub");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (formErrors: FieldErrors<Form3Values>) => {
    // Automatically open departments that have errors so user sees what is missing
    const nextOpen = { ...openDepts };
    let firstErrorDept = -1;

    departments.forEach((d, di) => {
      d.staff.forEach((_, si) => {
        if (formErrors[`d${di}_s${si}`]) {
          nextOpen[di] = true;
          if (firstErrorDept === -1) firstErrorDept = di;
        }
      });
    });

    setOpenDepts(nextOpen);
    toast.error("กรุณาระบุข้อเสนอแนะให้ครบทุกคน (จำเป็นต้องใส่ครบทุกท่าน)");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-teal-950/20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-semibold mb-3 border border-white/10">
            <Users className="w-3.5 h-3.5" />
            <span>แบบประเมินที่ 3 • พยาบาลวิสัญญีตามแผนก</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ 41
          </h1>
          <p className="mt-1.5 text-teal-200 text-sm sm:text-base font-medium">
            ต่อบุคลากรระดับพยาบาลวิสัญญี (แยกตาม {departments.length} แผนก • รวม {totalStaffCount} ท่าน)
          </p>

          <div className="mt-5 pt-4 border-t border-white/15 text-xs text-teal-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold text-white">
              * กรอกข้อเสนอแนะหรือความคิดเห็นให้ครบทุกท่าน ({totalStaffCount} ท่าน)
            </span>
          </div>
        </div>
      </div>

      <EvaluatorBadge name={user?.displayName ?? ""} />

      {/* Live Sticky Summary & Progress Bar */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold mb-2">
          <span className="text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            ความคืบหน้าการประเมิน
          </span>
          <span className="text-teal-700 font-bold">
            {filledFeedbackCount} / {totalStaffCount} ท่าน ({percent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Controls: Search & Expand/Collapse */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อเจ้าหน้าที่ / พยาบาล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors"
          >
            เปิดทุกแผนก
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
          >
            ปิดทุกแผนก
          </button>
        </div>
      </div>

      {/* Department list */}
      <div className="space-y-4">
        {departments.map((d, di) => (
          <DeptSection
            key={di}
            dept={d.dept}
            staff={d.staff}
            deptIndex={di}
            register={register}
            errors={errors}
            formValues={formValues}
            isOpen={openDepts[di] ?? false}
            onToggleOpen={() =>
              setOpenDepts((prev) => ({
                ...prev,
                [di]: !prev[di],
              }))
            }
            searchTerm={searchTerm}
          />
        ))}
      </div>

      {/* Bottom Submit */}
      <div className="pt-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              สถานะ:{" "}
              {percent === 100
                ? "กรอกข้อมูลครบทุกคนแล้ว"
                : `เหลืออีก ${totalStaffCount - filledFeedbackCount} ท่าน`}
            </span>
            <span>{percent}% เสร็จสิ้น</span>
          </div>
          <SubmitButton
            loading={submitting}
            label={
              percent === 100
                ? "ส่งแบบประเมินพยาบาลวิสัญญีทั้งหมด"
                : `ส่งแบบประเมิน (${filledFeedbackCount}/${totalStaffCount} ท่าน)`
            }
          />
        </div>
      </div>
    </form>
  );
}
