import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Threat, Alert, BehavioralData, ThreatHuntResult } from '../types';
import { logService } from '../services/logService';
import { generateBehavioralData } from '../services/geminiService';

const getSeverityValue = (threat: Threat): number => {
    if ('severity' in threat) { // Is an Alert
        return threat.severity === 'Critical' ? 4 : 3;
    }
    if ('riskLevel' in threat) { // Is BehavioralData
        return threat.riskLevel === 'Critical' ? 4 : 3;
    }
    // Is ThreatHuntResult or PenetrationTestResult
    return 3; // Assume high
}

const getThreatDetails = (threat: Threat) => {
    const id = threat.id;
    if ('attack_type' in threat) { // Alert
        return {
            title: threat.attack_type,
            subtitle: threat.src_ip,
            severity: threat.severity
        };
    }
    if ('riskLevel' in threat) { // Behavioral
        return {
            title: 'Behavioral Anomaly',
            subtitle: threat.userEmail,
            severity: threat.riskLevel
        };
    }
    if (threat.type === 'ThreatHuntResult') {
        return {
            title: threat.name,
            subtitle: threat.query,
            severity: 'High' as const
        };
    }
    if (threat.type === 'PenetrationTestResult') {
        return {
            title: `Pentest: ${threat.targetDomain}`,
            subtitle: `${threat.vulnerabilities.length} vulns found`,
            severity: 'High' as const
        };
    }
    // Fallback
    return {
        title: 'Unknown Threat',
        subtitle: `ID: ${id}`,
        severity: 'Low' as const
    };
};


const ThreatFeed: React.FC = () => {
    const navigate = useNavigate();
    const [threats, setThreats] = useState<Threat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchThreats = useCallback(async () => {
        try {
            const highSevAlerts = await logService.searchEvents('severity="Critical" OR severity="High"');
            const highRiskUsers = (await generateBehavioralData(20)).filter(
                d => d.riskLevel === 'Critical' || d.riskLevel === 'High'
            );

            const combinedThreats: Threat[] = [...highSevAlerts, ...highRiskUsers];
            combinedThreats.sort((a, b) => getSeverityValue(b) - getSeverityValue(a));
            
            setThreats(combinedThreats.slice(0, 5));
        } catch (error) {
            console.error("Failed to load threat feed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThreats(); // Fetch on initial load
        const interval = setInterval(fetchThreats, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, [fetchThreats]);

    const getThreatStyle = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
        return severity === 'Critical' 
            ? { bg: 'bg-red-500/10', border: 'border-red-500' }
            : { bg: 'bg-orange-500/10', border: 'border-orange-500' };
    };

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-700/50 rounded-lg"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {threats.map(threat => {
                const { title, subtitle, severity } = getThreatDetails(threat);
                const { bg, border } = getThreatStyle(severity);

                return (
                    <div 
                        key={threat.id}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-700/50 transition-colors ${bg} ${border}`}
                        onClick={() => navigate('/threat-center')}
                    >
                        <p className="font-semibold text-white text-sm">{title}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{subtitle}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default ThreatFeed;