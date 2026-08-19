"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllSubmissions, getAllUsers, getFormConfig } from "@/lib/firestore";
import { isAdmin, HAS_ADMINS } from "@/lib/admin";
import { FORMS_META, type FormConfig } from "@/lib/formData";
import {
  analyseForm1,
  analyseForm2,
  analyseForm3,
  overallAverage,
} from "@/lib/analytics";
import { submissionsToCsv, downloadCsv } from "@/lib/csv";
import { StatCard } from "@/components/admin/StatCard";
import { ScoreBar } from "@/components/admin/ScoreBar";
import { Collapsible } from "@/components/admin/Collapsible";
import { FormEditor } from "@/components/admin/FormEditor";
import {
  LogOut,
  Users,
  FileCheck2,
  Star,
  Download,
  MessageSquare,
  ShieldAlert,
  BarChart3,
} from "lucide-react";
import type { FormId, StoredSubmission, UserSummary } from "@/types";
import toast from "react-hot-toast";

type Tab = FormId | "overview" | "editor";

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const allowed = !HAS_ADMINS || isAdmin(user?.email);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !allowed) return;
    Promise.all([getAllSubmissions(), getAllUsers(), getFormConfig()])
      .then(([subs, us, conf]) => {
        setSubmissions(subs);
        setUsers(us.filter((u) => !isAdmin(u.email)));
        setConfig(conf);
      })
      .finally(() => setFetching(false));
  }, [user, allowed]);

  const byForm = useMemo(
    () => ({
      form_1: submissions.filter((s) => s.formId === "form_1"),
      form_2: submissions.filter((s) => s.formId === "form_2"),
      form_3: submissions.filter((s) => s.formId === "form_3"),
    }),
    [submissions]
  );

  const form1 = useMemo(() => config ? analyseForm1(byForm.form_1, config) : { scores: [], comments: [] }, [byForm.form_1, config]);
  const form2 = useMemo(() => config ? analyseForm2(byForm.form_2, config) : [], [byForm.form_2, config]);
  const form3 = useMemo(() => config ? analyseForm3(byForm.form_3, config) : [], [byForm.form_3, config]);

  if (loading || (user && allowed && fetching)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="inline-flex bg-red-100 text-red-600 rounded-full p-3 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-sm text-gray-500 mt-1">
            บัญชีนี้ไม่ได้รับสิทธิ์ผู้ดูแลระบบ
          </p>
          <Link
            href="/hub"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const totalPossible = users.length * FORMS_META.length;
  const completionRate = totalPossible
    ? Math.round((submissions.length / totalPossible) * 100)
    : 0;
  const form1Avg = overallAverage(form1.scores);

  const handleExport = (formId: FormId) => {
    const subs = byForm[formId];
    if (!subs.length) return;
    downloadCsv(`${formId}_submissions.csv`, submissionsToCsv(subs));
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "ภาพรวม" },
    { id: "form_1", label: "การเรียนการสอน" },
    { id: "form_2", label: "อาจารย์แพทย์" },
    { id: "form_3", label: "พยาบาลวิสัญญี" },
    { id: "editor", label: "ตั้งค่าแบบประเมิน" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            สรุปผลสำหรับผู้ดูแล
          </span>
          
          <button
            onClick={async () => {
              await signOut();
              document.cookie = "auth_session=; path=/; max-age=0";
              toast.success("ออกจากระบบแล้ว");
              router.replace("/login");
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="ผู้ลงทะเบียน" value={users.length} tone="blue" />
          <StatCard
            icon={FileCheck2}
            label="แบบประเมินที่ส่งแล้ว"
            value={submissions.length}
            sub={`จากทั้งหมด ${totalPossible}`}
            tone="green"
          />
          <StatCard
            icon={Star}
            label="อัตราการตอบกลับ"
            value={`${completionRate}%`}
            tone="amber"
          />
          <StatCard
            icon={Star}
            label="คะแนนเฉลี่ยหลักสูตร"
            value={form1Avg ? form1Avg.toFixed(2) : "—"}
            sub="เต็ม 5"
            tone="indigo"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview: per-user completion */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {FORMS_META.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 leading-snug">{f.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    {byForm[f.id].length}
                  </p>
                  <button
                    onClick={() => handleExport(f.id)}
                    disabled={!byForm[f.id].length}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                  >
                    <Download className="w-3 h-3" />
                    ดาวน์โหลด CSV
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-sm text-gray-800">
                  สถานะรายบุคคล ({users.length})
                </h2>
              </div>
              {users.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">
                  ยังไม่มีผู้ลงทะเบียน
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left font-medium px-4 py-2">ชื่อผู้ประเมิน</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 1</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 2</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.uid} className="border-t border-gray-100">
                          <td className="px-4 py-2">
                            <p className="text-gray-800">{u.displayName || "—"}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </td>
                          {FORMS_META.map((f) => (
                            <td key={f.id} className="text-center px-2 py-2">
                              {u.completedForms.includes(f.id) ? (
                                <span className="text-green-600">✓</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form 1 */}
        {tab === "form_1" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-sm text-gray-800 mb-1">
                คะแนนเฉลี่ยรายข้อ
              </h2>
              <p className="text-xs text-gray-400 mb-2">
                จาก {byForm.form_1.length} คำตอบ
              </p>
              {form1.scores.map((s) => (
                <ScoreBar key={s.label} {...s} />
              ))}
            </div>

            <Collapsible
              title="ข้อเสนอแนะทั้งหมด"
              badge={`${form1.comments.length}`}
            >
              {form1.comments.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อเสนอแนะ</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {form1.comments.map((c, i) => (
                    <li key={i} className="py-3">
                      <p className="text-xs text-gray-400">{c.label}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
                      <p className="text-xs text-gray-400 mt-1">— {c.evaluatorName}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Collapsible>
          </div>
        )}

        {/* Form 2 */}
        {tab === "form_2" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              จาก {byForm.form_2.length} คำตอบ — เรียงตามคะแนนเฉลี่ย
            </p>
            {[...form2]
              .sort((a, b) => b.overallAverage - a.overallAverage)
              .map((ins) => (
                <Collapsible
                  key={ins.name}
                  title={ins.name}
                  badge={
                    ins.metCount
                      ? `${ins.overallAverage.toFixed(2)} · เคยเจอ ${ins.metCount}`
                      : "ยังไม่มีผู้ประเมิน"
                  }
                >
                  <div className="pt-2">
                    {ins.scores.map((s) => (
                      <ScoreBar key={s.label} {...s} />
                    ))}
                    {ins.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                          <MessageSquare className="w-3 h-3" />
                          ข้อเสนอแนะ
                        </p>
                        <ul className="space-y-2">
                          {ins.comments.map((c, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              {c.text}
                              <span className="text-xs text-gray-400 ml-2">
                                — {c.evaluatorName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Collapsible>
              ))}
          </div>
        )}

        {/* Form 3 */}
        {tab === "form_3" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">จาก {byForm.form_3.length} คำตอบ</p>
            {form3.map((d) => {
              const total = d.staff.reduce((acc, s) => acc + s.comments.length, 0);
              return (
                <Collapsible
                  key={d.dept}
                  title={d.dept}
                  badge={`${total} ความเห็น`}
                >
                  <ul className="divide-y divide-gray-100 pt-1">
                    {d.staff.map((s) => (
                      <li key={s.name} className="py-3">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        {s.comments.length === 0 ? (
                          <p className="text-xs text-gray-300 mt-0.5">ยังไม่มีความเห็น</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {s.comments.map((c, i) => (
                               <li key={i} className="text-sm text-gray-600">
                                {c.text}
                                <span className="text-xs text-gray-400 ml-2">
                                  — {c.evaluatorName}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Editor */}
        {tab === "editor" && config && (
          <FormEditor
            initialConfig={config}
            onSave={(newConfig) => setConfig(newConfig)}
          />
        )}
      </main>
    </div>
  );
}
