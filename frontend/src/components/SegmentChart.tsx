import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SegmentData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface SegmentChartProps {
  data: SegmentData[];
}

export const SegmentChart: React.FC<SegmentChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        No segment distribution data available.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3 overflow-hidden py-1 md:flex-row">
      {/* Chart container */}
      <div className=" relative flex h-full min-h-0 w-full items-center justify-center md:w-[48%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={56}
              paddingAngle={3}
              dataKey="value"
              stroke="var(--bg-secondary)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Total
          </span>
          <span className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
            {total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full min-w-0 space-y-0.5 md:w-[52%]">
        <h4 className="mb-1 border-b border-[var(--border-color)] pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          Segment Details
        </h4>
        {data.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--bg-primary)]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="truncate text-[10px] font-medium text-[var(--text-primary)]">
                {entry.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-right">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {entry.value.toLocaleString()}
              </span>
              <span className="inline-block min-w-[42px] rounded bg-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                {entry.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
