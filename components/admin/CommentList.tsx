"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Eye, EyeOff } from "lucide-react";
import type { CommentEntry } from "@/lib/analytics";

interface CommentListProps {
  comments: CommentEntry[];
}

export function CommentList({ comments }: CommentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hideNames, setHideNames] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("hideEvaluatorNames");
    if (stored === "true") setHideNames(true);
  }, []);

  const toggleHideNames = () => {
    const newValue = !hideNames;
    setHideNames(newValue);
    localStorage.setItem("hideEvaluatorNames", String(newValue));
  };

  const filteredComments = useMemo(() => {
    if (!searchQuery) return comments;
    const q = searchQuery.toLowerCase();
    return comments.filter(c => 
      c.text.toLowerCase().includes(q) || 
      c.label.toLowerCase().includes(q) || 
      (!hideNames && c.evaluatorName.toLowerCase().includes(q))
    );
  }, [comments, searchQuery, hideNames]);

  if (comments.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีข้อเสนอแนะ</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="ค้นหาข้อความ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
          />
        </div>
        <button
          onClick={toggleHideNames}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {hideNames ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {hideNames ? "ซ่อนชื่อผู้ประเมินอยู่" : "แสดงชื่อผู้ประเมิน"}
        </button>
      </div>

      {filteredComments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">ไม่พบข้อเสนอแนะที่ค้นหา</p>
      ) : (
        <ul className="divide-y divide-gray-100 px-4">
          {filteredComments.map((c, i) => (
            <li key={i} className="py-3">
              <div className="flex justify-between items-start gap-4">
                <p className="text-xs text-gray-400">{c.label}</p>
                {c.givenScore !== undefined && (
                  <span className="shrink-0 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    ให้คะแนน: {c.givenScore.toFixed(2).replace(/\.00$/, '')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.text}</p>
              {!hideNames && (
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">— {c.evaluatorName}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
