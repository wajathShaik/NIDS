

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: 'red' | 'blue' | 'green' | 'yellow';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue', onClick }) => {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  const cardClasses = `bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div>
        <p className="text-sm font-medium text-gray-400 uppercase">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
