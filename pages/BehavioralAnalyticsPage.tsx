import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BehavioralData } from '../types';
import { generateBehavioralData } from '../services/geminiService';
import { investigationService } from '../services/investigationService';
import { useAuth } from '../hooks/useAuth';
import { RefreshIcon, BrainCircuitIcon } from '../components/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';


const riskColorMap: Record<BehavioralData['riskLevel'], { text: string; bg: string; }> = {
    Critical: { text: 'text-red-400', bg: 'bg-red-500/20' },
    High: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
    Medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    Low: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
};

const BehavioralAnalyticsPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<BehavioralData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const behavioralData = await generateBehavioralData();
            setData(behavioralData);
        } catch (err) {
            setError("Failed to load behavioral analytics data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStartInvestigation = async (threat: BehavioralData) => {
        if (!currentUser) return;
        try {
            const newInvestigation = await investigationService.createInvestigation(threat, currentUser);
            navigate(`/investigation/${newInvestigation.id}`);
        } catch (error) {
            console.error("Failed to start investigation from behavioral threat:", error);
            setError("Could not create an investigation case.");
        }
    };

    const chartData = useMemo(() => {
        const counts = data.reduce((acc, user) => {
            acc[user.riskLevel] = (acc[user.riskLevel] || 0) + 1;
            return acc;
        }, {} as Record<BehavioralData['riskLevel'], number>);
        
        return [
            { name: 'Low', count: counts.Low || 0, fill: '#60a5fa' },
            { name: 'Medium', count: counts.Medium || 0, fill: '#facc15' },
            { name: 'High', count: counts.High || 0, fill: '#fb923c' },
            { name: 'Critical', count: counts.Critical || 0, fill: '#f87171' },
        ];
    }, [data]);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Behavioral Analytics Engine</h1>
                <button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <RefreshIcon className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </div>
             <p className="text-gray-400 mb-8 max-w-3xl">
                This module analyzes user and entity behavior to identify anomalies and potential insider threats. The AI establishes a baseline for each user and flags deviations in real-time.
            </p>

            {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 <div className="lg:col-span-1 content-panel p-6">
                     <h2 className="text-xl font-semibold text-white mb-4">Risk Level Distribution</h2>
                     <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                             <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={60} />
                                <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.1)'}} contentStyle={{ backgroundColor: '#1b2537', border: '1px solid #2a3a53' }} />
                                <Bar dataKey="count" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-2 content-panel p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Insider Threat Spotlight</h2>
                    {loading ? <p>Loading...</p> : 
                    data.filter(u => u.riskLevel === 'Critical' || u.riskLevel === 'High').slice(0, 3).map(user => (
                        <div key={user.id} className={`p-3 rounded-lg mb-3 ${riskColorMap[user.riskLevel].bg}`}>
                            <p className={`font-bold ${riskColorMap[user.riskLevel].text}`}>{user.riskLevel} Risk: {user.userEmail}</p>
                            <p className="text-sm text-gray-300">Anomalies: {user.anomalies.join(', ')}</p>
                        </div>
                    ))
                    }
                </div>
            </div>

            <div className="content-panel overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-700/50">
                            <tr className="border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Behavioral Score</th>
                                <th className="px-5 py-3">Risk Level</th>
                                <th className="px-5 py-3">Detected Anomalies</th>
                                <th className="px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="p-4"><div className="h-6 bg-gray-700 rounded"></div></td></tr>
                                ))
                            ) : data.map(user => (
                                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-5 py-4 font-mono text-sm text-gray-300">{user.userEmail}</td>
                                    <td className="px-5 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs">Baseline: {user.baselineScore}</span>
                                            <progress max="100" value={user.currentScore} className="w-24 h-2 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-bar]:bg-gray-600 [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-value]:bg-red-500"></progress>
                                            <span className="font-bold text-white">{user.currentScore}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`px-3 py-1 font-semibold leading-tight rounded-full ${riskColorMap[user.riskLevel].bg} ${riskColorMap[user.riskLevel].text}`}>
                                            {user.riskLevel}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-300">{user.anomalies.join(', ')}</td>
                                    <td className="px-5 py-4 text-sm">
                                        {user.riskLevel === 'High' || user.riskLevel === 'Critical' ? (
                                             <button
                                                onClick={() => handleStartInvestigation(user)}
                                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 text-xs rounded-lg transition"
                                            >
                                                Investigate
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BehavioralAnalyticsPage;