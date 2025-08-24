import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Threat, Alert, BehavioralData, ThreatHuntResult } from '../types';
import { logService } from '../services/logService';
import { generateBehavioralData } from '../services/geminiService';
import { investigationService } from '../services/investigationService';
import { useAuth } from '../hooks/useAuth';
import { RefreshIcon, ShieldIcon } from '../components/icons';

const getSeverityValue = (threat: Threat): number => {
    if ('severity' in threat) { // Alert
        switch (threat.severity) {
            case 'Critical': return 4;
            case 'High': return 3;
            case 'Medium': return 2;
            case 'Low': return 1;
            default: return 0;
        }
    }
    if ('riskLevel' in threat) { // BehavioralData
         switch (threat.riskLevel) {
            case 'Critical': return 4;
            case 'High': return 3;
            case 'Medium': return 2;
            case 'Low': return 1;
            default: return 0;
        }
    }
    // ThreatHuntResult or PenetrationTestResult
    return 3; // Assume escalated hunts are High severity
}

const ThreatItem: React.FC<{ threat: Threat, onInvestigate: (threat: Threat) => void, correlatedThreats: Threat[] }> = ({ threat, onInvestigate, correlatedThreats }) => {
    const getDetails = (t: Threat) => {
        const id = t.id;
        if ('attack_type' in t) { // Alert
            return {
                title: `${t.attack_type} Event`,
                subtitle: `${t.src_ip} -> ${t.dst_ip}`,
                severity: t.severity,
            };
        }
        if ('riskLevel' in t) { // BehavioralData
            return {
                title: `Behavioral Anomaly`,
                subtitle: `User: ${t.userEmail}`,
                severity: t.riskLevel,
            };
        }
        if (t.type === 'ThreatHuntResult') {
            return {
                title: `Threat Hunt: "${t.name}"`,
                subtitle: `Query: ${t.query}`,
                severity: 'High' as const,
            };
        }
        if (t.type === 'PenetrationTestResult') {
            return {
                title: `Pentest Result: ${t.targetDomain}`,
                subtitle: `${t.vulnerabilities.length} vulnerabilities found`,
                severity: 'High' as const,
            };
        }
        // This should be unreachable if Threat is exhaustive.
        return { title: 'Unknown Threat', subtitle: `ID: ${id}`, severity: 'Low' as const };
    };

    const { title, subtitle, severity } = getDetails(threat);
    const colorClass = severity === 'Critical' ? 'border-red-500' : severity === 'High' ? 'border-orange-500' : 'border-yellow-500';

    const hasCorrelation = correlatedThreats.length > 0;
    
    return (
        <div className={`bg-gray-800 p-4 rounded-lg border-l-4 ${colorClass} mb-4`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-white">{title}</p>
                    <p className="text-sm text-gray-400 font-mono">{subtitle}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {threat.id}</p>
                </div>
                <div className="text-right">
                    <span className="font-semibold text-white">{severity}</span>
                    <button
                        onClick={() => onInvestigate(threat)}
                        className="mt-2 block bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 text-xs rounded-lg transition"
                    >
                        Investigate
                    </button>
                </div>
            </div>
             {hasCorrelation && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">Correlated Threats:</p>
                    <ul className="text-xs text-gray-400 font-mono list-disc list-inside">
                        {correlatedThreats.map(c => (
                            <li key={c.id}>{getDetails(c).title} - {getDetails(c).subtitle}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const ThreatCenterPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [threats, setThreats] = useState<Threat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const highSevAlerts = (await logService.searchEvents('severity="Critical" OR severity="High"')).slice(0, 25);
            const highRiskUsers = (await generateBehavioralData(50)).filter(
                d => d.riskLevel === 'Critical' || d.riskLevel === 'High'
            ).slice(0, 25);
            
            const combinedThreats = [...highSevAlerts, ...highRiskUsers];
            combinedThreats.sort((a, b) => getSeverityValue(b) - getSeverityValue(a));
            
            setThreats(combinedThreats);
        } catch (error) {
            console.error("Failed to fetch threats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInvestigate = async (threat: Threat) => {
        if (!user) return;
        const newInvestigation = await investigationService.createInvestigation(threat, user);
        navigate(`/investigation/${newInvestigation.id}`);
    };
    
    // Type-safe correlation logic simulation
    const getCorrelatedThreats = (primaryThreat: Threat, allThreats: Threat[]): Threat[] => {
        if (allThreats.length < 2) return [];

        // Correlate alerts by source IP
        if ('src_ip' in primaryThreat) {
            return allThreats.filter(other =>
                other.id !== primaryThreat.id &&
                'src_ip' in other &&
                other.src_ip === primaryThreat.src_ip
            ).slice(0, 3);
        }

        // Correlate behavioral threats by user email
        if ('userEmail' in primaryThreat) {
            return allThreats.filter(other =>
                other.id !== primaryThreat.id &&
                'userEmail' in other &&
                other.userEmail === primaryThreat.userEmail
            ).slice(0, 3);
        }
        
        return []; // No correlation for other threat types for now
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Threat Center</h1>
                <button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <RefreshIcon className={loading ? 'animate-spin' : ''} />
                    Refresh Feed
                </button>
            </div>
            <p className="text-gray-400 mb-8 max-w-3xl">
                A unified feed of high-priority network alerts and behavioral anomalies. The system automatically correlates related events to provide context for faster triage and investigation.
            </p>

            {loading ? (
                 <div>Loading threats...</div>
            ) : (
                <div>
                    {threats.map(threat => (
                        <ThreatItem 
                            key={threat.id} 
                            threat={threat} 
                            onInvestigate={handleInvestigate} 
                            correlatedThreats={getCorrelatedThreats(threat, threats)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThreatCenterPage;