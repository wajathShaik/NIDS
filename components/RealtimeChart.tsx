import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Alert } from '../types';
import { AttackType } from '../types';

interface RealtimeChartProps {
    alerts: Alert[];
    loading: boolean;
}

const ChartSkeleton: React.FC = () => (
    <div className="w-full h-80 bg-gray-700 animate-pulse rounded-lg"></div>
);

const attackTypeColors: { [key in AttackType]?: { stroke: string; id: string } } = {
    [AttackType.DoS]: { stroke: '#ef4444', id: 'colorDoS' },
    [AttackType.DDoS]: { stroke: '#f97316', id: 'colorDDoS' },
    [AttackType.PortScan]: { stroke: '#eab308', id: 'colorPortScan' },
    [AttackType.WebAttack]: { stroke: '#ec4899', id: 'colorWebAttack' },
    [AttackType.Infiltration]: { stroke: '#8b5cf6', id: 'colorInfiltration' },
    [AttackType.Bot]: { stroke: '#6366f1', id: 'colorBot' },
};

const RealtimeChart: React.FC<RealtimeChartProps> = ({ alerts, loading }) => {
    
    const chartData = useMemo(() => {
        if (!alerts || alerts.length === 0) return [];

        const sortedAlerts = [...alerts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const dataMap = new Map<string, any>();

        sortedAlerts.forEach(alert => {
            const date = new Date(alert.timestamp);
            const timeKey = `${date.getHours().toString().padStart(2, '0')}:${(Math.floor(date.getMinutes()/15)*15).toString().padStart(2, '0')}`;
            
            if (!dataMap.has(timeKey)) {
                const initialEntry: { [key: string]: any } = { time: timeKey };
                Object.values(AttackType).forEach(type => {
                    initialEntry[type] = 0;
                });
                dataMap.set(timeKey, initialEntry);
            }

            const entry = dataMap.get(timeKey);
            if (entry && Object.values(AttackType).includes(alert.attack_type)) {
                entry[alert.attack_type] = (entry[alert.attack_type] || 0) + 1;
            }
        });
        
        return Array.from(dataMap.values());
    }, [alerts]);

    if (loading) {
        return <ChartSkeleton />;
    }

    return (
        <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        {Object.entries(attackTypeColors).map(([key, value]) => (
                            <linearGradient key={value.id} id={value.id} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={value.stroke} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={value.stroke} stopOpacity={0}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <Tooltip contentStyle={{ backgroundColor: '#1b2537', border: '1px solid #2a3a53' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                    {Object.entries(attackTypeColors).map(([key, value]) => (
                         <Area key={key} type="monotone" dataKey={key} stroke={value.stroke} fillOpacity={1} fill={`url(#${value.id})`} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RealtimeChart;