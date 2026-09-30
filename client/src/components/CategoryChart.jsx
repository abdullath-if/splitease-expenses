import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, categoryMeta } from '../utils/formatters';

const DEFAULT_COLORS = [
  '#f59e0b',
  '#0284c7',
  '#9333ea',
  '#ec4899',
  '#10b981',
  '#84cc16',
  '#6366f1',
  '#64748b',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-200">{data.name}</p>
        <p className="font-bold text-emerald-400">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
        <p>No category spending data yet</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => {
              const meta = categoryMeta[entry.name];
              const color = meta ? meta.color : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-600 font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;