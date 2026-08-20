"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, Eye, EyeOff } from "lucide-react";
import { isAdmin } from "@/lib/admin";

interface FormValues {
  displayName: string;
  email: string;
  password: string;
}

export function LoginForm() {
  const { user, loading, signIn, registerAsGuest, loginAsGuest } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/hub";

  const [isAdminTab, setIsAdminTab] = useState(false);
  const [isEvaluatorNew, setIsEvaluatorNew] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>();

  const isRegistering = useRef(false);

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
        const pass = await registerAsGuest(displayName.trim());
        setGeneratedPassword(pass);
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
      const friendly = message.includes("email-already-in-use")
        ? isAdminTab ? "อีเมลนี้ถูกใช้แล้ว" : "มีคนใช้ชื่อนี้แล้ว กรุณาเลือกชื่ออื่น หรือเลือก 'กลับมาทำต่อ'"
        : message.includes("wrong-password") || message.includes("invalid-credential")
        ? "รหัสผ่านไม่ถูกต้อง"
        : message.includes("user-not-found")
        ? (isAdminTab ? "ไม่พบบัญชีผู้ใช้" : "ไม่พบชื่อผู้ประเมินนี้ กรุณาสร้างชื่อใหม่")
        : message.includes("operation-not-allowed")
        ? "ระบบยังไม่เปิดใช้งาน (เช็ค Firebase Console)"
        : message.includes("permission-denied")
        ? "Permission Denied: ลืมตั้งค่า Firestore Rules หรือเปล่า?"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      {generatedPassword ? (
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border-t-4 border-blue-500">
          <h3 className="text-lg font-bold text-gray-800 mb-2">สร้างชื่อสำเร็จ!</h3>
          <p className="text-sm text-gray-600 mb-4">
            นี่คือชื่อและรหัสผ่านของคุณ กรุณา<strong>แคปหน้าจอ</strong> หรือจดบันทึกไว้ เพื่อใช้ล็อกอินกลับเข้ามาทำแบบประเมินต่อในครั้งหน้า
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-5 text-center space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">ชื่อผู้ประเมิน</p>
              <span className="text-lg font-semibold text-gray-800">
                {getValues("displayName")}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-1">รหัสผ่าน</p>
              <span className="text-3xl font-mono font-bold tracking-wider text-blue-600">
                {generatedPassword}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setGeneratedPassword(null);
              proceedToApp();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            รับทราบ แคปหน้าจอแล้ว
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 text-white rounded-full p-3 mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">แบบประเมินความพึงพอใจ</h1>
            <p className="text-gray-500 text-sm mt-1">พยาบาลวิสัญญี รุ่นที่ 42</p>
          </div>

          <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdminTab(false)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                !isAdminTab ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ผู้ประเมิน
            </button>
            <button
              type="button"
              onClick={() => setIsAdminTab(true)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                isAdminTab ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ผู้ดูแลระบบ
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isAdminTab ? (
              <>
                <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsEvaluatorNew(true)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                      isEvaluatorNew ? "bg-white shadow-sm font-medium text-gray-800" : "text-gray-500"
                    }`}
                  >
                    สร้างชื่อใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEvaluatorNew(false)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                      !isEvaluatorNew ? "bg-white shadow-sm font-medium text-gray-800" : "text-gray-500"
                    }`}
                  >
                    กลับมาทำต่อ
                  </button>
                </div>

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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
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
  );
}
