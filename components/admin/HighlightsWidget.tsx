import { TrendingUp, TrendingDown } from "lucide-react";
import type { ScoreStat, InstructorStat } from "@/lib/analytics";

interface HighlightsWidgetProps {
  form1Scores: ScoreStat[];
  form2Stats: InstructorStat[];
}

export function HighlightsWidget({ form1Scores, form2Stats }: HighlightsWidgetProps) {
  // Combine all items to find top/bottom
  const allItems = [
    ...form1Scores.filter(s => s.count >= 3).map(s => ({ type: 'หัวข้อการเรียน', name: s.label, avg: s.average, count: s.count })),
    ...form2Stats.filter(s => s.scores.some(q => q.count >= 3)).map(s => ({ type: 'อาจารย์แพทย์', name: s.name, avg: s.overallAverage, count: s.scores.reduce((sum, q) => sum + q.count, 0) }))
  ];

  if (allItems.length === 0) return null;

  // Sort by average score
  allItems.sort((a, b) => b.avg - a.avg);

  const top3 = allItems.slice(0, 3);
  const bottom3 = [...allItems].reverse().slice(0, 3);

  // If there aren't many items, avoid showing the same items in top and bottom
  const bottom3Filtered = bottom3.filter(b => !top3.some(t => t.name === b.name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Top 3 */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-emerald-900">คะแนนสูงสุด 3 อันดับแรก</h3>
        </div>
        <div className="space-y-3">
          {top3.map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-emerald-100">
              <div>
                <p className="text-xs font-semibold text-emerald-900 line-clamp-1" title={item.name}>{item.name}</p>
                <p className="text-[10px] text-emerald-700">{item.type}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-emerald-700">{item.avg.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {top3.length === 0 && <p className="text-sm text-emerald-600">ยังไม่มีข้อมูลเพียงพอ</p>}
        </div>
      </div>

      {/* Bottom 3 */}
      <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl border border-rose-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-rose-500 p-1.5 rounded-lg">
            <TrendingDown className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-rose-900">จุดที่ควรปรับปรุง</h3>
        </div>
        <div className="space-y-3">
          {bottom3Filtered.map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-rose-100">
              <div>
                <p className="text-xs font-semibold text-rose-900 line-clamp-1" title={item.name}>{item.name}</p>
                <p className="text-[10px] text-rose-700">{item.type}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-rose-700">{item.avg.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {bottom3Filtered.length === 0 && <p className="text-sm text-rose-600">ยังไม่มีข้อมูลเพียงพอ</p>}
        </div>
      </div>
    </div>
  );
}
