"use client";

import { useState } from "react";
import { Lock, Clock } from "lucide-react";
import type { FormConfig } from "@/lib/formData";
import type { FormId } from "@/types";

interface TimeSettingsProps {
  initialConfig: FormConfig;
  onSave: (config: FormConfig) => void;
  onCancel: () => void;
}

export function TimeSettings({ initialConfig, onSave, onCancel }: TimeSettingsProps) {
  const [config, setConfig] = useState<FormConfig>(initialConfig);

  const validateDates = (start: string, end: string) => {
    if (!start && end) return "กรุณาระบุวัน-เวลา เริ่มต้น";
    if (start && !end) return "กรุณาระบุวัน-เวลา สิ้นสุด";
    if (start && end) {
      if (new Date(start) >= new Date(end)) return "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น";
    }
    return null;
  };

  const dateError = validateDates(config.startDate || "", config.endDate || "");

  const handleSave = () => {
    if (dateError) return;
    onSave(config);
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4 shadow-sm shadow-blue-50/50 mt-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
          <Lock className="w-4 h-4 text-blue-600" />
          <h3>การเปิด-ปิด และกำหนดเวลาแบบประเมิน</h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
          config.isForceClosed
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {config.isForceClosed ? "● ปิดระบบอยู่ (Force Closed)" : "● เปิดรับคำตอบปกติ"}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            บังคับปิดระบบ (Force Close)
          </label>
          <label className="inline-flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!config.isForceClosed}
              onChange={(e) => setConfig({ ...config, isForceClosed: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            <span className={`ml-3 text-xs font-bold ${config.isForceClosed ? "text-red-600" : "text-gray-600"}`}>
              {config.isForceClosed ? "บังคับปิด (นักเรียนเข้าไม่ได้)" : "เปิดให้เข้าทำ"}
            </span>
          </label>
        </div>

        <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            วัน-เวลา เริ่มต้น <span className="text-gray-400 font-normal">(GMT+07:00)</span>
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={config.startDate || ""}
            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
          />
        </div>

        <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            วัน-เวลา สิ้นสุด <span className="text-gray-400 font-normal">(GMT+07:00)</span>
          </label>
          <input
            type="datetime-local"
            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 bg-white ${
              dateError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
            }`}
            value={config.endDate || ""}
            onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
          />
          {dateError && <p className="text-red-500 text-[10px] mt-1">{dateError}</p>}
        </div>
      </div>

      {/* Per-form control */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          ตั้งค่าการเปิด-ปิดแยกรายฟอร์ม (Override Global)
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          {(["form_1", "form_2", "form_3"] as FormId[]).map((fId, idx) => {
            const state = config.formStates?.[fId] || { closed: false, startDate: "", endDate: "" };
            const updateState = (updates: Partial<typeof state>) => {
              const updatedStates = {
                ...(config.formStates || {}),
                [fId]: { ...state, ...updates }
              } as Record<FormId, { closed?: boolean; startDate?: string; endDate?: string }>;
              setConfig({
                ...config,
                formStates: updatedStates
              });
            };
            
            return (
              <div key={fId} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-xs">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-800">ฟอร์มที่ {idx + 1}</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!state.closed}
                      onChange={(e) => updateState({ closed: e.target.checked })}
                    />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
                    <span className="ml-1.5 text-[10px] font-bold text-gray-500 peer-checked:text-red-600">{state.closed ? "ปิดรับ" : "เปิด"}</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">เวลาเริ่ม</span>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={state.startDate || ""}
                      onChange={(e) => updateState({ startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">เวลาสิ้นสุด</span>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={state.endDate || ""}
                      onChange={(e) => updateState({ endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={!!dateError}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          บันทึกการตั้งค่าเวลา
        </button>
      </div>
    </div>
  );
}
