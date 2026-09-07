import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreDistributionChartProps {
  distribution: number[]; // e.g., [count1, count2, count3, count4, count5]
  totalCount: number;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"]; // Red to Green

export function ScoreDistributionChart({ distribution, totalCount }: ScoreDistributionChartProps) {
  if (totalCount === 0) return <div className="text-sm text-gray-500 py-4">ยังไม่มีข้อมูลสำหรับกราฟนี้</div>;

  const data = [
    { name: "1", count: distribution[0] || 0, color: COLORS[0] },
    { name: "2", count: distribution[1] || 0, color: COLORS[1] },
    { name: "3", count: distribution[2] || 0, color: COLORS[2] },
    { name: "4", count: distribution[3] || 0, color: COLORS[3] },
    { name: "5", count: distribution[4] || 0, color: COLORS[4] },
  ];

  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            formatter={(value) => [`${value ?? 0} คน`, 'จำนวน']}
            labelFormatter={(label) => `ให้ ${label} คะแนน`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
