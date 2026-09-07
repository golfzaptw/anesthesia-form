import React from 'react';

interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color = "#3b82f6", width = 80, height = 24 }: SparkLineProps) {
  if (!data || data.length < 2) return (
    <div style={{ width, height }} className="flex items-center justify-center">
      <span className="text-[10px] text-gray-300">-</span>
    </div>
  );

  // We want to avoid flat lines if max === min
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; 
  const padding = 4; // padding so points don't clip

  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * drawWidth;
    const y = padding + drawHeight - ((val - min) / range) * drawHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * drawWidth;
        const y = padding + drawHeight - ((val - min) / range) * drawHeight;
        return <circle key={i} cx={x} cy={y} r="1.5" fill={i === data.length - 1 ? color : "transparent"} />;
      })}
    </svg>
  );
}
