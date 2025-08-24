

import React, { useState, useEffect } from 'react';
import type { Alert, XAIExplanation } from '../types';
import { Severity, AttackType } from '../types';
import { generateSearchSummary, generateExplanation } from '../services/geminiService';
import AlertsTable from './AlertsTable';
import RealtimeChart from './RealtimeChart';
import ExplanationModal from './ExplanationModal';

interface SearchResultsTabsProps {
    results: Alert[];
    query: string;
    loading: boolean;
}

const SearchResultsTabs: React.FC<SearchResultsTabsProps> = ({ results, query, loading }) => {
    const [activeTab, setActiveTab] = useState('Events');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [summaryGenerated, setSummaryGenerated] = useState(false);

    // State for Explanation Modal
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [explanation, setExplanation] = useState<XAIExplanation | null>(null);
    const [explanationLoading, setExplanationLoading] = useState<boolean>(false);

    const handleGenerateSummary = async () => {
        setIsAiLoading(true);
        setAiSummary(null);
        // Take a sample of up to 50 results to keep the prompt manageable
        const resultsSample = results.slice(0, 50);
        const summary = await generateSearchSummary(query, resultsSample);
        setAiSummary(summary);
        setIsAiLoading(false);
        setSummaryGenerated(true); // Mark as generated for manual clicks too
    };
    
    // Reset summary status when query changes
    useEffect(() => {
        setSummaryGenerated(false);
        setAiSummary(null);
    }, [query]);

    // Auto-generate summary for new, significant search results
    useEffect(() => {
        if (!loading && results.length > 5 && !summaryGenerated && !isAiLoading) {
            handleGenerateSummary();
        }
    }, [results, loading, summaryGenerated, isAiLoading, handleGenerateSummary]);


    const handleViewExplanation = async (alert: Alert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
        setExplanation(null);
        setExplanationLoading(true);
        try {
            const expl = await generateExplanation(alert);
            setExplanation(expl);
        } catch (error) {
            console.error("Failed to generate explanation:", error);
        } finally {
            setExplanationLoading(false);
        }
    };


    const stats = React.useMemo(() => {
        const topAttackTypes = new Map<AttackType, number>();
        const topSeverities = new Map<Severity, number>();
        const topSrcIps = new Map<string, number>();
        const topDstIps = new Map<string, number>();

        results.forEach(r => {
            topAttackTypes.set(r.attack_type, (topAttackTypes.get(r.attack_type) || 0) + 1);
            topSeverities.set(r.severity, (topSeverities.get(r.severity) || 0) + 1);
            topSrcIps.set(r.src_ip, (topSrcIps.get(r.src_ip) || 0) + 1);
            topDstIps.set(r.dst_ip, (topDstIps.get(r.dst_ip) || 0) + 1);
        });
        
        const sortAndSlice = (map: Map<any, number>) => Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0,5);

        return {
            attackTypes: sortAndSlice(topAttackTypes),
            severities: sortAndSlice(topSeverities),
            srcIps: sortAndSlice(topSrcIps),
            dstIps: sortAndSlice(topDstIps),
        }
    }, [results]);

    const tabs = ['Events', 'Statistics', 'Visualizations'];

    return (
        <>
            <div className="holographic-card rounded-xl">
                <div className="px-6 pt-4 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                     <button
                        onClick={handleGenerateSummary}
                        disabled={isAiLoading || loading || results.length === 0}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 text-xs rounded-lg transition duration-300 ease-in-out flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={summaryGenerated ? "Re-generate AI Summary" : "Generate AI Summary"}
                    >
                        {isAiLoading ? 'Analyzing...' : 'Generate AI Summary'}
                    </button>
                </div>
                
                 {(isAiLoading || aiSummary) && (
                    <div className="p-6 border-b border-gray-700">
                        {isAiLoading && <div className="text-gray-400 animate-pulse">Generating AI-powered summary...</div>}
                        {aiSummary && (
                             <div className="prose prose-invert prose-sm max-w-none p-4 bg-gray-900/70 rounded-lg border border-gray-600">
                                 <div dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }}></div>
                             </div>
                        )}
                    </div>
                )}

                <div className="p-0 sm:p-6">
                    {activeTab === 'Events' && (
                        <AlertsTable alerts={results} loading={loading} onViewExplanation={handleViewExplanation} />
                    )}
                    {activeTab === 'Statistics' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <StatList title="Top Attack Types" data={stats.attackTypes} />
                             <StatList title="Top Severities" data={stats.severities} />
                             <StatList title="Top Source IPs" data={stats.srcIps} />
                             <StatList title="Top Destination IPs" data={stats.dstIps} />
                         </div>
                    )}
                    {activeTab === 'Visualizations' && (
                        <RealtimeChart alerts={results} loading={loading} />
                    )}
                </div>
            </div>
            {selectedAlert && (
                <ExplanationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    alert={selectedAlert}
                    explanation={explanation}
                    loading={explanationLoading}
                />
            )}
        </>
    );
};

const StatList: React.FC<{title: string, data: [string, number][]}> = ({title, data}) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-md font-semibold text-white mb-3">{title}</h3>
        {data.length > 0 ? (
            <ul className="space-y-2 text-sm">
                {data.map(([item, count]) => (
                    <li key={item} className="flex justify-between items-center">
                        <span className="text-gray-300 font-mono truncate pr-4">{item}</span>
                        <span className="font-semibold text-blue-400">{count.toLocaleString()}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-400">No data available.</p>
        )}
    </div>
);

export default SearchResultsTabs;