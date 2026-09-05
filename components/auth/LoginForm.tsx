"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, Eye, EyeOff, Download } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { downloadCredentialImage } from "@/lib/credentialImage";
import { Footer } from "@/components/ui/Footer";

interface FormValues {
  displayName: string;
  email: string;
  password: string;
}

export function LoginForm() {
  const { user, loading, signIn, registerAsGuest, loginAsGuest } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/hub";

  const [isAdminTab] = useState(searchParams.get("admin") === "true");
  const [isEvaluatorNew, setIsEvaluatorNew] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState("");
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const isRegistering = useRef(false);

  useEffect(() => {
    if (!generatedPassword || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [generatedPassword, countdown]);

  useEffect(() => {
    if (!loading && user && !isRegistering.current && !generatedPassword) {
      const finalRedirect = isAdmin(user.email) ? "/admin" : redirect;
      document.cookie = "auth_session=1; path=/; max-age=2592000; SameSite=Lax";
      window.location.href = finalRedirect;
    }
  }, [user, loading, redirect, generatedPassword]);

  const proceedToApp = () => {
    const finalRedirect = isAdminTab ? "/admin" : redirect;
    document.cookie = "auth_session=1; path=/; max-age=2592000; SameSite=Lax";
    window.location.href = finalRedirect;
  };

  const onSubmit = async ({ email, password, displayName }: FormValues) => {
    setSubmitting(true);
    try {
      if (isAdminTab) {
        await signIn(email, password);
        toast.success("เข้าสู่ระบบผู้ดูแลสำเร็จ!");
      } else if (isEvaluatorNew) {
        isRegistering.current = true;
        const trimmedName = displayName.trim();
        const pass = await registerAsGuest(trimmedName);
        setRegisteredName(trimmedName);
        setGeneratedPassword(pass);
        setCountdown(5);
        setSubmitting(false);
        return; // wait for user to acknowledge password
      } else {
        await loginAsGuest(displayName.trim(), password);
        toast.success("เข้าสู่ระบบสำเร็จ!");
      }
      proceedToApp();
    } catch (err: unknown) {
      console.error("Auth Error:", err);
      const message = err instanceof Error ? err.message : String(err);
      const friendly = message.includes("email-already-in-use") || message.includes("display-name-already-in-use")
        ? isAdminTab ? "อีเมลนี้ถูกใช้แล้ว" : "มีคนใช้ชื่อนี้แล้ว กรุณาเลือกชื่ออื่น หรือเลือก 'กลับมาทำต่อ'"
        : message.includes("wrong-password") || message.includes("invalid-credential")
        ? "รหัสผ่านไม่ถูกต้อง"
        : message.includes("user-not-found")
        ? (isAdminTab ? "ไม่พบบัญชีผู้ใช้" : "ไม่พบชื่อผู้ประเมินนี้ หรือบัญชีนี้อาจถูกลบไปแล้ว กรุณาสร้างชื่อใหม่")
        : message.includes("operation-not-allowed")
        ? "ระบบยังไม่เปิดใช้งาน (เช็ค Firebase Console)"
        : message.includes("permission-denied")
        ? "Permission Denied: ไม่มีสิทธิ์เข้าถึง Firestore"
        : `เกิดข้อผิดพลาด: ${message.slice(0, 50)}...`;
      toast.error(friendly);
    } finally {
      if (!generatedPassword) {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between items-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-4 sm:py-8">
      <div className="w-full flex-1 flex items-center justify-center py-2">
        {generatedPassword ? (
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm border-t-4 border-blue-500">
            <h3 className="text-lg font-bold text-gray-800 mb-2">สร้างชื่อสำเร็จ!</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              นี่คือชื่อและรหัสผ่านของคุณ กรุณา<strong>บันทึกเป็นรูปภาพ</strong> หรือจดบันทึกไว้ เพื่อใช้ล็อกอินกลับเข้ามาทำแบบประเมินต่อในครั้งหน้า
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 text-center space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">ชื่อผู้ประเมิน</p>
                <span className="text-base sm:text-lg font-semibold text-gray-800">
                  {registeredName}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-1">รหัสผ่าน</p>
                <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-blue-600">
                  {generatedPassword}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadCredentialImage(registeredName, generatedPassword);
                  toast.success("บันทึกรูปภาพแล้ว");
                } catch {
                  toast.error("บันทึกรูปไม่สำเร็จ กรุณาแคปหน้าจอแทน");
                }
              }}
              className="w-full mb-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              บันทึกเป็นรูปภาพ
            </button>
            <button
              onClick={() => {
                setGeneratedPassword(null);
                proceedToApp();
              }}
              disabled={countdown > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
            >
              {countdown > 0 ? `กรุณาบันทึกข้อมูลก่อน (${countdown})` : "รับทราบ บันทึกข้อมูลแล้ว"}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              ระบบไม่ได้เก็บรหัสผ่านนี้ไว้ กรุณาเก็บรูปหรือจดไว้ด้วยตนเอง
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8">
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl p-3 mb-3 shadow-md shadow-blue-500/20">
                <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 text-center leading-snug">
                แบบประเมินวิสัญญีแพทย์และวิสัญญีพยาบาล
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 text-center">หลักสูตรพยาบาลวิสัญญี</p>
            </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isAdminTab ? (
              <>
                <div className="flex gap-2 mb-4 bg-gray-100 p-1.5 rounded-lg shadow-inner">
                  <button
                    type="button"
                    onClick={() => setIsEvaluatorNew(true)}
                    className={`flex-1 text-xs py-2 rounded-md transition-all duration-300 ${
                      isEvaluatorNew 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-semibold" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    สร้างชื่อใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEvaluatorNew(false)}
                    className={`flex-1 text-xs py-2 rounded-md transition-all duration-300 ${
                      !isEvaluatorNew 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md font-semibold" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    กลับมาทำต่อ
                  </button>
                </div>

                {isEvaluatorNew && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg text-xs text-purple-800 shadow-sm flex items-start gap-2">
                    <span className="text-purple-500">💡</span>
                    <span><strong>หมายเหตุ:</strong> สามารถกลับมาทำภายหลังได้ตรงหน้าแรกโดยใช้รหัสที่แนบไป</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ประเมิน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักเรียน A"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.displayName ? "border-red-400" : "border-gray-300"
                    }`}
                    {...register("displayName", {
                      required: !isAdminTab ? "กรุณากรอกชื่อผู้ประเมิน" : false,
                    })}
                  />
                  {errors.displayName ? (
                    <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>
                  ) : (
                    <p className="text-gray-400 text-xs mt-1">
                      {isEvaluatorNew
                        ? "ตั้งชื่อนามสมมติที่จำได้ง่าย เพื่อใช้ประเมิน"
                        : "กรอกชื่อเดิมที่เคยตั้งไว้"}
                    </p>
                  )}
                </div>

                {!isEvaluatorNew && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="รหัสผ่านที่ระบบเคยสร้างให้"
                        className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? "border-red-400" : "border-gray-300"
                        }`}
                        {...register("password", {
                          required: (!isAdminTab && !isEvaluatorNew) ? "กรุณากรอกรหัสผ่าน" : false,
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้ดูแล</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                    {...register("email", {
                      required: isAdminTab ? "กรุณากรอกอีเมล" : false,
                      pattern: { value: /\S+@\S+\.\S+/, message: "รูปแบบอีเมลไม่ถูกต้อง" },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="รหัสผ่านผู้ดูแลระบบ"
                      className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? "border-red-400" : "border-gray-300"
                      }`}
                      {...register("password", {
                        required: isAdminTab ? "กรุณากรอกรหัสผ่าน" : false,
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : !isAdminTab ? (
                "เข้าทำแบบประเมิน"
              ) : (
                "เข้าสู่ระบบผู้ดูแล"
              )}
            </button>
          </form>
        </div>
      )}
      </div>
      <Footer className="mt-4 w-full" />
    </div>
  );
}
