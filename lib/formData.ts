import type { BatchConfigSnapshot, BatchMeta, FormCardMeta, FormId } from "@/types";

export function checkFormAccess(config: FormConfig, formId: FormId): boolean {
  const state = config.formStates?.[formId];
  if (state?.closed) return false;
  if (state?.closed) return false;
  const now = Date.now();
  
  if (config.isForceClosed && !state?.closed && (!state || (state.closed === undefined && !state.startDate && !state.endDate))) {
    return false; // global force close applies if no override
  }
  if (state?.closed) return false;

  // Let's simplify: 
  // If state explicitly opens/closes, use that.
  let isClosed = config.isForceClosed;
  let startMs = config.startDate ? new Date(config.startDate).getTime() : 0;
  let endMs = config.endDate ? new Date(config.endDate).getTime() : 0;
  
  if (state) {
    if (state.closed !== undefined) isClosed = state.closed;
    if (state.startDate) startMs = new Date(state.startDate).getTime();
    if (state.endDate) endMs = new Date(state.endDate).getTime();
  }

  if (isClosed) return false;
  if (startMs > 0 && now < startMs) return false;
  if (endMs > 0 && now > endMs) return false;

  return true;
}

export function getFormsMeta(batch: number): FormCardMeta[] {
  return [
    {
      id: "form_1",
      title: "แบบประเมินด้านการจัดการเรียนการสอน",
      description: `ประเมินความพึงพอใจต่อหลักสูตรวิสัญญีฯ รุ่นที่ ${batch} ด้านการจัดการเรียนการสอน ครอบคลุม 10 ด้าน`,
      href: "/forms/1",
    },
    {
      id: "form_2",
      title: "แบบประเมินอาจารย์วิสัญญีแพทย์",
      description: `ประเมินความพึงพอใจต่ออาจารย์วิสัญญีแพทย์ รุ่นที่ ${batch}`,
      href: "/forms/2",
    },
    {
      id: "form_3",
      title: "แบบประเมินพยาบาลวิสัญญี",
      description: `ประเมินความพึงพอใจต่อบุคลากรระดับพยาบาลวิสัญญี รุ่นที่ ${batch} แยกตามแผนก`,
      href: "/forms/3",
    },
  ];
}

/** @deprecated Use getFormsMeta(batch) instead. Kept for backward compat. */
export const FORMS_META: FormCardMeta[] = getFormsMeta(42);

export const FORM1_QUESTIONS = [
  "กำหนดวัตถุประสงค์แต่ละบทเรียนชัดเจนดี",
  "เนื้อหาภาคทฤษฎีสอดคล้องกับการฝึกปฏิบัติ",
  "กำหนดประสบการณ์ฝึกปฏิบัติได้เหมาะสม",
  "จัดตารางฝึกปฏิบัติได้เหมาะสม",
  "นักเรียนผ่านประสบการณ์ฝึกปฏิบัติในทุกๆหน่วยเท่าเทียมกัน",
  "รายละเอียดของเนื้อหาในแบบฟอร์มการทำรายงานผู้ป่วยครอบคลุมชัดเจนดี",
  "จัดทำเอกสารการเรียนได้เหมาะสม",
  "การจัดฝึกประสบการณ์นอกห้องผ่าตัด",
  "การจัดตารางฝึกปฏิบัติงานนอกเวลา 24 ชม.",
  "สถานที่และอุปกรณ์เอื้ออำนวยต่อการฝึกปฏิบัติงาน",
];

export const FORM2_INSTRUCTORS = [
  "พ.อ. ณรงค์ศักดิ์ เจษฎาภัทรกุล",
  "พ.อ. ธีรวัฒน์ ภูจิญญาณ์",
  "พ.อ.รศ. สิทธาพันธ์ มั่นชูพงศ์",
  "พ.อ. ณัฐธพงษ์ ภูวโชติโรจนโภคิน",
  "พ.ท.หญิง นวลวรรณ ภูวโชติโรจนโภคิน",
  "พ.ท. เอกสักถ์ จันทรปรรณิก",
  "พ.ท.หญิง วรรณวิภา พฤกษะริตานนท์",
  "พ.ท. กลวัชร ศิระพลานนท์",
  "พ.ท.หญิง สุธิรา ศิริปุญโญทัย",
  "พ.ต. ณัฐนันท์ มีแก้ว",
  "พ.ต.หญิง สิธาวีย์ จิตต์ศิริ",
  "ร.อ. สรวิศ ศิริเลิศวรกุล",
  "พ.ต. อัธยา รักสวน",
  "พ.ต. ชาติชาย เมศร์จันทร์ฉาย",
  "พ.ญ. ณิชกานต์ คมนียวนีช",
  "พ.ญ. ชญานิศ กระฎุมภร",
];

export const FORM2_EVAL_QUESTIONS = [
  "มีการระบุวัตถุประสงค์ชัดเจน",
  "สื่อการสอนเหมาะสม",
  "มีความสามารถในการอธิบายให้เข้าใจเนื้อหา",
  "มนุษยสัมพันธ์กับนักเรียนพยาบาล",
  "การตรงต่อเวลา",
  "โดยภาพรวมการสอนทั้งหมด",
];

export interface DepartmentData {
  dept: string;
  staff: string[];
  allowSkip?: boolean;
}

export function isDeptAllowSkip(dept: DepartmentData): boolean {
  if (dept.allowSkip !== undefined) {
    return Boolean(dept.allowSkip);
  }
  const name = dept.dept || "";
  return (
    name.includes("นายสิบ") ||
    name.includes("ผู้ช่วย") ||
    name.includes("พนักงานช่วย")
  );
}

export interface FormConfig {
  form1Questions: string[];
  form2Instructors: string[];
  form2Questions: string[];
  form3Departments: DepartmentData[];
  isForceClosed?: boolean;
  startDate?: string;
  endDate?: string;
  formStates?: Record<FormId, { closed?: boolean; startDate?: string; endDate?: string }>;
  currentBatch: number;
  batches: BatchMeta[];
}

/** Deep-copies the list parts of a config into a snapshot for one batch. */
export function toBatchConfigSnapshot(
  batchId: number,
  config: FormConfig
): BatchConfigSnapshot {
  return {
    batchId,
    form1Questions: [...(config.form1Questions || [])],
    form2Instructors: [...(config.form2Instructors || [])],
    form2Questions: [...(config.form2Questions || [])],
    form3Departments: (config.form3Departments || []).map((d) => ({
      dept: d.dept || "",
      staff: [...(d.staff || [])],
      allowSkip: isDeptAllowSkip(d),
    })),
    snapshotAt: new Date().toISOString(),
  };
}

/**
 * Returns a config whose lists come from `snapshot` — used so analytics can run
 * against the wording a batch actually saw while keeping batch metadata intact.
 */
export function configFromSnapshot(
  base: FormConfig,
  snapshot: BatchConfigSnapshot
): FormConfig {
  return {
    ...base,
    form1Questions: snapshot.form1Questions,
    form2Instructors: snapshot.form2Instructors,
    form2Questions: snapshot.form2Questions,
    form3Departments: snapshot.form3Departments,
  };
}

export const FORM3_DEPARTMENTS: DepartmentData[] = [
  {
    dept: "วิสัญญีแผนกรอฟื้นและช่วยชีวิต",
    staff: [
      "พ.ท.หญิง กรภัทร์ ทัดแก้ว",
      "พ.ต.หญิง พรประภา บัววรรณ",
      "พ.ต.หญิง วัลลภา มาลา",
      "พ.ต.หญิง มัสลิน ศรีสมบัติ",
      "ร.ท.หญิง จารุพรรณ พรมจีน",
      "ร.ท. นพดล หีมยิ",
      "ร.อ.หญิง กรกนก สุวรรณพิทักษ์",
      "น.ส. พิมพ์ปภัทร สะใบ",
      "น.ส. นีรนุช ภูต้องใจ",
      "น.ส. สุภาวดี ฤทธิยา",
      "ร.อ.หญิง ธัญภรณ์ ฉายากุล",
      "น.ส. สุภัสสรา ขวานคร",
    ],
  },
  {
    dept: "วิสัญญีออร์โธปิดิกส์",
    staff: [
      "พ.ต.หญิง ฐิติรัตน์ งามทับทิม",
      "พ.ต.หญิง ศศิธร สวนอยู่",
      "พ.ต.หญิง ฐิติพร ช้างแก้ว",
      "พ.ต.หญิง มณฐการ โชคธีรสวัสดิ์",
      "พ.ต.หญิง วิมลลักษณ์ วิเศษวงศ์ชัย",
      "ร.ท.หญิง อริสา จันทร์ภาคภูมิ",
      "ร.อ.หญิง สุภชา กริชเพชร",
      "ร.ท.หญิง พัทธนันท์ สุทธิวงค์",
      "น.ส. ณัชชา เนินทราย",
      "น.ส. พัณณ์พนิต อินทรีย์",
      "น.ส. ชรินรัตน์ ช่างเหลา",
      "นาย ฟิรฮาน มะมิง",
      "ร.อ.หญิง วรณัดดา รพิพันธุ์",
    ],
  },
  {
    dept: "วิสัญญี จักษุ โสต ศอ นาสิก",
    staff: [
      "พ.ท.หญิง สุภาพร ทัศน์ทอง",
      "พ.ต.หญิง กองแก้ว มีชูเสพ",
      "ร.อ.หญิง ขนิษฐา วงศ์แก้ว",
      "ร.อ.หญิง ภาสุนันท์ สินจิตต์",
      "ร.อ.หญิง ภัทรพร จันทร์เมืองไทย",
      "ร.ท. วัชระ พวงสุดรัก",
      "ร.ท. สงกรานต์ พรมศาสตร์",
      "ร.ท.หญิง ปานศิริ ทองงาม",
      "ร.อ.หญิง โสรยา ภาพนอก",
      "น.ส. วราพร โพธิ์หล้า",
      "น.ส. จุฑาทิพย์ ยัดไธสง",
      "น.ส. หงค์กมล พรหมจรรย์",
    ],
  },
  {
    dept: "วิสัญญีอุบัติเหตุ",
    staff: [
      "พ.ท.หญิง ณัฐนรี จันทร์ผล",
      "พ.ต.หญิง บุญปวีณ์ บัวกลาง",
      "พ.ต.หญิง วราภรณ์ ศรีคช",
      "พ.ต.หญิง คัทริยา ปัญญา",
      "ร.อ.หญิง จีรภา สุรโชติ",
      "ร.ท. วชิรวิชญ์ โชคพิชัยภูษิต",
      "ร.ท.หญิง พรรพิสา สุพร",
      "ร.อ.หญิง จุฑามาศ อาจปรุ",
      "น.ส. ชุติมณฑน์ ตั้งฉันทพัฒน์",
      "น.ส. กรรณิกา สายโสภา",
      "น.ส. ฟารีดา บ้านนบ",
    ],
  },
  {
    dept: "วิสัญญีศัลยกรรม 1",
    staff: [
      "พ.ท.หญิง ปณิดา จันทร์หอม",
      "พ.ต.หญิง ปิยะศิริ บุญทอง",
      "พ.ต.หญิง ณัฎฐา ศรีสุข",
      "พ.ต.หญิง วรางภา สิริกานต์ฐานะโรจน์",
      "ร.ท.หญิง ตรีชฎา ราชธนบริบาล",
      "ร.ท.หญิง นิลุบล รุ่งเพ็ชรวงศ์",
      "ร.ต.หญิง มายารีย์ ดลประสิทธิ์",
      "ร.ท.หญิง ชุติกาญจน์ แสงทรัพย์",
      "น.ส. แคทลียา ปรีคงทุ",
      "น.ส. อรยา โต๊ะมิ",
      "ร.อ.หญิง พนมพร ผิวสุพนธ์",
      "น.ส. รุ่งนภา ปัจจัย",
      "น.ส. คชาภรณ์ สมพงษ์",
    ],
  },
  {
    dept: "วิสัญญีศัลยกรรม 2",
    staff: [
      "พ.ท.หญิง ชัญรชาภัช ทะประสพ",
      "พ.ต.หญิง วัลยา สิงหสุรศักดิ์",
      "พ.ต.หญิง พรสวรรค์ กฤษหมื่นไวย",
      "ร.ท.หญิง ภัสราภรณ์ เกตุเทศ",
      "ร.ท.หญิง ดาริตา นวะมะวัฒน์",
      "ร.ท.หญิง ฑิฆัมพร มโนธรรม",
      "ร.ท.หญิง นุสบา ภูมิมาตร",
      "ร.ต.หญิง ปราณี วงศ์คำดี",
      "น.ส. ชาลินี อับดุลเลาะ",
      "ร.อ.หญิง ณัฐภรณ์ กูลกาศ",
      "ร.อ.หญิง ธภัทร ธนเชื้อปาน",
    ],
  },
  {
    dept: "วิสัญญีศัลยกรรม 3",
    staff: [
      "พ.ท.หญิง สุวาลี กล่อมสิน",
      "พ.ต.หญิง ไพรลดา เทียนหิรัญ",
      "พ.ต.หญิง ปภาวี จิตตะ",
      "พ.ต.หญิง ไพลิน เฉลิมวงศ์",
      "ร.อ.หญิง ชลธิชา เพ็ชรอัดขาว",
      "ร.อ.หญิง ศิริญญา ทิตจรัส",
      "ร.ท.หญิง มณีรัตน์ พึขุนทด",
      "ร.ท.หญิง อรพรรณ ภูมิสวัสดิ์",
      "ร.ท.หญิง อริยา ปานจักร์",
      "ร.ท.หญิง สุธิดา เดื่อกระโทก",
      "ร.ต.หญิง นัจนันท์ พรหมเสน",
      "น.ส. วิภาวัลย์ แซ่ย่าง",
      "น.ส. สกุลกาญจน์ ชูเชิด",
    ],
  },
  {
    dept: "นายสิบพยาบาล, ผู้ช่วยและพนักงานช่วยการพยาบาล (วิสัญญี)",
    allowSkip: true,
    staff: [
      "จ.ส.อ.หญิง สายหยุด จุมพลเดชา",
      "จ.ส.อ.หญิง ดวงกมล เกตุจินดา",
      "ส.อ.หญิง นัชชา ชูวงศ์วุฒิ",
      "น.ส. อรสม คุ้มถิ่นแก้ว",
      "น.ส. นิตยา จำรัสรักษ์",
      "น.ส. สุกาณดา สุดสังข์",
      "นาง กนกวรรณ ศานต์เศรษฐ์",
      "น.ส. จุฑาทิพย์ ประทุมชาติ",
      "น.ส. ปราณี แสนลือ",
      "น.ส. วิไลวรรณ มีนคร",
      "น.ส. พัชรพร ชมภิรมย์",
      "น.ส. ภรปภัช สุคนธ์เขต",
      "น.ส. เบญญทิพย์ ผลวิสุทธ์",
      "น.ส. วิภารัตน์ ธัญญกรรม",
      "น.ส. อชิรญา ตันนารัตน์",
      "นาย ปรมัตถ์ เพียงคาม",
      "นาย ขวัญ ปานทอง",
      "น.ส. อรอนงค์ คำแสง",
    ],
  },
];

export const DEFAULT_FORM_CONFIG: FormConfig = {
  form1Questions: FORM1_QUESTIONS,
  form2Instructors: FORM2_INSTRUCTORS,
  form2Questions: FORM2_EVAL_QUESTIONS,
  form3Departments: FORM3_DEPARTMENTS,
  isForceClosed: false,
  startDate: "",
  endDate: "",
  formStates: {
    form_1: { closed: false, startDate: "", endDate: "" },
    form_2: { closed: false, startDate: "", endDate: "" },
    form_3: { closed: false, startDate: "", endDate: "" },
  },
  currentBatch: 42,
  batches: [
    {
      id: 42,
      label: "รุ่นที่ 42",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ],
};
