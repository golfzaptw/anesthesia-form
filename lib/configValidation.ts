import type { FormConfig } from "./formData";

export interface ConfigValidationError {
  field: string;
  message: string;
  isBlocking: boolean; // true = cannot save, false = warning only
}

export function validateFormConfig(config: FormConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Form 1 Validation
  if (!config.form1Questions || config.form1Questions.length === 0) {
    errors.push({ field: "form1Questions", message: "ต้องมีคำถามอย่างน้อย 1 ข้อ", isBlocking: true });
  }

  // Form 2 Validation
  if (!config.form2Instructors || config.form2Instructors.length === 0) {
    errors.push({ field: "form2Instructors", message: "ต้องมีรายชื่ออาจารย์อย่างน้อย 1 ท่าน", isBlocking: true });
  }
  
  if (!config.form2Questions || config.form2Questions.length === 0) {
    errors.push({ field: "form2Questions", message: "ต้องมีหัวข้อประเมินอย่างน้อย 1 ข้อ", isBlocking: true });
  }

  const instructorsLower = (config.form2Instructors || []).map(i => i.trim().toLowerCase());
  const duplicateInstructors = instructorsLower.filter((item, index) => instructorsLower.indexOf(item) !== index);
  if (duplicateInstructors.length > 0) {
    errors.push({ field: "form2Instructors", message: "มีรายชื่ออาจารย์ซ้ำกัน", isBlocking: true });
  }

  // Form 3 Validation
  if (!config.form3Departments || config.form3Departments.length === 0) {
    errors.push({ field: "form3Departments", message: "ต้องมีแผนกอย่างน้อย 1 แผนก", isBlocking: true });
  } else {
    const deptsLower = config.form3Departments.map(d => (d.dept || "").trim().toLowerCase());
    const duplicateDepts = deptsLower.filter((item, index) => deptsLower.indexOf(item) !== index);
    if (duplicateDepts.length > 0) {
      errors.push({ field: "form3Departments", message: "มีชื่อแผนกซ้ำกัน", isBlocking: true });
    }

    config.form3Departments.forEach((d, idx) => {
      if (!d.dept || d.dept.trim() === "") {
        errors.push({ field: `form3Departments[${idx}].dept`, message: `กรุณาระบุชื่อแผนกลำดับที่ ${idx + 1}`, isBlocking: true });
      }
      if (!d.staff || d.staff.length === 0) {
        errors.push({ field: `form3Departments[${idx}].staff`, message: `แผนก '${d.dept || "ไม่มีชื่อ"}' ต้องมีบุคลากรอย่างน้อย 1 คน`, isBlocking: true });
      } else {
        const staffLower = d.staff.map(s => s.trim().toLowerCase());
        const duplicateStaff = staffLower.filter((item, index) => staffLower.indexOf(item) !== index);
        if (duplicateStaff.length > 0) {
          errors.push({ field: `form3Departments[${idx}].staff`, message: `แผนก '${d.dept}' มีรายชื่อบุคลากรซ้ำกัน`, isBlocking: true });
        }
      }
    });
  }

  // Dates
  if (config.startDate && config.endDate) {
    if (new Date(config.endDate) < new Date(config.startDate)) {
      errors.push({ field: "dates", message: "วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น", isBlocking: true });
    }
  }

  return errors;
}
