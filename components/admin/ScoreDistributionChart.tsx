import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

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
  ].map(d => {
    const pct = totalCount > 0 ? (d.count / totalCount) * 100 : 0;
    const pctStr = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
    return {
      ...d,
      label: `${d.count} (${pctStr}%)`,
    };
  });

  const renderChart = (isPrint: boolean) => (
    <BarChart
      data={data}
      margin={{ top: 20, right: 5, left: -25, bottom: 0 }}
      width={isPrint ? 600 : undefined}
      height={isPrint ? 160 : undefined}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
      {!isPrint && (
        <Tooltip 
          cursor={{ fill: '#f3f4f6' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value ?? 0} คน`, 'จำนวน']}
          labelFormatter={(label) => `ให้ ${label} คะแนน`}
        />
      )}
      <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={50} isAnimationActive={false}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
        <LabelList dataKey="label" position="top" style={{ fill: '#374151', fontSize: '10px', fontWeight: 600 }} />
      </Bar>
    </BarChart>
  );

  return (
    <>
      <div className="h-40 w-full mt-2 print:hidden">
        <ResponsiveContainer width="99%" height="100%">
          {renderChart(false)}
        </ResponsiveContainer>
      </div>
      
      {/* 
        For printing, ResponsiveContainer often fails because the resize observer doesn't fire 
        or browser halts JS execution. Rendering a statically sized chart that is ALWAYS in the DOM
        (just visually hidden on screen) guarantees it appears in the PDF.
      */}
      <div className="absolute opacity-0 pointer-events-none -z-10 print:static print:opacity-100 print:pointer-events-auto print:z-auto print:flex justify-center w-full h-[160px] mt-2 mb-4">
        {renderChart(true)}
      </div>
    </>
  );
}
