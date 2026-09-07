# แผนปรับปรุงระบบ Admin (Analyze + Config)

## ปัญหาและแนวทาง

ระบบ admin ปัจจุบัน (`app/admin/page.tsx` ~1000 บรรทัด) ทำงานได้ครบระดับ "ดูผลรวม + แก้ config" แต่มีช่องว่าง 3 กลุ่ม:

1. **ความถูกต้องของข้อมูลย้อนหลัง (critical)** — `config/formData` เป็น document เดียวแบบ global แต่คำตอบเก็บเป็น index key (`i3_q2`, `d1_s4_met`, `q7_score`) เมื่อ admin แก้/ลบ/สลับรายชื่อใน editor ผลวิเคราะห์ของ **รุ่นเก่าทั้งหมด** จะถูก map ผิดคน/ผิดข้อ โดยไม่มีคำเตือนใดๆ
2. **ความลึกของการวิเคราะห์** — มีแค่ mean + distribution ไม่มี SD/median/top-box, ไม่มีการเทียบข้ามรุ่น, ไม่มี filter/search, export เป็น CSV ดิบอย่างเดียว
3. **ความปลอดภัยของการตั้งค่า** — editor ไม่มี validation, ไม่เตือนเมื่อยังไม่บันทึก, ไม่มี audit log, เปิด/ปิดได้แค่ระดับทั้งระบบ

**แนวทางที่เลือก:**
- **Snapshot config ต่อรุ่น** — เก็บ `config/batch_{id}` ตอนสร้างรุ่นใหม่ และ analytics ของแต่ละรุ่นอ่าน snapshot ของตัวเอง ไม่แตะ schema คำตอบเดิม (ไม่ต้อง migrate `answers`)
- **ไม่เพิ่ม dependency** — กราฟทั้งหมดวาดด้วย SVG/CSS + Tailwind, รายงาน PDF ใช้ `window.print()` + print stylesheet
- **แตกไฟล์** `app/admin/page.tsx` ที่บวมเกินไปออกเป็น component ย่อยระหว่างทาง เพื่อให้เฟสหลัง ๆ แก้ได้โดยไม่ชนกัน

---

## เฟส 1 — ความถูกต้องของข้อมูล (ทำก่อน)

### 1.1 Snapshot config ต่อรุ่น
- `types/index.ts`: เพิ่ม `BatchConfigSnapshot` (form1Questions, form2Instructors, form2Questions, form3Departments, snapshotAt)
- `lib/firestore.ts`:
  - `saveBatchConfigSnapshot(batchId, config)` → เขียน `config/batch_{id}`
  - `getBatchConfigSnapshot(batchId)` → อ่าน snapshot, คืน `null` ถ้าไม่มี
  - `createNewBatch()` → **snapshot config ของรุ่นที่กำลังจะปิด** ก่อนสลับไปรุ่นใหม่
  - `saveFormConfig()` → ถ้าแก้ config ของรุ่นปัจจุบัน ให้ refresh snapshot ของรุ่นนั้นด้วย (snapshot = "สภาพ config ล่าสุดของรุ่นนั้น")
- `lib/mockStore.ts`: implement ฝั่ง mock ให้ตรงกัน
- `firestore.rules`: อนุญาต admin read/write `config/batch_*`

### 1.2 Backfill snapshot สำหรับรุ่นที่มีอยู่แล้ว
- ปุ่ม maintenance ในหน้า admin (ข้าง ๆ "ย้ายข้อมูลเก่า") — สร้าง snapshot จาก config ปัจจุบันให้ทุกรุ่นใน `config.batches` ที่ยังไม่มี snapshot
- แสดงผลว่าสร้างไปกี่รุ่น/ข้ามกี่รุ่น

### 1.3 Analytics อ่าน snapshot ของรุ่นที่เลือก
- `app/admin/page.tsx`: state `analysisConfig` แยกจาก `config` (config = ตัวปัจจุบันสำหรับ editor, analysisConfig = snapshot ของ `activeBatch`)
- โหลด snapshot เมื่อเปลี่ยน batch, fallback เป็น config ปัจจุบันพร้อม badge เตือน "ใช้ config ปัจจุบัน — ชื่ออาจไม่ตรงกับตอนประเมิน"
- `analyseForm1/2/3` รับ `analysisConfig`
- CSV export ใช้ `analysisConfig` เช่นกัน (`lib/csv.ts` ไม่ต้องแก้ signature)

### 1.4 แก้ React duplicate key
- `key={ins.name}` / `key={d.dept}` / `key={s.name}` / `key={s.label}` → ใช้ index-based key (`form2-${idx}`) ป้องกันชื่อซ้ำทำ UI พัง

---

## เฟส 2 — Guard ฝั่ง Config

### 2.1 เตือนเมื่อแก้ config ของรุ่นที่มีคำตอบแล้ว
- ส่ง `submissionCount` + จำนวนคำตอบต่อฟอร์มเข้า `FormEditor`
- ถ้ามีคำตอบแล้ว: แสดง banner แดงถาวรด้านบน editor อธิบายว่าการลบ/สลับลำดับจะทำให้ข้อมูลเดิม map ผิด
- ตรวจ diff ตอนกดบันทึก: ถ้าจำนวนรายการลดลงหรือลำดับเปลี่ยน → modal ยืนยันที่ระบุชัดว่ารายการไหนหาย/ย้ายไปไหน
- ปุ่มลบแผนก/ย้ายลำดับ: disable + tooltip อธิบาย เมื่อรุ่นนั้นมีคำตอบแล้ว (override ได้ผ่าน checkbox "ฉันเข้าใจความเสี่ยง")

### 2.2 Validation + unsaved-changes guard
- `lib/configValidation.ts` ใหม่: ตรวจชื่อซ้ำ (case/space-insensitive), บรรทัดว่าง, แผนกไม่มีชื่อ, แผนกไม่มี staff, `endDate` < `startDate`
- แสดง error inline + disable ปุ่มบันทึกเมื่อมี error ระดับ blocking
- Dirty state: เทียบกับ `initialConfig`, แสดงจุดสีส้ม "ยังไม่ได้บันทึก", ผูก `beforeunload` และเตือนตอนสลับ tab ออกจาก editor
- เปลี่ยน `defaultValue` → `value` (controlled) เพื่อให้ reset/undo ได้จริง

### 2.3 Import / Export config เป็น JSON
- ปุ่ม "ดาวน์โหลด config (.json)" และ "นำเข้า config"
- นำเข้า: validate schema → แสดง preview diff (เพิ่ม/ลบ/แก้กี่รายการ) → ยืนยันก่อน apply เข้า state (ยังไม่บันทึกจนกด "บันทึกข้อมูล")
- ใช้เป็น backup ก่อนแก้ และใช้ copy config ข้ามรุ่นได้

---

## เฟส 3 — Analyze เชิงลึก

### 3.1 สถิติเพิ่มใน `lib/analytics.ts`
- ขยาย `ScoreStat`: `median`, `stdDev`, `topBoxRate` (%คะแนน 4-5), `lowBoxRate` (%คะแนน 1-2), `responseRate` (count / จำนวนคนที่ส่งฟอร์มนั้น)
- `ScoreBar` แสดง SD + top-box, และ badge สีแดงเมื่อ average ต่ำกว่าเกณฑ์
- เกณฑ์เตือน (`alertThreshold`, default 3.5) เก็บใน `FormConfig` ตั้งค่าได้ใน editor

### 3.2 Insight panel บน tab ภาพรวม
- "ข้อที่ควรปรับปรุง" — 5 ข้อคะแนนต่ำสุดของชุด 1
- "อาจารย์ที่คะแนนต่ำกว่าเกณฑ์" — รายชื่อ + คะแนน (ซ่อนได้)
- "ข้อที่คะแนนสูงสุด" — 3 อันดับ
- ความเห็นเข้ามาแล้วกี่รายการ / ยังไม่มีใครประเมินกี่คน

### 3.3 กราฟ (SVG/CSS ล้วน)
- `components/admin/charts/SparkLine.tsx` — trend ค่าเฉลี่ยข้ามรุ่น
- `components/admin/charts/BarSeries.tsx` — distribution 1-5 แบบ stacked
- `components/admin/charts/TimelineChart.tsx` — จำนวนคำตอบต่อวัน (จาก `submittedAt`) พร้อมเส้นสะสม

### 3.4 Tab "เทียบรุ่น" ใหม่
- โหลด submissions + snapshot ของทุกรุ่นใน `config.batches`
- ตารางเทียบ: จำนวนผู้ลงทะเบียน, อัตราตอบกลับ, คะแนนเฉลี่ยชุด 1, คะแนนเฉลี่ยอาจารย์รวม
- เทียบรายข้อของชุด 1 ข้ามรุ่น (จับคู่ด้วยข้อความคำถาม ไม่ใช่ index — เพราะคำถามอาจเปลี่ยน) + sparkline
- เทียบรายอาจารย์ข้ามรุ่น (จับคู่ด้วยชื่อ)
- โหลดแบบ lazy เมื่อเปิด tab เท่านั้น เพื่อไม่ให้หน้าแรกช้า

---

## เฟส 4 — เครื่องมือใช้งานจริงประจำวัน

### 4.1 ตารางรายบุคคล: search / filter / sort
- ช่องค้นหาชื่อ-อีเมล
- Filter: ทั้งหมด / ส่งครบ / ส่งไม่ครบ / ยังไม่ส่งเลย / มีการแก้ไขคำตอบ
- Sort: ลำดับลงทะเบียน / ชื่อ / จำนวนที่ส่ง / เวลาส่งล่าสุด
- แสดงเวลาที่ส่งของแต่ละฟอร์มใน tooltip

### 4.2 ติดตามคนที่ยังไม่ส่ง
- แถบสรุป "ยังไม่ส่ง N คน"
- ปุ่ม "คัดลอกอีเมลทั้งหมด" (คั่นด้วย `;` สำหรับวางในโปรแกรมเมล)
- ปุ่ม export CSV รายชื่อคนที่ยังไม่ส่ง (ระบุว่าขาดชุดไหน)

### 4.3 ค้นหา/จัดการความเห็น
- ช่องค้นหาข้อความในความเห็นทุกฟอร์ม
- Toggle "ซ่อนชื่อผู้ประเมิน" (สำหรับตอนนำเสนอในที่ประชุม) — เก็บใน localStorage
- แสดงคะแนนที่ผู้ให้ความเห็นคนนั้นให้ ควบคู่กับข้อความ (ชุด 1 และ 2)

### 4.4 Export เพิ่มเติม
- `lib/csv.ts`: `summaryToCsv()` — รายงานสรุปต่อข้อ/ต่ออาจารย์ (label, n, mean, SD, median, top-box, distribution)
- ปุ่ม "ดาวน์โหลดทั้งหมด" — ยิง export ทั้ง 3 ฟอร์ม + สรุป
- ปุ่ม "พิมพ์รายงาน" → `window.print()` พร้อม print stylesheet ใน `app/globals.css` (ซ่อน nav/ปุ่ม, กางทุก Collapsible, บังคับสีกราฟด้วย `print-color-adjust`)

---

## เฟส 5 — ความปลอดภัยและการควบคุม

### 5.1 Audit log
- Collection `admin_audit`: `{ action, actorEmail, targetLabel, batchId, detail, at }`
- Log: `config.save` (พร้อมสรุป diff), `batch.create`, `user.delete`, `force_close.toggle`, `config.import`, `migration.run`
- Section "ประวัติการเปลี่ยนแปลง" ใน tab editor — แสดง 50 รายการล่าสุด
- `firestore.rules`: admin เท่านั้นที่ read/create ได้ ห้าม update/delete

### 5.2 เปิด-ปิดรายฟอร์ม
- `FormConfig.formStates?: Record<FormId, { closed?: boolean; startDate?: string; endDate?: string }>`
- Editor: toggle + ช่วงเวลาแยกรายฟอร์ม (override global; ว่าง = ใช้ค่า global)
- `app/hub/page.tsx` + `app/forms/*` เคารพค่ารายฟอร์ม
- การ์ดสถานะบน admin แสดงสถานะแยก 3 ฟอร์ม

### 5.3 แก้ชื่อรุ่น + timezone
- แก้ `label` ของ batch ได้ใน editor (เช่น "รุ่นที่ 43 (ปี 2569)")
- ระบุ timezone กำกับใต้ช่อง datetime และ normalize การเทียบเวลาให้ใช้ฐานเดียวกันทั้ง admin/hub/forms

---

## หมายเหตุและข้อควรระวัง

- **ลำดับสำคัญ:** เฟส 1 ต้องเสร็จก่อนเฟส 3 เพราะกราฟเทียบรุ่นต้องพึ่ง snapshot จึงจะแม่น
- **ไม่ต้อง migrate `answers`** ตามที่ตกลงกัน — snapshot ต่อรุ่นแก้ปัญหาโดยไม่แตะข้อมูลเดิม
- **Firestore read cost:** `getAllSubmissions()` ดึงทุก document แล้วค่อย filter ใน client — tab เทียบรุ่นจึงใช้ผลชุดเดียวกันได้ ไม่ยิงซ้ำต่อรุ่น
- **Refactor `app/admin/page.tsx`:** แตกเป็น `components/admin/tabs/{Overview,Form1Tab,Form2Tab,Form3Tab,CompareTab}.tsx` ตอนต้นเฟส 3 (ไฟล์เดียว 1000 บรรทัดจะแก้ยากมากหลังเพิ่มฟีเจอร์)
- **Validate ทุกเฟส:** `npm run lint` + `npm run build` และทดสอบด้วย mock mode (`lib/mockMode.ts`)
- **Firestore rules** ต้องอัปเดตควบคู่ทุกครั้งที่เพิ่ม collection ใหม่ (`config/batch_*`, `admin_audit`)
- ยังไม่รวมการส่งอีเมลแจ้งเตือนอัตโนมัติ — ต้องใช้ backend/Cloud Functions ซึ่งอยู่นอกขอบเขตปัจจุบัน (เฟส 4.2 ให้คัดลอกอีเมลแทน)
