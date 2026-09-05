// Renders the evaluator's name + password onto a canvas so it can be saved as a PNG.
const WIDTH = 760;
const HEIGHT = 470;
const SCALE = 2;

const SANS = '"Noto Sans Thai", "Sarabun", "Prompt", system-ui, -apple-system, "Helvetica Neue", sans-serif';
const MONO = '"SF Mono", Menlo, Consolas, "Courier New", monospace';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCredentialCard(displayName: string, password: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unsupported");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const header = ctx.createLinearGradient(0, 0, WIDTH, 0);
  header.addColorStop(0, "#2563eb");
  header.addColorStop(1, "#4f46e5");
  ctx.fillStyle = header;
  ctx.fillRect(0, 0, WIDTH, 96);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 28px ${SANS}`;
  ctx.fillText("ข้อมูลเข้าสู่ระบบผู้ประเมิน", 40, 48);
  ctx.font = `16px ${SANS}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText("แบบประเมินวิสัญญีแพทย์และวิสัญญีพยาบาล", 40, 76);
  ctx.globalAlpha = 1;

  roundedRect(ctx, 40, 136, WIDTH - 80, 226, 16);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  const centerX = WIDTH / 2;

  ctx.fillStyle = "#64748b";
  ctx.font = `16px ${SANS}`;
  ctx.fillText("ชื่อผู้ประเมิน", centerX, 176);
  ctx.fillStyle = "#1e293b";
  ctx.font = `bold 26px ${SANS}`;
  ctx.fillText(displayName, centerX, 212);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 240);
  ctx.lineTo(WIDTH - 80, 240);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = `16px ${SANS}`;
  ctx.fillText("รหัสผ่าน", centerX, 280);
  ctx.fillStyle = "#2563eb";
  ctx.font = `bold 52px ${MONO}`;
  ctx.fillText(password, centerX, 332);

  ctx.fillStyle = "#475569";
  ctx.font = `16px ${SANS}`;
  ctx.fillText("เก็บภาพนี้ไว้ เพื่อใช้กลับมาทำแบบประเมินต่อในครั้งหน้า", centerX, 402);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `14px ${SANS}`;
  ctx.fillText(`บันทึกเมื่อ ${new Date().toLocaleString("th-TH")}`, centerX, 430);

  return canvas;
}

function safeFileName(displayName: string) {
  const cleaned = displayName.replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
  return `รหัสผ่าน-${cleaned || "ผู้ประเมิน"}.png`;
}

export async function downloadCredentialImage(displayName: string, password: string) {
  const canvas = drawCredentialCard(displayName, password);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("image-export-failed");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(displayName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
