import React from 'react';

export interface TimelineData {
  date: string;
  count: number;
}

interface TimelineChartProps {
  data: TimelineData[];
  height?: number;
}

export function TimelineChart({ data, height = 100 }: TimelineChartProps) {
  if (!data || data.length === 0) return null;
  
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
      {data.map((item, i) => {
        const h = Math.max((item.count / maxCount) * 100, 2); 
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full relative">
            <div 
              className="w-full bg-blue-300 rounded-t-sm transition-all hover:bg-blue-500"
              style={{ height: `${h}%` }}
            />
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
              {item.date}: {item.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
