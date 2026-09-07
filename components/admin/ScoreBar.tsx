import { useState, useRef } from "react";
import type { ScoreStat, CommentEntry } from "@/lib/analytics";
import { AlertCircle, BarChart2, Download } from "lucide-react";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import toast from "react-hot-toast";

interface ScoreBarProps extends ScoreStat {
  alertThreshold?: number;
  comments?: CommentEntry[];
}

function barColor(avg: number): string {
  if (avg >= 4) return "bg-green-500";
  if (avg >= 3) return "bg-blue-500";
  if (avg >= 2) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreBar({
  label,
  average,
  count,
  distribution,
  median,
  stdDev,
  topBoxRate,
  alertThreshold = 3.5,
  comments,
}: ScoreBarProps) {
  const [showChart, setShowChart] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const pct = (average / 5) * 100;
  const isAlert = count > 0 && average < alertThreshold;

  const handleDownloadGraph = async () => {
    if (!chartRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading("กำลังเตรียมรูปภาพ...");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `chart_${label.substring(0, 30)}.png`;
      link.href = url;
      link.click();
      toast.success("ดาวน์โหลดสำเร็จ", { id: toastId });
    } catch (err) {
      console.error("Failed to download graph:", err);
      toast.error("ดาวน์โหลดไม่สำเร็จ", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0 print:py-6 print:border-none print:break-inside-avoid">
      <div className="flex items-start justify-between gap-4 mb-1.5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700 leading-snug">{label}</p>
            {isAlert && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded"
                title={`คะแนนเฉลี่ยต่ำกว่าเกณฑ์ (${alertThreshold})`}
              >
                <AlertCircle className="w-3 h-3" />
                ควรปรับปรุง
              </span>
            )}
          </div>
          {count > 0 && (
            <p className="text-[11px] text-gray-500 mt-0.5 flex gap-2">
              <span>SD: {stdDev.toFixed(2)}</span>
              <span>Median: {median.toFixed(1)}</span>
              <span className="text-emerald-600">Top-box: {topBoxRate.toFixed(1)}%</span>
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-gray-800">
            {count ? average.toFixed(2) : "—"}
          </span>
          <span className="text-xs text-gray-400 ml-1">({count})</span>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(average)} print:!border print:!border-gray-300`}
          style={{ width: `${pct}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        />
      </div>

      {count > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {distribution.map((n, i) => (
                <span key={i} className="text-[11px] text-gray-400">
                  {i + 1}:<span className="text-gray-600 font-medium">{n}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {showChart && (
                <button
                  onClick={handleDownloadGraph}
                  disabled={isDownloading}
                  className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-800 transition-colors font-medium bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded border border-gray-200 disabled:opacity-50"
                  title="ดาวน์โหลดกราฟเป็นรูปภาพ"
                >
                  <Download className="w-3 h-3" />
                  {isDownloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดรูป"}
                </button>
              )}
              <button
                onClick={() => setShowChart(!showChart)}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
              >
                <BarChart2 className="w-3 h-3" />
                {showChart ? "ซ่อนกราฟ" : "ดูกราฟแจกแจง"}
              </button>
            </div>
          </div>
          
          <div className={`mt-3 p-4 bg-white border border-gray-200 rounded-xl break-inside-avoid shadow-sm ${showChart ? 'block animate-in fade-in slide-in-from-top-2' : 'hidden print:block'}`}>
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-800 mb-1">{label}</h4>
              <p className="text-xs text-gray-500">การกระจายตัวของคะแนน</p>
            </div>
            
            <div ref={chartRef} className="bg-white pt-2 pb-1 pr-2">
              <ScoreDistributionChart distribution={distribution} totalCount={count} />
            </div>
            
            {comments && comments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-bold text-gray-800 mb-2">ข้อเสนอแนะ:</h4>
                <ul className="list-disc pl-4 space-y-1.5">
                  {comments.map((c, i) => (
                    <li key={i} className="text-xs text-gray-700 whitespace-pre-wrap">
                      {c.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
