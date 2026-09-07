import React from 'react';

export interface BarData {
  label: string;
  value: number;
}

interface BarSeriesProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
}

export function BarSeries({ data, maxValue = 5, height = 120 }: BarSeriesProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex items-end gap-1.5" style={{ height: `${height}px` }}>
      {data.map((item, i) => {
        const h = Math.max((item.value / maxValue) * 100, 2); // At least 2% height so it's visible
        const isCurrent = i === data.length - 1; // Highlight the last one (current batch)
        
        return (
          <div key={i} className="relative flex-1 flex flex-col items-center justify-end group h-full">
            <div 
              className={`w-full rounded-t-sm transition-all duration-300 ${isCurrent ? 'bg-blue-500' : 'bg-gray-200 hover:bg-gray-300'}`}
              style={{ height: `${h}%` }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                {item.value.toFixed(2)}
              </div>
            </div>
            <div 
              className={`text-[9px] mt-1 truncate w-full text-center ${isCurrent ? 'text-gray-800 font-bold' : 'text-gray-400'}`} 
              title={item.label}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
