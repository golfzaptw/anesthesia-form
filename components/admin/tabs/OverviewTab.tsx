import { useMemo, useState } from "react";
import { Download, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, Copy, FileSpreadsheet } from "lucide-react";
import { getFormsMeta } from "@/lib/formData";
import { HighlightsWidget } from "@/components/admin/HighlightsWidget";
import type { AdminTabProps } from "./types";

export function OverviewTab({
  activeBatch,
  isViewingCurrentBatch,
  batchUsers,
  byForm,
  form1,
  form2,
  onExport,
  onExportSummary,
  onSetUserToDelete,
}: AdminTabProps) {
  const formsMeta = useMemo(() => getFormsMeta(activeBatch), [activeBatch]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<"all"|"complete"|"incomplete"|"missing"|"edited">("all");
  const [sortKey, setSortKey] = useState<"index"|"name"|"submitCount"|"lastSubmittedAt">("index");
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("asc");

  const processedUsers = useMemo(() => {
    // 1. Calculate properties for each user
    const usersWithStats = batchUsers.map((u, index) => {
      const submissions = formsMeta.map(f => byForm[f.id].find(s => s.userId === u.uid || (u.email && s.userEmail === u.email)));
      const submitCount = submissions.filter(Boolean).length;
      const hasEdited = submissions.some(s => s && (s.editCount ?? 0) >= 1);
      const lastSubmittedAt = Math.max(0, ...submissions.map(s => s?.submittedAt ? new Date(s.submittedAt).getTime() : 0));
      return {
        ...u,
        originalIndex: index + 1,
        submissions,
        submitCount,
        hasEdited,
        lastSubmittedAt,
      };
    });

    // 2. Filter
    let filtered = usersWithStats;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        (u.displayName || "").toLowerCase().includes(term) || 
        (u.email || "").toLowerCase().includes(term)
      );
    }

    if (filterState === "complete") {
      filtered = filtered.filter(u => u.submitCount === formsMeta.length);
    } else if (filterState === "incomplete") {
      filtered = filtered.filter(u => u.submitCount > 0 && u.submitCount < formsMeta.length);
    } else if (filterState === "missing") {
      filtered = filtered.filter(u => u.submitCount === 0);
    } else if (filterState === "edited") {
      filtered = filtered.filter(u => u.hasEdited);
    }

    // 3. Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "index") cmp = a.originalIndex - b.originalIndex;
      else if (sortKey === "name") cmp = (a.displayName || "").localeCompare(b.displayName || "");
      else if (sortKey === "submitCount") cmp = a.submitCount - b.submitCount;
      else if (sortKey === "lastSubmittedAt") cmp = a.lastSubmittedAt - b.lastSubmittedAt;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [batchUsers, formsMeta, byForm, searchTerm, filterState, sortKey, sortOrder]);

  const incompleteUsers = useMemo(() => {
    return batchUsers.filter(u => {
      const count = formsMeta.map(f => byForm[f.id].find(s => s.userId === u.uid || (u.email && s.userEmail === u.email))).filter(Boolean).length;
      return count < formsMeta.length;
    });
  }, [batchUsers, formsMeta, byForm]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const copyNames = () => {
    const names = incompleteUsers.map(u => u.displayName || u.email).filter(Boolean).join(", ");
    if (names) {
      navigator.clipboard.writeText(names);
      alert("คัดลอกรายชื่อเรียบร้อยแล้ว");
    } else {
      alert("ไม่พบรายชื่อของคนที่ยังส่งไม่ครบ");
    }
  };

  const exportMissingCsv = () => {
    if (incompleteUsers.length === 0) {
      alert("ทุกคนส่งครบหมดแล้ว");
      return;
    }
    const header = "ลำดับ,ชื่อ-สกุล,ฟอร์มที่ขาด\n";
    const rows = incompleteUsers.map((u, i) => {
      const missingForms = formsMeta.filter(f => {
        return !byForm[f.id].find(s => s.userId === u.uid || (u.email && s.userEmail === u.email));
      }).map(f => f.title).join(" / ");
      
      const safeName = `"${(u.displayName || "").replace(/"/g, '""')}"`;
      return `${i + 1},${safeName},"${missingForms}"`;
    });
    
    const blob = new Blob(["\uFEFF" + header + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `missing_users_batch_${activeBatch}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {formsMeta.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 print:hidden">
            <p className="text-xs text-gray-500 leading-snug">{f.title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {byForm[f.id].length}
            </p>
            <button
              onClick={() => onExport(f.id)}
              disabled={!byForm[f.id].length}
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
            >
              <Download className="w-3 h-3" />
              ดาวน์โหลด CSV
            </button>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-gray-200 p-4 bg-blue-50/30 print:hidden">
          <p className="text-xs text-gray-500 leading-snug">ภาพรวมทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {batchUsers.length} <span className="text-sm font-normal text-gray-500">คน</span>
          </p>
          <button
            onClick={onExportSummary}
            disabled={batchUsers.length === 0}
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
          >
            <Download className="w-3 h-3" />
            ดาวน์โหลดรายงานสรุป
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Insights Panel */}
        <HighlightsWidget form1Scores={form1.scores} form2Stats={form2} />

        {/* User Table (moved inside grid to share space on desktop) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-sm text-gray-800">
              สถานะรายบุคคล ({processedUsers.length}/{batchUsers.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อ, อีเมล..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select 
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value as "all"|"complete"|"incomplete"|"missing"|"edited")}
                  className="pl-8 pr-6 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="complete">ส่งครบแล้ว</option>
                  <option value="incomplete">ส่งบางส่วน</option>
                  <option value="missing">ยังไม่ส่งเลย</option>
                  <option value="edited">มีการแก้ไขคำตอบ</option>
                </select>
              </div>
            </div>
          </div>
          
          {incompleteUsers.length > 0 && (
            <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                มีผู้ที่ยังส่งไม่ครบ {incompleteUsers.length} คน
              </div>
              <div className="flex gap-2 print:hidden">
                <button 
                  onClick={copyNames}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
                >
                  <Copy className="w-3 h-3" /> คัดลอกรายชื่อ
                </button>
                <button 
                  onClick={exportMissingCsv}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3" /> ส่งออก CSV
                </button>
              </div>
            </div>
          )}

        {batchUsers.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">
            ยังไม่มีผู้ลงทะเบียนในรุ่นนี้
          </p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th 
                    className="text-left font-medium px-4 py-2 w-12 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("index")}
                  >
                    <div className="flex items-center gap-1">ลำดับ {sortKey === "index" && <ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
                  </th>
                  <th 
                    className="text-left font-medium px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">ชื่อผู้ประเมิน {sortKey === "name" && <ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
                  </th>
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
                {processedUsers.map((u) => (
                  <tr key={u.uid} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-500 text-sm">
                      {u.originalIndex}
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
                    {formsMeta.map((f, idx) => {
                      const submission = u.submissions[idx];
                      return (
                        <td key={f.id} className="text-center px-2 py-2 group">
                          {submission ? (
                            <div className="inline-flex flex-col items-center justify-center relative cursor-help">
                              <span className="text-green-600 font-bold">✓</span>
                              {(submission.editCount ?? 0) >= 1 && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded px-1 mt-0.5"
                                >
                                  แก้ไข
                                </span>
                              )}
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg">
                                ส่งเมื่อ: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString("th-TH") : "—"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    {isViewingCurrentBatch && onSetUserToDelete && (
                      <td className="text-center px-2 py-2">
                        <button
                          onClick={() => onSetUserToDelete(u)}
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
    </div>
  );
}
