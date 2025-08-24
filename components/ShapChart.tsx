
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { ShapValue } from '../types';

interface ShapChartProps {
  data: ShapValue[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 p-2 border border-gray-700 rounded-md">
        <p className="label text-white">{`${label} : ${payload[0].value.toFixed(4)}`}</p>
      </div>
    );
  }
  return null;
};

const ShapChart: React.FC<ShapChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <XAxis type="number" stroke="#9ca3af" domain={[-1, 1]}/>
          <YAxis dataKey="feature" type="category" stroke="#9ca3af" width={120} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}/>
          <Bar dataKey="contribution" barSize={20}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.contribution > 0 ? '#ef4444' : '#22c55e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShapChart;
