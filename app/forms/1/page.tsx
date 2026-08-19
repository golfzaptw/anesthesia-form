"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCompletedForms, getFormConfig } from "@/lib/firestore";
import type { FormConfig } from "@/lib/formData";
import { Form1 } from "@/components/forms/Form1";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Form1Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<FormConfig | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    // Guard: redirect if already submitted
    getCompletedForms(user.uid).then((completed) => {
      if (completed.includes("form_1")) router.replace("/hub");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/hub"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
        <Form1 userId={user.uid} questions={config.form1Questions} />
      </div>
    </div>
  );
}
