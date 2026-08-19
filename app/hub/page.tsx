"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getCompletedForms, getFormConfig } from "@/lib/firestore";
import { FormCard } from "@/components/ui/FormCard";
import { LogOut, Stethoscope, FlaskConical, RotateCcw, BarChart3, Clock, AlertTriangle } from "lucide-react";
import { IS_MOCK } from "@/lib/mockMode";
import { mockReset } from "@/lib/mockStore";
import { isAdmin, HAS_ADMINS } from "@/lib/admin";
import { FORMS_META, type FormConfig } from "@/lib/formData";
import type { FormId } from "@/types";
import toast from "react-hot-toast";

export default function HubPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [completedForms, setCompletedForms] = useState<FormId[]>([]);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCompletedForms(user.uid), getFormConfig()])
      .then(([forms, conf]) => {
        setCompletedForms(forms);
        setConfig(conf);
      })
      .finally(() => setFetchingStatus(false));
  }, [user]);

  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    document.cookie = "auth_session=; path=/; max-age=0";
    toast.success("ออกจากระบบแล้ว");
    router.replace("/login");
  };

  const handleResetDemo = () => {
    mockReset();
    document.cookie = "auth_session=; path=/; max-age=0";
    toast.success("ล้างข้อมูลทดสอบแล้ว");
    router.replace("/login");
  };

  if (loading || fetchingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const completed = completedForms.length;

  let isDisabled = false;
  let disabledMessage = "";
  let timerUI = null;

  if (config) {
    const startMs = config.startDate ? new Date(config.startDate).getTime() : 0;
    const endMs = config.endDate ? new Date(config.endDate).getTime() : 0;

    if (config.isForceClosed) {
      isDisabled = true;
      disabledMessage = "แบบประเมินถูกปิดชั่วคราวโดยผู้ดูแลระบบ";
      timerUI = (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">ปิดการประเมินชั่วคราว</p>
            <p className="text-xs text-red-700 mt-0.5">ผู้ดูแลระบบได้ทำการปิดรับการประเมินชั่วคราว กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      );
    } else if (startMs > 0 && now < startMs) {
      isDisabled = true;
      disabledMessage = `ยังไม่เปิด (เปิด ${new Date(startMs).toLocaleString("th-TH")})`;
      timerUI = (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">ยังไม่ถึงเวลาเปิดให้ประเมิน</p>
            <p className="text-xs text-blue-700 mt-0.5">แบบประเมินจะเปิดให้ทำในเวลา {new Date(startMs).toLocaleString("th-TH")}</p>
          </div>
        </div>
      );
    } else if (endMs > 0 && now > endMs) {
      isDisabled = true;
      disabledMessage = "หมดเวลาการประเมินแล้ว";
      timerUI = (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Clock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">หมดเวลาการทำแบบประเมิน</p>
            <p className="text-xs text-gray-600 mt-0.5">แบบประเมินได้ปิดรับคำตอบแล้วเมื่อ {new Date(endMs).toLocaleString("th-TH")}</p>
          </div>
        </div>
      );
    } else if (endMs > 0 && now <= endMs) {
      // It's open and has an end date, show countdown
      const diff = endMs - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      timerUI = (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">เวลาที่เหลือในการทำแบบประเมิน</p>
              <p className="text-xs text-amber-700 mt-0.5">จะปิดรับในวันที่ {new Date(endMs).toLocaleString("th-TH")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-800 font-mono font-bold text-lg bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
            {days > 0 && <span>{days}d</span>}
            <span>{hours.toString().padStart(2, '0')}:</span>
            <span>{minutes.toString().padStart(2, '0')}:</span>
            <span>{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white rounded-lg p-1.5">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-800 text-sm">แบบประเมินความพึงพอใจ</span>
          </div>
          <div className="flex items-center gap-4">
            {(!HAS_ADMINS || isAdmin(user.email)) && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                สรุปผล
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {IS_MOCK && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">โหมดทดสอบ (Demo Mode)</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                ยังไม่ได้เชื่อมต่อ Firebase — ข้อมูลถูกเก็บใน localStorage ของเบราว์เซอร์เท่านั้น
              </p>
              <button
                onClick={handleResetDemo}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างข้อมูลทดสอบทั้งหมด
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            สวัสดี {user.displayName || "ผู้ใช้งาน"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{completed}</span>
            <span>จาก</span>
            <span className="font-semibold">{FORMS_META.length}</span>
            <span>แบบประเมินเสร็จสิ้น</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completed / FORMS_META.length) * 100}%` }}
            />
          </div>
        </div>

        {timerUI}

        <div className="space-y-4">
          {FORMS_META.map((form) => (
            <FormCard
              key={form.id}
              {...form}
              completed={completedForms.includes(form.id)}
              disabled={isDisabled}
              disabledMessage={disabledMessage}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
