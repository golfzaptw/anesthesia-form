/**
 * Submit helper with automatic retry logic.
 * Retries up to `maxRetries` times (default 2) with exponential backoff.
 */
export async function submitWithRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 2;
  const baseDelay = options?.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Returns a user-friendly error message based on the error type.
 */
export function getSubmitErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
      return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง";
    }
    if (msg.includes("permission") || msg.includes("unauthorized")) {
      return "ไม่มีสิทธิ์ในการส่งแบบประเมิน กรุณาล็อกอินใหม่";
    }
    if (msg.includes("quota") || msg.includes("resource exhausted")) {
      return "ระบบมีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกสักครู่";
    }
  }
  return "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองอีกครั้ง (ข้อมูลของท่านยังอยู่ครบ)";
}
