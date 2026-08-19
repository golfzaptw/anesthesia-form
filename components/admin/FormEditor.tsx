"use client";

import { useState } from "react";
import type { FormConfig } from "@/lib/formData";
import { saveFormConfig } from "@/lib/firestore";
import toast from "react-hot-toast";

export function FormEditor({
  initialConfig,
  onSave,
}: {
  initialConfig: FormConfig;
  onSave: (newConfig: FormConfig) => void;
}) {
  const [config, setConfig] = useState<FormConfig>(JSON.parse(JSON.stringify(initialConfig)));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFormConfig(config);
      onSave(config);
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleArrayChange = (
    key: keyof Pick<FormConfig, "form1Questions" | "form2Instructors" | "form2Questions">,
    value: string
  ) => {
    const arr = value.split("\n").filter((s) => s.trim().length > 0);
    setConfig({ ...config, [key]: arr });
  };

  const handleDepartmentChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setConfig({ ...config, form3Departments: parsed });
      }
    } catch {
      // Ignore invalid JSON while typing
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <h2 className="font-semibold text-gray-800">จัดการข้อมูลแบบประเมิน</h2>
          <p className="text-xs text-gray-500 mt-1">
            แก้ไขข้อมูลแล้วกดบันทึก ข้อมูลใหม่จะแสดงในแบบประเมินทันที
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h3 className="font-medium text-sm text-gray-800 border-b pb-2">การเปิด-ปิด แบบประเมิน</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">บังคับปิดฟอร์ม (Force Close)</label>
            <label className="inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!config.isForceClosed}
                onChange={(e) => setConfig({ ...config, isForceClosed: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {config.isForceClosed ? "ปิดฟอร์มอยู่" : "เปิดปกติ"}
              </span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">วัน-เวลา เริ่มต้น</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.startDate || ""}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">วัน-เวลา สิ้นสุด</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.endDate || ""}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-800">ชุด 1: คำถามการเรียนการสอน (1 บรรทัดต่อ 1 ข้อ)</h3>
          <textarea
            className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={config.form1Questions.join("\n")}
            onChange={(e) => handleArrayChange("form1Questions", e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-800">ชุด 2: รายชื่ออาจารย์ (1 บรรทัดต่อ 1 ชื่อ)</h3>
          <textarea
            className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={config.form2Instructors.join("\n")}
            onChange={(e) => handleArrayChange("form2Instructors", e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-800">ชุด 2: คำถามอาจารย์แพทย์ (1 บรรทัดต่อ 1 ข้อ)</h3>
          <textarea
            className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={config.form2Questions.join("\n")}
            onChange={(e) => handleArrayChange("form2Questions", e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-800">ชุด 3: รายชื่อแผนกและพยาบาลวิสัญญี (JSON)</h3>
          <textarea
            className="w-full h-48 p-3 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            defaultValue={JSON.stringify(config.form3Departments, null, 2)}
            onChange={(e) => handleDepartmentChange(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            ต้องเป็นรูปแบบ JSON ที่ถูกต้อง เช่น <br/>
            <code>{`[{"dept": "ชื่อแผนก", "staff": ["ชื่อคนที่ 1"]}]`}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
