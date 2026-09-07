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
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
        <h4 className="text-xs font-bold text-gray-800">ข้อเสนอแนะ:</h4>
        <div className="flex items-center gap-3 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาข้อความ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-48"
            />
          </div>
          <button
            onClick={toggleHideNames}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {hideNames ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideNames ? "ซ่อนชื่ออยู่" : "แสดงชื่อ"}
          </button>
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 px-4">ไม่พบข้อเสนอแนะที่ค้นหา</p>
      ) : (
        <div className="px-4 pb-4">
          <ul className="list-disc pl-4 space-y-1.5 mt-2">
            {filteredComments.map((c, i) => (
              <li key={i} className="text-xs text-gray-700 whitespace-pre-wrap">
                {c.text}
                {!hideNames && (
                  <span className="text-[11px] text-gray-400 ml-2 print:hidden">
                    — {c.evaluatorName}
                  </span>
                )}
                {c.givenScore !== undefined && (
                  <span className="text-[10px] text-gray-400 ml-2 print:hidden">
                    (คะแนน: {c.givenScore.toFixed(2).replace(/\.00$/, '')})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
