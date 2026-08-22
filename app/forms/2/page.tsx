"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCompletedForms, getFormConfig } from "@/lib/firestore";
import type { FormConfig } from "@/lib/formData";
import { Form2 } from "@/components/forms/Form2";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Form2Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<FormConfig | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    getCompletedForms(user.uid).then((completed) => {
      if (completed.includes("form_2")) router.replace("/hub");
    });
    getFormConfig().then((conf) => {
      const now = Date.now();
      const startMs = conf.startDate ? new Date(conf.startDate).getTime() : 0;
      const endMs = conf.endDate ? new Date(conf.endDate).getTime() : 0;
      
      if (
        conf.isForceClosed || 
        (startMs > 0 && now < startMs) || 
        (endMs > 0 && now > endMs)
      ) {
        router.replace("/hub");
        return;
      }
      setConfig(conf);
    });
  }, [user, loading, router]);

  if (loading || !user || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-200 flex items-center justify-center text-purple-600">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">กำลังโหลดแบบประเมินอาจารย์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-slate-50 to-violet-50/30 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/hub"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-xl transition-all border border-slate-200 hover:border-purple-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block animate-pulse" />
            <span>โหมดประเมินอาจารย์</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        <Form2 
          userId={user.uid} 
          instructors={config.form2Instructors} 
          questions={config.form2Questions} 
        />
      </main>
    </div>
  );
}
