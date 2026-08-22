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
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
      {/* Chart container */}
      <div className="w-full md:w-1/2 h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
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
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-sm font-semibold tracking-wide text-[var(--text-tertiary)] uppercase">
            Total
          </span>
          <span className="text-3xl font-extrabold text-[var(--text-primary)]">
            {total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full md:w-1/2 space-y-3.5">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 mb-2">
          Segment Details
        </h4>
        {data.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-all"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {entry.name}
              </span>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {entry.value}
              </span>
              <span className="text-xs text-[var(--text-secondary)] bg-[var(--border-color)] px-2 py-0.5 rounded font-medium min-w-[50px] inline-block">
                {entry.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
