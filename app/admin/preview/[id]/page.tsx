"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFormConfig } from "@/lib/firestore";
import type { FormConfig } from "@/lib/formData";
import { Form1 } from "@/components/forms/Form1";
import { Form2 } from "@/components/forms/Form2";
import { Form3 } from "@/components/forms/Form3";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, HAS_ADMINS } from "@/lib/admin";

export default function AdminPreviewPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<FormConfig | null>(null);

  const allowed = !HAS_ADMINS || isAdmin(user?.email);

  useEffect(() => {
    if (loading) return;
    if (!user || !allowed) {
      router.replace("/login");
      return;
    }
    getFormConfig().then(setConfig);
  }, [user, loading, allowed, router]);

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแอดมิน
          </Link>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">
            โหมด Preview (แอดมิน)
          </span>
        </div>
        
        {params.id === "1" && (
          <Form1 userId="preview-user" questions={config.form1Questions} preview={true} />
        )}
        {params.id === "2" && (
          <Form2 userId="preview-user" instructors={config.form2Instructors} questions={config.form2Questions} preview={true} />
        )}
        {params.id === "3" && (
          <Form3 userId="preview-user" departments={config.form3Departments} preview={true} />
        )}
        
        {!["1", "2", "3"].includes(params.id) && (
          <div className="text-center py-12 text-gray-500">
            ไม่พบแบบฟอร์มที่ระบุ
          </div>
        )}
      </div>
    </div>
  );
}
