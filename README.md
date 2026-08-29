# 💉 ระบบประเมินความพึงพอใจหลักสูตรพยาบาลวิสัญญี (Anesthesia Evaluation Platform)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/golfzaptw/anesthesia-form)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.13-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

ระบบสารสนเทศเพื่อสนับสนุนการประเมินความพึงพอใจของนักเรียนพยาบาลวิสัญญี ต่อการจัดการเรียนการสอน อาจารย์แพทย์ และบุคลากรพยาบาลวิสัญญี พัฒนาขึ้นโดยเน้นการรักษาความเป็นส่วนตัวของผู้ประเมิน (Anonymous) พร้อมระบบบริหารจัดการผลการประเมินแบบแยกตามรุ่นการศึกษา (Batch System) และการวิเคราะห์ผลแบบ Real-time สำหรับผู้ดูแลระบบ

---

## 🌟 ฟีเจอร์หลัก (Key Features)

### 1. แบบประเมินมาตรฐาน 3 ชุด (Comprehensive Survey Forms)

- **ชุดที่ 1: การจัดการเรียนการสอน (Curriculum & Teaching Evaluation)**
  - ประเมินความพึงพอใจ 10 ด้านหลัก (สเกลคะแนน 1–5)
  - ช่องรับข้อเสนอแนะและข้อคิดเห็นเพิ่มเติมเพื่อการพัฒนาหลักสูตร
- **ชุดที่ 2: อาจารย์แพทย์วิสัญญี (Anesthesiologist Faculty Evaluation)**
  - ประเมินอาจารย์แพทย์รายบุคคลใน 5 มิติ (ความรู้ความสามารถ, การถ่ายทอด, ความตรงต่อเวลา, มนุษยสัมพันธ์, ความเอาใจใส่)
  - สรุปคะแนนเฉลี่ยรายบุคคลและรายด้าน
- **ชุดที่ 3: บุคลากรพยาบาลวิสัญญีและเจ้าหน้าที่ (Nurse Anesthetist & Staff Evaluation)**
  - ประเมินความพึงพอใจแยกตามแผนก/ห้องผ่าตัด
  - มีระบบ **"เคยพบ / ไม่เคยพบ" (Skip Option)** สำหรับตำแหน่งหรือแผนกที่นักเรียนอาจไม่ได้ร่วมงานครบทุกคน

### 2. ระบบประเมินแบบไม่เปิดเผยตัวตน (Anonymous & Privacy-First)

- นักเรียนสามารถสร้างชื่อเข้าระบบและรับรหัสผ่านอัตโนมัติ โดยไม่ต้องใช้อีเมลส่วนตัว
- ติดตามสถานะความคืบหน้าการส่งแบบประเมินส่วนตัว (Progress Tracker) ในหน้า Hub

### 3. ระบบแยกข้อมูลตามรุ่นการศึกษา (Academic Year / Batch Separation)

- **สลับดูผลย้อนหลัง**: ผู้ดูแลระบบสามารถเลือกดูสถิติ, กราฟ, และคะแนนเฉลี่ยของรุ่นก่อนหน้าได้
- **สร้างรุ่นใหม่ผ่าน UI**: ผู้ดูแลระบบสามารถสร้างรุ่นถัดไป (เช่น รุ่น 43 ➔ รุ่น 44) ได้ทันทีผ่านหน้า Admin โดยระบบจะเปิดรอบใหม่ให้นักเรียนทำแบบประเมิน
- **โหมด Read-Only สำหรับรุ่นเก่า**: รุ่นในอดีตจะถูกล็อคให้อยู่ในโหมดอ่านอย่างเดียว (ป้องกันการแก้ไขหรือลบข้อมูล) แต่ยังสามารถดาวน์โหลดรายงาน CSV ได้ตลอดเวลา

### 4. แดชบอร์ดวิเคราะห์ผลและส่งออกข้อมูล (Admin Analytics & CSV Export)

- กราฟแท่งแสดงคะแนนเฉลี่ยรายข้อ, สถิติภาพรวม, และอัตราการตอบกลับ (Response Rate)
- รวมข้อเสนอแนะและคอมเมนต์ของนักเรียนแยกตามหมวดหมู่
- **ดาวน์โหลด CSV**: ส่งออกไฟล์รายงานสรุปผลการประเมินทุกชุด รองรับภาษาไทยสมบูรณ์ (UTF-8 with BOM สำหรับ Microsoft Excel)

### 5. ระบบกำหนดเวลาและควบคุมการเปิด-ปิด (Scheduling & Force Close)

- กำหนดวันและเวลาเปิด-ปิดรับคำตอบล่วงหน้า พร้อมระบบนับถอยหลัง (Countdown Timer)
- สวิตช์ **Force Close** บังคับปิดรับคำตอบทันทีในกรณีฉุกเฉิน

### 6. ปรับแต่งข้อมูลแบบฟอร์มได้เอง (Dynamic Form Editor)

- เพิ่ม/แก้ไข/ลบหัวข้อคำถาม, รายชื่ออาจารย์แพทย์, แผนก และรายชื่อพยาบาลวิสัญญีผ่านหน้า Admin โดยไม่ต้องแก้ไข Source Code

### 7. โหมดทดสอบ Local Demo (Mock Store)

- รองรับการทำงานทั้งแบบเชื่อมต่อ **Firebase Firestore** จริง และโหมด **Mock Mode (LocalStorage)** เพื่อทดสอบระบบได้ทันทีโดยไม่ต้องตั้งค่า Cloud

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Frontend Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Vanilla Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Database & Auth**: [Google Firebase (Authentication & Cloud Firestore)](https://firebase.google.com/)
- **Typography**: [Google Fonts (Sarabun)](https://fonts.google.com/specimen/Sarabun)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
student-form/
├── app/                              # Next.js App Router Pages
│   ├── admin/                        # หน้าแดชบอร์ดผู้ดูแลระบบ
│   │   ├── page.tsx                  # Admin Dashboard, Analytics, Batch Manager
│   │   └── preview/[id]/page.tsx     # ตัวอย่างแบบฟอร์มก่อนใช้งานจริง (Preview)
│   ├── forms/                        # หน้าแบบประเมินสำหรับนักเรียน
│   │   ├── 1/page.tsx                # แบบประเมินชุดที่ 1 (การเรียนการสอน)
│   │   ├── 2/page.tsx                # แบบประเมินชุดที่ 2 (อาจารย์แพทย์)
│   │   └── 3/page.tsx                # แบบประเมินชุดที่ 3 (พยาบาลวิสัญญี)
│   ├── hub/                          # หน้ารวมแบบประเมินและสถานะนักเรียน
│   │   └── page.tsx
│   ├── login/                        # หน้าเข้าสู่ระบบ (นักเรียน & แอดมิน)
│   │   └── page.tsx
│   ├── globals.css                   # Global CSS & Tailwind Setup
│   ├── layout.tsx                    # Root Layout & Metadata
│   └── page.tsx                      # Landing Redirect Page
├── components/                       # React Components
│   ├── admin/                        # ส่วนประกอบหน้า Admin
│   │   ├── Collapsible.tsx           # Accordion สำหรับดูคอมเมนต์
│   │   ├── FormEditor.tsx            # เครื่องมือแก้ไขคำถาม/รายชื่ออาจารย์/แผนก
│   │   ├── ScoreBar.tsx              # แถบแสดงคะแนนเฉลี่ยรายข้อ
│   │   └── StatCard.tsx              # การ์ดสรุปสถิติสำคัญ
│   ├── auth/                         # ส่วนประกอบการยืนยันตัวตน
│   │   └── LoginForm.tsx             # ฟอร์ม Login / Guest Register
│   ├── common/                       # ส่วนประกอบทั่วไป
│   │   └── ConsoleSignature.tsx      # Developer Console Signature Easter Egg
│   ├── forms/                        # ส่วนประกอบของแบบประเมิน
│   │   ├── Form1.tsx
│   │   ├── Form2.tsx
│   │   └── Form3.tsx
│   └── ui/                           # UI Reusable Components
│       ├── EvaluatorBadge.tsx        # ป้ายแสดงชื่อผู้ประเมิน
│       ├── Footer.tsx                # Minimalist Footer with Credits
│       ├── FormCard.tsx              # การ์ดแบบประเมินในหน้า Hub
│       ├── RadioGroup.tsx            # Radio selector
│       ├── ScaleInput.tsx            # ตัวเลือกให้คะแนน 1-5
│       ├── SectionHeader.tsx         # หัวข้อกลุ่มคำถาม
│       ├── SubmitButton.tsx          # ปุ่ม Submit ฟอร์ม
│       ├── SystemInfoModal.tsx       # หน้าต่างข้อมูลระบบและลิขสิทธิ์
│       ├── TextAreaInput.tsx         # ช่องกรอกข้อความ/ความคิดเห็น
│       └── TextInput.tsx             # ช่องกรอกข้อความสั้น
├── contexts/                         # React Contexts
│   └── AuthContext.tsx               # Context จัดการสถานะผู้ใช้ (Auth & Guest)
├── lib/                              # Business Logic & Utility Functions
│   ├── admin.ts                      # ตรวจสอบสิทธิ์ผู้ดูแลระบบ
│   ├── analytics.ts                  # คำนวณสถิติและคะแนนเฉลี่ย
│   ├── csv.ts                        # สร้างและดาวน์โหลดไฟล์ CSV (UTF-8 BOM)
│   ├── firebase.ts                   # Firebase Client Config
│   ├── firestore.ts                  # Firestore Queries, CRUD & Migrations
│   ├── formData.ts                   # Schema ข้อมูลเริ่มต้นของแบบฟอร์ม
│   ├── mockMode.ts                   # สลับโหมด Mock / Production
│   └── mockStore.ts                  # Mock Storage ใน LocalStorage
├── types/                            # TypeScript Type Definitions
│   └── index.ts                      # Interfaces สำหรับ User, Submission, Batch, Config
├── LICENSE                           # ใบอนุญาตลิขสิทธิ์ (MIT License)
├── package.json                      # รายการ Dependencies และ Scripts
└── tailwind.config.ts                # การตั้งค่า Tailwind CSS
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### ข้อกำหนดเบื้องต้น (Prerequisites)

- [Node.js](https://nodejs.org/) เวอร์ชัน 18.17.0 ขึ้นไป
- [npm](https://www.npmjs.com/) หรือ [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### 1. Clone Repository และติดตั้ง Dependencies

```bash
git clone https://github.com/golfzaptw/anesthesia-form.git
cd student-form
npm install
```

### 2. กำหนดค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ Root Directory:

```bash
cp .env.example .env.local
```

ตั้งค่าตัวแปรใน `.env.local`:

```env
# ตั้งค่า Firebase Web App (จาก Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# รายชื่ออีเมลผู้ดูแลระบบ (คั่นด้วยจุลภาค)
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com

# ตั้งเป็น true หากต้องการทดสอบแบบ Local โดยไม่ต้องต่อ Firebase
NEXT_PUBLIC_USE_MOCK=false
```

### 3. รัน Development Server

```bash
npm run dev
```

เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### 4. Build สำหรับ Production

```bash
npm run build
npm run start
```

---

## 👥 ผู้จัดทำและลิขสิทธิ์ (Author & License)

- **ผู้พัฒนาและออกแบบระบบ (Lead Developer & Architect):**
  - **Chutikan Sangsup**
- **สังกัด (Affiliation):**
  - **Nurse Anesthesia, Phramongkutklao Hospital** (พยาบาลวิสัญญี โรงพยาบาลพระมงกุฎเกล้า)
- **ลิขสิทธิ์ (License):**
  - ผลงานนี้อยู่ภายใต้ใบอนุญาต **[MIT License](./LICENSE)** — Copyright (c) 2026 Chutikan Sangsup
