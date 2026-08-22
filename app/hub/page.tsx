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
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (isAdmin(user.email)) {
        window.location.href = "/admin";
      }
    }
  }, [user, loading]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-16">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl p-2 shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm sm:text-base leading-tight block">ระบบประเมินความพึงพอใจ</span>
              <span className="text-[11px] text-slate-400 font-medium">หลักสูตรพยาบาลวิสัญญี</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(!HAS_ADMINS || isAdmin(user.email)) && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all border border-slate-200 hover:border-blue-200"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>สรุปผล</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all border border-slate-200 hover:border-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>ออก</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {IS_MOCK && (
          <div className="mb-6 flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">โหมดทดสอบ (Demo Mode)</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                ยังไม่ได้เชื่อมต่อ Firebase — ข้อมูลถูกเก็บใน localStorage ของเบราว์เซอร์เท่านั้น
              </p>
              <button
                onClick={handleResetDemo}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างข้อมูลทดสอบทั้งหมด</span>
              </button>
            </div>
          </div>
        )}

        {/* Welcome Card & Progress */}
        <div className="mb-6 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                ยินดีต้อนรับ
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                {user.displayName || "ผู้ใช้งาน"}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">{user.email}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-500/20 shrink-0">
              {(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-600">ความคืบหน้าการทำแบบประเมิน</span>
              <span className="text-blue-600 font-bold">
                {completed} จาก {FORMS_META.length} ชุด ({Math.round((completed / FORMS_META.length) * 100)}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(completed / FORMS_META.length) * 100}%` }}
              />
            </div>
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
