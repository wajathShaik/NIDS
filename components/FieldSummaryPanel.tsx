
import React, { useMemo } from 'react';
import type { Alert } from '../types';

interface FieldSummaryPanelProps {
    results: Alert[];
    loading: boolean;
    onFieldSelect: (field: keyof Alert, value: string) => void;
}

const FieldSummaryPanel: React.FC<FieldSummaryPanelProps> = ({ results, loading, onFieldSelect }) => {
    
    const fieldSummaries = useMemo(() => {
        if (results.length === 0) {
            return { severity: [], attack_type: [], src_ip: [], dst_ip: [] };
        }

        const countAndSort = (field: keyof Alert) => {
            const counts = new Map<string, number>();
            results.forEach(r => {
                const value = r[field];
                if (value) {
                    counts.set(String(value), (counts.get(String(value)) || 0) + 1);
                }
            });
            return Array.from(counts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 7);
        };
        
        return {
            severity: countAndSort('severity'),
            attack_type: countAndSort('attack_type'),
            src_ip: countAndSort('src_ip'),
            dst_ip: countAndSort('dst_ip')
        };
    }, [results]);

    if (loading) {
        return (
             <div className="holographic-card p-4 animate-pulse">
                 <div className="h-5 bg-gray-700/50 rounded w-1/2 mb-4"></div>
                 <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
                 <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                 <div className="h-4 bg-gray-700/50 rounded w-5/6 mb-4"></div>
                  <div className="h-5 bg-gray-700/50 rounded w-1/3 mb-4"></div>
                 <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
                 <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
             </div>
        )
    }

    return (
        <div className="holographic-card p-4 rounded-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Interesting Fields</h2>
            <div className="space-y-4">
                <FieldSection title="Severity" data={fieldSummaries.severity} onSelect={(value) => onFieldSelect('severity', value)} />
                <FieldSection title="Attack Type" data={fieldSummaries.attack_type} onSelect={(value) => onFieldSelect('attack_type', value)} />
                <FieldSection title="Source IP" data={fieldSummaries.src_ip} onSelect={(value) => onFieldSelect('src_ip', value)} />
                <FieldSection title="Destination IP" data={fieldSummaries.dst_ip} onSelect={(value) => onFieldSelect('dst_ip', value)} />
            </div>
        </div>
    );
};

interface FieldSectionProps {
    title: string;
    data: [string, number][];
    onSelect: (value: string) => void;
}

const FieldSection: React.FC<FieldSectionProps> = ({ title, data, onSelect }) => {
    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            {data.length > 0 ? (
                <ul className="mt-2 text-sm space-y-1">
                    {data.map(([value, count]) => (
                        <li key={value} className="flex justify-between items-center group">
                             <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onSelect(value);
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:underline truncate pr-2"
                            >
                                {value}
                            </a>
                            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
                                {count.toLocaleString()}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 mt-2">No values found.</p>
            )}
        </div>
    );
};


export default FieldSummaryPanel;