"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitFormResponse, markFormComplete } from "@/lib/firestore";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EvaluatorBadge } from "@/components/ui/EvaluatorBadge";
import { ChevronDown, ChevronUp } from "lucide-react";
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
}: {
  dept: string;
  staff: string[];
  deptIndex: number;
  register: ReturnType<typeof useForm<Form3Values>>["register"];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-teal-50 px-5 py-3 text-left"
      >
        <span className="font-bold text-teal-800 text-sm">{dept}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-teal-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-teal-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {staff.map((name, si) => (
            <div key={si} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <label className="block text-sm font-semibold text-teal-700 mb-2">
                {name}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="ข้อเสนอแนะ / ความคิดเห็น..."
                className="w-full border-b-2 border-gray-300 bg-transparent pb-1 text-sm focus:outline-none focus:border-teal-500 resize-none transition-colors"
                {...register(`d${deptIndex}_s${si}`)}
              />
            </div>
          ))}
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
  departments
}: { 
  userId: string;
  departments: DepartmentData[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<Form3Values>();

  const onSubmit = async (data: Form3Values) => {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="bg-teal-700 text-white rounded-2xl p-6 mb-2">
        <h1 className="text-xl font-bold leading-snug">
          แบบประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี รุ่นที่ 41
          ต่อบุคลากรระดับพยาบาลวิสัญญี
        </h1>
        <p className="mt-3 text-teal-100 text-xs leading-relaxed">
          กรุณากรอกข้อเสนอแนะหรือความคิดเห็นสำหรับบุคลากรแต่ละท่าน
        </p>
      </div>

      <EvaluatorBadge name={user?.displayName ?? ""} />

      <SectionHeader
        title="รายชื่อเจ้าหน้าที่แยกตามแผนก"
        subtitle="คลิกที่ชื่อแผนกเพื่อเปิด/ปิดรายการ"
      />

      {departments.map((d, di) => (
        <DeptSection
          key={di}
          dept={d.dept}
          staff={d.staff}
          deptIndex={di}
          register={register}
        />
      ))}

      <div className="pt-2 pb-8">
        <SubmitButton loading={submitting} />
      </div>
    </form>
  );
}
