"use client";

import { useState, useEffect, useRef } from "react";
import type { FormConfig } from "@/lib/formData";
import { isDeptAllowSkip } from "@/lib/formData";
import { saveFormConfig, getAuditLogs } from "@/lib/firestore";
import { validateFormConfig, type ConfigValidationError } from "@/lib/configValidation";
import type { AdminAuditLog } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, Download, Upload } from "lucide-react";

type DeptWithId = { dept: string; staff: string[]; _id: string; allowSkip?: boolean };
type ConfigWithIds = Omit<FormConfig, "form3Departments"> & { form3Departments: DeptWithId[] };

export function FormEditor({
  initialConfig,
  submissionCount = 0,
  onSave,
}: {
  initialConfig: FormConfig;
  submissionCount?: number;
  onSave: (newConfig: FormConfig) => void;
}) {
  const [initialState, setInitialState] = useState<ConfigWithIds>(() => {
    const c = JSON.parse(JSON.stringify(initialConfig));
    c.form3Departments.forEach((d: DeptWithId) => {
      d._id = Math.random().toString(36).slice(2);
      if (d.allowSkip === undefined) d.allowSkip = isDeptAllowSkip(d);
    });
    return c;
  });

  const [config, setConfig] = useState<ConfigWithIds>(() => JSON.parse(JSON.stringify(initialState)));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ConfigValidationError[]>([]);
  const [overrideRisk, setOverrideRisk] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [diffMessages, setDiffMessages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dirty state check
  const isDirty = JSON.stringify(config) !== JSON.stringify(initialState);
  const hasBlockingErrors = errors.some(e => e.isBlocking);
  const hasSubmissions = submissionCount > 0;

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  useEffect(() => {
    getAuditLogs(50).then(setAuditLogs).catch(console.error);
  }, []);

  // Validation effect
  useEffect(() => {
    // build configToValidate without _id
    const configToValidate: FormConfig = {
      ...config,
      form3Departments: config.form3Departments.map(d => ({
        dept: d.dept,
        staff: d.staff,
        allowSkip: d.allowSkip
      }))
    };
    setErrors(validateFormConfig(configToValidate));
  }, [config]);

  // beforeunload effect
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const getDiffMessages = (newConfig: ConfigWithIds, oldConfig: ConfigWithIds) => {
    const msgs: string[] = [];
    if (newConfig.form1Questions.length < oldConfig.form1Questions.length) {
      msgs.push(`ฟอร์ม 1: จำนวนคำถามลดลง (จาก ${oldConfig.form1Questions.length} เหลือ ${newConfig.form1Questions.length})`);
    } else if (JSON.stringify(newConfig.form1Questions) !== JSON.stringify(oldConfig.form1Questions)) {
      msgs.push("ฟอร์ม 1: มีการสลับลำดับหรือแก้ไขคำถาม");
    }

    if (newConfig.form2Instructors.length < oldConfig.form2Instructors.length) {
      msgs.push(`ฟอร์ม 2 (อาจารย์): จำนวนลดลง (จาก ${oldConfig.form2Instructors.length} เหลือ ${newConfig.form2Instructors.length})`);
    } else if (JSON.stringify(newConfig.form2Instructors) !== JSON.stringify(oldConfig.form2Instructors)) {
      msgs.push("ฟอร์ม 2: มีการสลับลำดับหรือแก้ไขรายชื่ออาจารย์");
    }

    if (newConfig.form2Questions.length < oldConfig.form2Questions.length) {
      msgs.push(`ฟอร์ม 2 (คำถาม): จำนวนลดลง`);
    }

    if (newConfig.form3Departments.length < oldConfig.form3Departments.length) {
      msgs.push(`ฟอร์ม 3 (แผนก): จำนวนแผนกลดลง`);
    } else {
      const oldDepts = oldConfig.form3Departments.map(d => d.dept);
      const newDepts = newConfig.form3Departments.map(d => d.dept);
      if (JSON.stringify(oldDepts) !== JSON.stringify(newDepts)) {
        msgs.push("ฟอร์ม 3 (แผนก): มีการสลับลำดับหรือแก้ไขชื่อแผนก");
      }
    }
    return msgs;
  };

  const attemptSave = () => {
    if (hasBlockingErrors) {
      toast.error("กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก");
      return;
    }
    
    if (hasSubmissions) {
      const diffs = getDiffMessages(config, initialState);
      if (diffs.length > 0) {
        setDiffMessages(diffs);
        setShowConfirmModal(true);
        return;
      }
    }
    
    executeSave();
  };

  const executeSave = async () => {
    setSaving(true);
    setShowConfirmModal(false);
    try {
      const configToSave: FormConfig = {
        form1Questions: config.form1Questions || [],
        form2Instructors: config.form2Instructors || [],
        form2Questions: config.form2Questions || [],
        form3Departments: config.form3Departments.map((d) => ({
          dept: d.dept || "",
          staff: d.staff || [],
          allowSkip: d.allowSkip !== undefined ? d.allowSkip : isDeptAllowSkip(d),
        })),
        isForceClosed: Boolean(config.isForceClosed),
        startDate: config.startDate || "",
        endDate: config.endDate || "",
        formStates: config.formStates || {
          form_1: { closed: false, startDate: "", endDate: "" },
          form_2: { closed: false, startDate: "", endDate: "" },
          form_3: { closed: false, startDate: "", endDate: "" },
        },
        currentBatch: config.currentBatch,
        batches: config.batches || [],
      };
      await saveFormConfig(configToSave);
      onSave(configToSave);
      setInitialState(JSON.parse(JSON.stringify(config)));
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    } catch (err) {
      console.error("Save config error:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleArrayChange = (
    key: keyof Pick<FormConfig, "form1Questions" | "form2Instructors" | "form2Questions">,
    value: string
  ) => {
    const arr = value.split("\n").map(s => s.trim()).filter((s) => s.length > 0);
    setConfig({ ...config, [key]: arr });
  };

  const handleUpdateDeptName = (id: string, name: string) => {
    const newDepts = config.form3Departments.map((d) => 
      d._id === id ? { ...d, dept: name } : d
    );
    setConfig({ ...config, form3Departments: newDepts });
  };

  const handleUpdateDeptStaff = (id: string, staffText: string) => {
    const staffArr = staffText.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const newDepts = config.form3Departments.map((d) => 
      d._id === id ? { ...d, staff: staffArr } : d
    );
    setConfig({ ...config, form3Departments: newDepts });
  };

  const handleUpdateDeptAllowSkip = (id: string, allowSkip: boolean) => {
    const newDepts = config.form3Departments.map((d) =>
      d._id === id ? { ...d, allowSkip } : d
    );
    setConfig({ ...config, form3Departments: newDepts });
  };

  const handleAddDept = () => {
    setConfig({
      ...config,
      form3Departments: [
        ...config.form3Departments,
        { _id: Math.random().toString(36).slice(2), dept: "", staff: [], allowSkip: false },
      ]
    });
  };

  const handleRemoveDept = (id: string) => {
    if (!confirm("ต้องการลบแผนกนี้ใช่หรือไม่?")) return;
    setConfig({
      ...config,
      form3Departments: config.form3Departments.filter((d) => d._id !== id)
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

  const handleExportJSON = () => {
    const configToExport = {
      ...config,
      form3Departments: config.form3Departments.map(d => ({
        dept: d.dept,
        staff: d.staff,
        allowSkip: d.allowSkip
      }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configToExport, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `config_batch_${config.currentBatch}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as FormConfig;
        const validation = validateFormConfig(parsed);
        if (validation.some(v => v.isBlocking)) {
          toast.error("ไฟล์ JSON ไม่ถูกต้องตามรูปแบบที่ต้องการ");
          console.error(validation);
          return;
        }
        
        const withIds: ConfigWithIds = {
          ...parsed,
          currentBatch: config.currentBatch, // preserve current batch
          batches: config.batches,
          form3Departments: (parsed.form3Departments || []).map(d => ({
            ...d,
            _id: Math.random().toString(36).slice(2)
          }))
        };
        setConfig(withIds);
        toast.success("ดึงข้อมูลจากไฟล์สำเร็จ (ยังไม่ถูกบันทึกลงระบบ)");
      } catch {
        toast.error("ไม่สามารถอ่านไฟล์ JSON ได้");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFieldError = (field: string) => errors.find(e => e.field === field);

  return (
    <div className="space-y-6">
      {hasSubmissions && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 text-sm">รุ่นนี้มีผู้ส่งคำตอบแล้ว ({submissionCount} คน)</h3>
            <p className="text-red-700 text-xs mt-1 leading-relaxed">
              การลบคำถาม การลบชื่ออาจารย์/แผนก หรือการสลับลำดับ อาจทำให้ข้อมูลเดิมที่บันทึกไว้แสดงผลผิดพลาดในรายงาน 
              ควรหลีกเลี่ยงการเปลี่ยนแปลงโครงสร้างแบบประเมิน หากจำเป็น กรุณาตรวจสอบให้แน่ใจ
            </p>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-red-600 focus:ring-red-500" 
                  checked={overrideRisk}
                  onChange={(e) => setOverrideRisk(e.target.checked)}
                />
                <span className="text-xs font-semibold text-red-800">ฉันเข้าใจความเสี่ยงและต้องการปลดล็อกปุ่มลบ/สลับลำดับ</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">จัดการข้อมูลแบบประเมิน</h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              รุ่นที่ {config.currentBatch ?? 42}
            </span>
            {isDirty && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            แก้ไขข้อมูลแล้วกดบันทึก ข้อมูลใหม่จะแสดงในแบบประเมินทันที
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportJSON} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 border border-gray-200 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> นำเข้า
          </button>
          <button
            onClick={handleExportJSON}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 border border-gray-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
          </button>
          <button
            onClick={attemptSave}
            disabled={saving || hasBlockingErrors || (!isDirty && !hasBlockingErrors)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
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
            className={`w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 outline-none ${
              getFieldError("form1Questions") ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
            }`}
            value={config.form1Questions.join("\n")}
            onChange={(e) => handleArrayChange("form1Questions", e.target.value)}
          />
          {getFieldError("form1Questions") && <p className="text-red-500 text-xs">{getFieldError("form1Questions")?.message}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-6 md:col-span-2">
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
                className={`w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 outline-none ${
                  getFieldError("form2Instructors") ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                }`}
                value={config.form2Instructors.join("\n")}
                onChange={(e) => handleArrayChange("form2Instructors", e.target.value)}
              />
              {getFieldError("form2Instructors") && <p className="text-red-500 text-xs">{getFieldError("form2Instructors")?.message}</p>}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-xs text-gray-700">หัวข้อการประเมิน (1 บรรทัดต่อ 1 ข้อ)</h4>
              <textarea
                className={`w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 outline-none ${
                  getFieldError("form2Questions") ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                }`}
                value={config.form2Questions.join("\n")}
                onChange={(e) => handleArrayChange("form2Questions", e.target.value)}
              />
              {getFieldError("form2Questions") && <p className="text-red-500 text-xs">{getFieldError("form2Questions")?.message}</p>}
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
          {getFieldError("form3Departments") && <p className="text-red-500 text-xs mb-2 font-medium">{getFieldError("form3Departments")?.message}</p>}
          
          <div className="grid md:grid-cols-2 gap-4">
            {config.form3Departments.map((dept, index: number) => {
              const errDept = getFieldError(`form3Departments[${index}].dept`);
              const errStaff = getFieldError(`form3Departments[${index}].staff`);
              const disableModify = hasSubmissions && !overrideRisk;
              
              return (
                <div key={dept._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3 relative group">
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveDept(index, "up")}
                      disabled={index === 0 || disableModify}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      title={disableModify ? "ถูกล็อคเนื่องจากมีผู้ส่งคำตอบแล้ว" : "เลื่อนขึ้น"}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDept(index, "down")}
                      disabled={index === config.form3Departments.length - 1 || disableModify}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      title={disableModify ? "ถูกล็อคเนื่องจากมีผู้ส่งคำตอบแล้ว" : "เลื่อนลง"}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button
                      onClick={() => handleRemoveDept(dept._id)}
                      disabled={disableModify}
                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
                      title={disableModify ? "ถูกล็อคเนื่องจากมีผู้ส่งคำตอบแล้ว" : "ลบแผนกนี้"}
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
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white ${
                        errDept ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                      }`}
                      value={dept.dept}
                      placeholder="เช่น วิสัญญีแผนกรอพื้นและช่วยชีวิต"
                      onChange={(e) => handleUpdateDeptName(dept._id, e.target.value)}
                    />
                    {errDept && <p className="text-red-500 text-[10px] mt-1">{errDept.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">รายชื่อพยาบาล/เจ้าหน้าที่ (1 บรรทัดต่อ 1 ชื่อ)</label>
                    <textarea
                      className={`w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 outline-none bg-white ${
                        errStaff ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                      }`}
                      value={dept.staff.join("\n")}
                      placeholder="ร.ท.หญิง กรภัธร...&#10;ร.ต.หญิง พรประภา..."
                      onChange={(e) => handleUpdateDeptStaff(dept._id, e.target.value)}
                    />
                    {errStaff && <p className="text-red-500 text-[10px] mt-1">{errStaff.message}</p>}
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={dept.allowSkip !== undefined ? dept.allowSkip : isDeptAllowSkip(dept)}
                        onChange={(e) => handleUpdateDeptAllowSkip(dept._id, e.target.checked)}
                      />
                      <span>เปิดให้เลือก เคย/ไม่เคยเจอ (สำหรับตำแหน่งที่อาจไม่ได้พบทุกคน เช่น นายสิบ/ผู้ช่วยฯ)</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button
            onClick={handleAddDept}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> เพิ่มแผนกใหม่
          </button>
        </div>
      </div>

      {/* Batches Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-6">
        <h3 className="font-medium text-sm text-gray-800 mb-3 border-b pb-2">จัดการข้อมูลรุ่น (Batches)</h3>
        <div className="space-y-3">
          {config.batches && config.batches.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 w-16">รุ่นที่ {b.id}</span>
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={b.label}
                onChange={(e) => {
                  const newBatches = config.batches.map(tb => tb.id === b.id ? { ...tb, label: e.target.value } : tb);
                  setConfig({ ...config, batches: newBatches });
                }}
              />
              {b.id === config.currentBatch && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">รุ่นปัจจุบัน</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mt-6">
        <h3 className="font-medium text-sm text-gray-800 mb-3">ประวัติการเปลี่ยนแปลง (Audit Log)</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-64 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">ยังไม่มีประวัติการเปลี่ยนแปลง</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold text-gray-600">เวลา</th>
                  <th className="px-3 py-2 font-semibold text-gray-600">ผู้ทำรายการ</th>
                  <th className="px-3 py-2 font-semibold text-gray-600">เป้าหมาย</th>
                  <th className="px-3 py-2 font-semibold text-gray-600">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(log.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{log.actorEmail}</td>
                    <td className="px-3 py-2 text-gray-700">{log.targetLabel}</td>
                    <td className="px-3 py-2 text-gray-500">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-red-50">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-red-800 text-lg">ยืนยันการเปลี่ยนแปลงโครงสร้าง</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                คุณกำลังแก้ไข <strong>โครงสร้าง</strong> ของแบบประเมินในรุ่นที่มีการส่งคำตอบแล้ว ซึ่งอาจทำให้คำตอบที่เคยบันทึกไว้คลาดเคลื่อนหรืออ้างอิงผิดข้อ
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                <ul className="list-disc pl-5 space-y-1">
                  {diffMessages.map((msg, i) => (
                    <li key={i} className="text-red-600 font-medium">{msg}</li>
                  ))}
                </ul>
              </div>
              
              <p className="text-xs text-gray-500">
                คำแนะนำ: หากเป็นการเปลี่ยนแปลงเล็กน้อยเช่น การแก้คำผิด จะไม่มีผลกระทบ แต่ถ้ามีการ ลบ หรือ เปลี่ยนลำดับ ข้อมูลเดิมจะอ้างอิงลำดับผิดทันที
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ยกเลิกและกลับไปแก้ไข
              </button>
              <button
                onClick={executeSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "ยืนยันและบันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
