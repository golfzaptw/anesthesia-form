interface ScoreBarProps {
  label: string;
  average: number;
  count: number;
  distribution: number[];
}

function barColor(avg: number): string {
  if (avg >= 4) return "bg-green-500";
  if (avg >= 3) return "bg-blue-500";
  if (avg >= 2) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreBar({ label, average, count, distribution }: ScoreBarProps) {
  const pct = (average / 5) * 100;

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-1.5">
        <p className="text-sm text-gray-700 leading-snug flex-1">{label}</p>
        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-gray-800">
            {count ? average.toFixed(2) : "—"}
          </span>
          <span className="text-xs text-gray-400 ml-1">({count})</span>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(average)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {count > 0 && (
        <div className="flex gap-2 mt-1.5">
          {distribution.map((n, i) => (
            <span key={i} className="text-[11px] text-gray-400">
              {i + 1}:<span className="text-gray-600 font-medium">{n}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
