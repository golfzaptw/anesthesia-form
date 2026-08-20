"use client";

import { useState } from "react";
import type { FormConfig } from "@/lib/formData";
import { saveFormConfig } from "@/lib/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export function FormEditor({
  initialConfig,
  onSave,
}: {
  initialConfig: FormConfig;
  onSave: (newConfig: FormConfig) => void;
}) {
  const [config, setConfig] = useState<FormConfig>(() => {
    const c = JSON.parse(JSON.stringify(initialConfig));
    // Add _id for React keys
    c.form3Departments.forEach((d: any) => {
      d._id = Math.random().toString(36).slice(2);
    });
    return c;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const configToSave = { ...config };
      configToSave.form3Departments = configToSave.form3Departments.map((d: any) => {
        const { _id, ...rest } = d;
        return rest;
      });
      await saveFormConfig(configToSave);
      onSave(configToSave);
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

  const handleUpdateDeptName = (id: string, name: string) => {
    const newDepts = config.form3Departments.map((d: any) => 
      d._id === id ? { ...d, dept: name } : d
    );
    setConfig({ ...config, form3Departments: newDepts });
  };

  const handleUpdateDeptStaff = (id: string, staffText: string) => {
    const staffArr = staffText.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const newDepts = config.form3Departments.map((d: any) => 
      d._id === id ? { ...d, staff: staffArr } : d
    );
    setConfig({ ...config, form3Departments: newDepts });
  };

  const handleAddDept = () => {
    setConfig({
      ...config,
      form3Departments: [
        ...config.form3Departments,
        { _id: Math.random().toString(36).slice(2), dept: "", staff: [] } as any
      ]
    });
  };

  const handleRemoveDept = (id: string) => {
    if (!confirm("ต้องการลบแผนกนี้ใช่หรือไม่?")) return;
    setConfig({
      ...config,
      form3Departments: config.form3Departments.filter((d: any) => d._id !== id)
    });
  };

  const handleMoveDept = (index: number, direction: "up" | "down") => {
    const newDepts = [...config.form3Departments];
    if (direction === "up" && index > 0) {
      const temp = newDepts[index];
      newDepts[index] = newDepts[index - 1];
      newDepts[index - 1] = temp;
      setConfig({ ...config, form3Departments: newDepts });
    } else if (direction === "down" && index < newDepts.length - 1) {
      const temp = newDepts[index];
      newDepts[index] = newDepts[index + 1];
      newDepts[index + 1] = temp;
      setConfig({ ...config, form3Departments: newDepts });
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-800">ชุด 1: คำถามการเรียนการสอน (1 บรรทัดต่อ 1 ข้อ)</h3>
            <Link href="/admin/preview/1" target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Eye className="w-3 h-3" /> ดูตัวอย่าง
            </Link>
          </div>
          <textarea
            className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={config.form1Questions.join("\n")}
            onChange={(e) => handleArrayChange("form1Questions", e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-6 md:col-span-2">
          {/* Form 2 Header with Preview Link */}
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-medium text-sm text-gray-800">ชุด 2: ประเมินอาจารย์แพทย์</h3>
            <Link href="/admin/preview/2" target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Eye className="w-3 h-3" /> ดูตัวอย่าง
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-xs text-gray-700">รายชื่ออาจารย์ (1 บรรทัดต่อ 1 ชื่อ)</h4>
              <textarea
                className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue={config.form2Instructors.join("\n")}
                onChange={(e) => handleArrayChange("form2Instructors", e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-xs text-gray-700">หัวข้อการประเมิน (1 บรรทัดต่อ 1 ข้อ)</h4>
              <textarea
                className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue={config.form2Questions.join("\n")}
                onChange={(e) => handleArrayChange("form2Questions", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-800">ชุด 3: รายชื่อแผนกและพยาบาลวิสัญญี</h3>
            <Link href="/admin/preview/3" target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Eye className="w-3 h-3" /> ดูตัวอย่าง
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {config.form3Departments.map((dept: any, index: number) => (
              <div key={dept._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3 relative group">
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveDept(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                    title="เลื่อนขึ้น"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDept(index, "down")}
                    disabled={index === config.form3Departments.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                    title="เลื่อนลง"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => handleRemoveDept(dept._id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="ลบแผนกนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <span className="bg-blue-100 text-blue-700 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold">
                      {index + 1}
                    </span>
                    ชื่อแผนก/ห้อง
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    defaultValue={dept.dept}
                    placeholder="เช่น วิสัญญีแผนกรอพื้นและช่วยชีวิต"
                    onChange={(e) => handleUpdateDeptName(dept._id, e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">รายชื่อพยาบาล (1 บรรทัดต่อ 1 ชื่อ)</label>
                  <textarea
                    className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    defaultValue={dept.staff.join("\n")}
                    placeholder="ร.ท.หญิง กรภัธร...&#10;ร.ต.หญิง พรประภา..."
                    onChange={(e) => handleUpdateDeptStaff(dept._id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleAddDept}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> เพิ่มแผนกใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
