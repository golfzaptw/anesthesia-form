"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllSubmissions, getAllUsers, getFormConfig, deleteUser, saveFormConfig, createNewBatch, migrateSubmissionIds } from "@/lib/firestore";
import { isAdmin, HAS_ADMINS } from "@/lib/admin";
import { getFormsMeta, type FormConfig } from "@/lib/formData";
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
import { Footer } from "@/components/ui/Footer";
import {
  LogOut,
  Users,
  FileCheck2,
  Star,
  Download,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  Trash2,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  Sliders,
  ChevronDown,
  Plus,
  Layers,
  Pencil,
  DatabaseZap,
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
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Batch state
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const allowed = !HAS_ADMINS || isAdmin(user?.email);

  const activeBatch = selectedBatch ?? config?.currentBatch ?? 42;
  const isViewingCurrentBatch = activeBatch === config?.currentBatch;

  const formsMeta = useMemo(() => getFormsMeta(activeBatch), [activeBatch]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !allowed) return;
    getFormConfig()
      .then((conf) => {
        setConfig(conf);
        setSelectedBatch(conf.currentBatch);
        return Promise.all([
          getAllSubmissions(conf.currentBatch),
          getAllUsers(),
        ]);
      })
      .then(([subs, us]) => {
        setSubmissions(subs);
        setUsers(us.filter((u) => !isAdmin(u.email)));
      })
      .finally(() => setFetching(false));
  }, [user, allowed]);

  // Re-fetch submissions when batch selection changes
  useEffect(() => {
    if (!user || !allowed || selectedBatch === null || fetching) return;
    getAllSubmissions(selectedBatch).then(setSubmissions);
  }, [selectedBatch, user, allowed, fetching]);

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

  const formLockStatus = useMemo(() => {
    if (!config) return { state: "loading", label: "กำลังโหลดสถานะ...", desc: "", tone: "gray" };
    if (config.isForceClosed) {
      return {
        state: "force_closed",
        label: "ปิดการประเมินชั่วคราว (Force Closed)",
        desc: "ผู้ดูแลระบบบังคับปิดรับการประเมิน — นักเรียนทุกคนไม่สามารถเข้าทำแบบประเมินได้",
        tone: "red",
      };
    }
    const startMs = config.startDate ? new Date(config.startDate).getTime() : 0;
    const endMs = config.endDate ? new Date(config.endDate).getTime() : 0;

    if (startMs > 0 && now < startMs) {
      return {
        state: "scheduled_future",
        label: "ยังไม่ถึงเวลาเปิดให้ประเมิน",
        desc: `กำหนดเปิดรับคำตอบในวันที่ ${new Date(startMs).toLocaleString("th-TH")}`,
        tone: "blue",
      };
    }
    if (endMs > 0 && now > endMs) {
      return {
        state: "expired",
        label: "หมดเวลาการทำแบบประเมิน",
        desc: `ปิดรับคำตอบแล้วเมื่อวันที่ ${new Date(endMs).toLocaleString("th-TH")}`,
        tone: "gray",
      };
    }
    return {
      state: "open",
      label: "เปิดรับการประเมินตามปกติ",
      desc: endMs > 0 
        ? `เปิดรับคำตอบอยู่ (จะปิดรับในวันที่ ${new Date(endMs).toLocaleString("th-TH")})`
        : "เปิดรับคำตอบตลอดเวลา (ไม่มีกำหนดเวลาปิด)",
      tone: "green",
    };
  }, [config, now]);

  // Filter users by activeBatch:
  // A user belongs to the active batch if they submitted a form in this batch,
  // OR if their registered batches includes the active batch.
  const batchUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      // 1. Did the user submit anything in this batch?
      const hasSubmittedInBatch = submissions.some(
        (s) => s.userId === u.uid || (u.email && s.userEmail === u.email)
      );
      if (hasSubmittedInBatch) return true;

      // 2. Was the user registered in this batch?
      const userBatches = u.batches ?? (u.batchId ? [u.batchId] : [42]);
      return userBatches.includes(activeBatch);
    });

    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [users, submissions, activeBatch]);

  const totalPossible = batchUsers.length * formsMeta.length;
  const completionRate = totalPossible
    ? Math.round((submissions.length / totalPossible) * 100)
    : 0;
  const form1Avg = overallAverage(form1.scores);

  // Auto-switch to overview if switching to a past batch while in editor tab
  useEffect(() => {
    if (!isViewingCurrentBatch && tab === "editor") {
      setTab("overview");
    }
  }, [isViewingCurrentBatch, tab]);

  const TABS: { id: Tab; label: string }[] = useMemo(() => {
    const base: { id: Tab; label: string }[] = [
      { id: "overview", label: "ภาพรวม" },
      { id: "form_1", label: "การเรียนการสอน" },
      { id: "form_2", label: "อาจารย์แพทย์" },
      { id: "form_3", label: "พยาบาลวิสัญญี" },
    ];
    if (isViewingCurrentBatch) {
      base.push({ id: "editor", label: "ตั้งค่าแบบประเมิน" });
    }
    return base;
  }, [isViewingCurrentBatch]);

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

  const handleQuickToggleForceClose = async () => {
    if (!config) return;
    const newClosed = !config.isForceClosed;
    const newConfig: FormConfig = { ...config, isForceClosed: newClosed };
    try {
      await saveFormConfig(newConfig);
      setConfig(newConfig);
      toast.success(newClosed ? "🔒 บังคับปิดรับการประเมินแล้ว" : "🔓 เปิดรับการประเมินตามปกติแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleCreateNewBatch = async () => {
    if (!config) return;
    const nextBatch = config.currentBatch + 1;
    setIsCreatingBatch(true);
    try {
      const newConfig = await createNewBatch(config, nextBatch);
      setConfig(newConfig);
      setSelectedBatch(nextBatch);
      // Re-fetch submissions for the new batch (will be empty)
      const subs = await getAllSubmissions(nextBatch);
      setSubmissions(subs);
      toast.success(`🎉 สร้างรุ่นที่ ${nextBatch} สำเร็จ!`);
      setShowNewBatchModal(false);
    } catch (err) {
      console.error("Failed to create new batch:", err);
      toast.error("เกิดข้อผิดพลาดในการสร้างรุ่นใหม่");
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleExport = (formId: FormId) => {
    const subs = byForm[formId];
    if (!subs.length || !config) return;
    downloadCsv(`${formId}_batch${activeBatch}_submissions.csv`, submissionsToCsv(subs, formId, config));
  };

  const handleMigrateSubmissions = async () => {
    setIsMigrating(true);
    try {
      const { migrated, skipped } = await migrateSubmissionIds();
      const subs = await getAllSubmissions(activeBatch);
      setSubmissions(subs);
      toast.success(`ย้ายข้อมูลเก่าสำเร็จ — ย้ายแล้ว ${migrated} รายการ, ข้าม ${skipped} รายการ`);
    } catch (err) {
      console.error("Submission migration failed:", err);
      toast.error("ย้ายข้อมูลไม่สำเร็จ — กรุณาตรวจสอบ Firestore Rules");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await deleteUser(userToDelete.uid, userToDelete.email, userToDelete.displayName);
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      setSubmissions((prev) =>
        prev.filter(
          (s) => s.userId !== userToDelete.uid && s.userEmail !== userToDelete.email
        )
      );
      toast.success(
        `ลบผู้เข้าร่วมประเมิน ${userToDelete.displayName || userToDelete.email} สำเร็จ`
      );
      setUserToDelete(null);
    } catch (err: unknown) {
      console.error("Failed to delete user:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("permission-denied")) {
        toast.error("Permission Denied: ไม่มีสิทธิ์ลบข้อมูลใน Firebase (กรุณาตั้งค่า Firestore Rules)");
      } else {
        toast.error(`เกิดข้อผิดพลาดในการลบ: ${message.slice(0, 80)}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
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
            className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Batch Selector */}
        {config && config.batches.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative">
              <button
                onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-blue-300 hover:bg-blue-50/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {config.batches.find((b) => b.id === activeBatch)?.label ?? `รุ่นที่ ${activeBatch}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isViewingCurrentBatch && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ปัจจุบัน
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </button>

              {showBatchDropdown && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowBatchDropdown(false)} />
                  <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-lg min-w-[200px] w-full sm:w-auto py-1 animate-in fade-in zoom-in-95 duration-150">
                    {[...config.batches].reverse().map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBatch(b.id);
                          setShowBatchDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 hover:bg-blue-50 transition-colors ${
                          b.id === activeBatch ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                        }`}
                      >
                        <span>{b.label}</span>
                        <div className="flex items-center gap-1.5">
                          {b.id === config.currentBatch && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ปัจจุบัน
                            </span>
                          )}
                          {b.id === activeBatch && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowNewBatchModal(true)}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              สร้างรุ่นใหม่
            </button>
          </div>
        )}

        {/* Viewing past batch notice */}
        {!isViewingCurrentBatch && config && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      ข้อมูลย้อนหลัง (โหมดดูอย่างเดียว)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                      {config.batches.find((b) => b.id === activeBatch)?.label ?? `รุ่นที่ ${activeBatch}`}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    รุ่นนี้ปิดรับคำตอบแล้ว สามารถดูผลคะแนน สถิติ ข้อเสนอแนะ และดาวน์โหลดรายงาน CSV ได้อย่างเดียว (ไม่สามารถแก้ไขข้อมูลได้)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatch(config.currentBatch)}
                className="text-xs font-semibold text-amber-900 hover:text-white hover:bg-amber-700 bg-amber-200/70 px-3.5 py-2 rounded-xl transition-all border border-amber-300 shrink-0 self-start sm:self-center"
              >
                กลับไปรุ่นปัจจุบัน (รุ่นที่ {config.currentBatch})
              </button>
            </div>
          </div>
        )}

        {/* Assessment Status & Quick Lock Control Card */}
        {config && isViewingCurrentBatch && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
                  formLockStatus.tone === "red" 
                    ? "bg-red-50 text-red-600 border border-red-200" 
                    : formLockStatus.tone === "green"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : formLockStatus.tone === "blue"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {formLockStatus.tone === "red" ? (
                    <Lock className="w-5 h-5" />
                  ) : formLockStatus.tone === "green" ? (
                    <Unlock className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">สถานะระบบประเมิน:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      formLockStatus.tone === "red"
                        ? "bg-red-100/80 text-red-700 border-red-300"
                        : formLockStatus.tone === "green"
                        ? "bg-emerald-100/80 text-emerald-700 border-emerald-300"
                        : formLockStatus.tone === "blue"
                        ? "bg-blue-100/80 text-blue-700 border-blue-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        formLockStatus.tone === "red"
                          ? "bg-red-500"
                          : formLockStatus.tone === "green"
                          ? "bg-emerald-500 animate-pulse"
                          : formLockStatus.tone === "blue"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`} />
                      {formLockStatus.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formLockStatus.desc}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={handleQuickToggleForceClose}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    config.isForceClosed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                  }`}
                >
                  {config.isForceClosed ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      เปิดให้ประเมิน
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      บังคับปิดฟอร์มชั่วคราว
                    </>
                  )}
                </button>

                <button
                  onClick={() => setTab("editor")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  กำหนดวัน/เวลา
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="ผู้ลงทะเบียน" value={batchUsers.length} tone="blue" />
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
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {formsMeta.map((f) => (
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
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-gray-800">
                  สถานะรายบุคคล ({batchUsers.length})
                </h2>
                {isViewingCurrentBatch && (
                  <button
                    onClick={handleMigrateSubmissions}
                    disabled={isMigrating}
                    title="ย้ายคำตอบเก่ามาใช้รหัสอ้างอิงแบบใหม่ เพื่อให้ผู้ประเมินแก้ไขได้ 1 ครั้ง"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DatabaseZap className="w-3.5 h-3.5" />
                    {isMigrating ? "กำลังย้ายข้อมูล..." : "ย้ายข้อมูลเก่าให้แก้ไขได้"}
                  </button>
                )}
              </div>
              {batchUsers.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">
                  ยังไม่มีผู้ลงทะเบียนในรุ่นนี้
                </p>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs sm:text-sm min-w-[480px]">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left font-medium px-4 py-2 w-12">ลำดับ</th>
                        <th className="text-left font-medium px-4 py-2">ชื่อผู้ประเมิน</th>
                        <th className="text-left font-medium px-4 py-2">วันที่ลงทะเบียน</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 1</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 2</th>
                        <th className="text-center font-medium px-2 py-2">ชุด 3</th>
                        {isViewingCurrentBatch && (
                          <th className="text-center font-medium px-2 py-2 w-20">จัดการ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {batchUsers.map((u, index) => (
                        <tr key={u.uid} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-500 text-sm">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2">
                            <p className="font-medium text-gray-800">{u.displayName || "—"}</p>
                            <p className="text-[11px] text-gray-400">{u.email}</p>
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleString("th-TH", {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "—"}
                          </td>
                          {formsMeta.map((f) => {
                            const submission = byForm[f.id].find(
                              (s) => s.userId === u.uid || (u.email && s.userEmail === u.email)
                            );
                            return (
                              <td key={f.id} className="text-center px-2 py-2">
                                {submission ? (
                                  <span className="inline-flex items-center gap-1 justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                    {(submission.editCount ?? 0) >= 1 && (
                                      <span
                                        title="ผู้ประเมินได้แก้ไขคำตอบชุดนี้แล้ว"
                                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded px-1 py-0.5"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                        แก้ไขแล้ว
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          {isViewingCurrentBatch && (
                            <td className="text-center px-2 py-2">
                              <button
                                onClick={() => setUserToDelete(u)}
                                title="ลบผู้เข้าร่วมประเมิน"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
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
              const totalMet = d.staff.reduce((acc, s) => acc + s.metCount, 0);
              return (
                <Collapsible
                  key={d.dept}
                  title={d.dept}
                  badge={d.allowSkip
                    ? `${total} ความเห็น · เคยเจอรวม ${totalMet} ครั้ง`
                    : `${total} ความเห็น`
                  }
                >
                  <ul className="divide-y divide-gray-100 pt-1">
                    {d.staff.map((s) => (
                      <li key={s.name} className="py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{s.name}</p>
                          {d.allowSkip && (
                            <div className="flex items-center gap-2 text-xs shrink-0">
                              {s.metCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                                  เคยเจอ {s.metCount}
                                </span>
                              )}
                              {s.notMetCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                                  ไม่เคยเจอ {s.notMetCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    ยืนยันการลบผู้เข้าร่วมประเมิน
                  </h3>
                  <p className="text-xs text-gray-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4">
                <p className="text-sm font-semibold text-gray-800">
                  {userToDelete.displayName || "ไม่ระบุชื่อ"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{userToDelete.email}</p>
                <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-600">
                  <span>ส่งแบบประเมินแล้ว:</span>
                  <span className="font-semibold text-blue-600">
                    {submissions.filter((s) => s.userId === userToDelete.uid || (userToDelete.email && s.userEmail === userToDelete.email)).length} / 3 ชุด
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                การลบผู้เข้าร่วมประเมินรายนี้จะลบข้อมูลแบบประเมินและคะแนนทั้งหมดที่ผู้ใช้เคยส่งออกจากระบบด้วย
              </p>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      ยืนยันการลบ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create New Batch Modal */}
        {showNewBatchModal && config && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-blue-600 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    สร้างรุ่นใหม่
                  </h3>
                  <p className="text-xs text-gray-500">เริ่มต้นปีการศึกษาใหม่</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">รุ่นปัจจุบัน:</span>
                  <span className="font-bold text-gray-800">รุ่นที่ {config.currentBatch}</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-400">→</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">รุ่นใหม่:</span>
                  <span className="font-bold text-blue-700 text-lg">รุ่นที่ {config.currentBatch + 1}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-600 mt-0.5">✅</span>
                  <span>นักเรียนทุกคนจะสามารถทำแบบประเมินรุ่นใหม่ได้</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-600 mt-0.5">✅</span>
                  <span>ข้อมูลรุ่นเก่ายังคงเก็บไว้ดูย้อนหลังได้</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-600 mt-0.5">✅</span>
                  <span>ตั้งค่าแบบประเมิน (คำถาม, อาจารย์, แผนก) จะคงเดิม สามารถแก้ไขได้ภายหลัง</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 mt-0.5">🔄</span>
                  <span>กำหนดเวลาเปิด-ปิดจะถูก reset (ต้องตั้งค่าใหม่)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isCreatingBatch}
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isCreatingBatch}
                  onClick={handleCreateNewBatch}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {isCreatingBatch ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      สร้างรุ่นที่ {config.currentBatch + 1}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Credits */}
        <Footer className="mt-12 pb-8 border-t border-slate-200/60" />
      </main>
    </div>
  );
}
