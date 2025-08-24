import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Investigation, Threat } from '../types';
import { InvestigationStatus } from '../types';
import { investigationService } from '../services/investigationService';
import { RefreshIcon } from '../components/icons';

const statusColorMap: Record<InvestigationStatus, string> = {
  [InvestigationStatus.Open]: 'bg-blue-500/20 text-blue-400',
  [InvestigationStatus.InProgress]: 'bg-yellow-500/20 text-yellow-400',
  [InvestigationStatus.Closed]: 'bg-gray-500/20 text-gray-400',
};

const getThreatDescription = (threat: Threat) => {
    if ('attack_type' in threat) { // Alert
        return `${threat.attack_type} from ${threat.src_ip}`;
    }
    if ('riskLevel' in threat) { // BehavioralData
        return `Behavioral Anomaly (${threat.riskLevel} Risk)`;
    }
    if (threat.type === 'ThreatHuntResult') { // ThreatHuntResult
        return `Threat Hunt: "${threat.name}"`;
    }
    return 'Unknown Threat Type';
};

const InvestigationListPage: React.FC = () => {
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvestigations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await investigationService.getInvestigations();
            setInvestigations(data);
        } catch (e) {
            console.error("Failed to fetch investigations:", e);
            setError("Could not load investigations. Data might be corrupted or there was a loading error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvestigations();
    }, [fetchInvestigations]);

    const sortedInvestigations = useMemo(() => {
        return [...investigations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [investigations]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Security Investigations</h1>
                <button
                    onClick={fetchInvestigations}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshIcon className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>
            {error && (
                <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative my-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div className="content-panel overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-700/50">
                            <tr className="border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="px-5 py-3">Case ID</th>
                                <th className="px-5 py-3">Primary Threat</th>
                                <th className="px-5 py-3">Lead Analyst</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Date Opened</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading investigations...</td></tr>
                            ) : sortedInvestigations.length > 0 ? (
                                sortedInvestigations.map((inv) => (
                                    <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                                        <td className="px-5 py-4 text-sm">
                                            <Link to={`/investigation/${inv.id}`} className="text-blue-400 hover:underline font-mono">
                                                {inv.id}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300">{getThreatDescription(inv.primaryThreat)}</td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">{inv.team[0]?.email || 'N/A'}</td>
                                        <td className="px-5 py-4 text-sm">
                                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${statusColorMap[inv.status]}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300">{new Date(inv.startTime).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No investigations found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvestigationListPage;