import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { penTestingService } from '../services/penTestingService';
import { investigationService } from '../services/investigationService';
import { logService, LogAction } from '../services/logService';
import { useAuth } from '../hooks/useAuth';
import type { ReconData, Vulnerability, ExploitScript, PenetrationTestResult } from '../types';
import { PentagonIcon } from '../components/icons';

type ActiveTab = 'Reconnaissance' | 'Vulnerability Scan' | 'Exploit Generation' | 'Report';

const severityColorMap: Record<Vulnerability['severity'], string> = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Informational: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const PenetrationTestingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('Reconnaissance');
    const [targetDomain, setTargetDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // State for each tab's results
    const [reconData, setReconData] = useState<ReconData | null>(null);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [exploitScripts, setExploitScripts] = useState<ExploitScript[]>([]);
    const [finalReport, setFinalReport] = useState<string>('');

    const handleStartRecon = async () => {
        if (!targetDomain) return;
        setIsLoading(true);
        setError(null);
        // Reset all data for a new scan
        setReconData(null);
        setVulnerabilities([]);
        setExploitScripts([]);
        setFinalReport('');
        try {
            const data = await penTestingService.runReconnaissance(targetDomain);
            setReconData(data);
            setActiveTab('Vulnerability Scan');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during reconnaissance.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanVulnerability = async (tech: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await penTestingService.scanVulnerabilities(tech);
            // Avoid duplicates
            setVulnerabilities(prev => {
                const existingCves = new Set(prev.map(v => v.cve_id));
                const newVulns = data.filter((v: Vulnerability) => !existingCves.has(v.cve_id));
                return [...prev, ...newVulns];
            });
        } catch (err: any) {
            setError(err.message || `Failed to scan ${tech}.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateExploit = async (vuln: Vulnerability) => {
        setIsLoading(true);
        setError(null);
         try {
            const script = await penTestingService.generateExploitScript(vuln);
            setExploitScripts(prev => [...prev.filter(s => s.cve_id !== vuln.cve_id), { cve_id: vuln.cve_id, script }]);
        } catch (err: any) {
            setError(err.message || `Failed to generate exploit for ${vuln.cve_id}.`);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGenerateReport = async () => {
        if (!reconData || vulnerabilities.length === 0) return;
         setIsLoading(true);
         setError(null);
         try {
             const report = await penTestingService.generatePentestReport(reconData, vulnerabilities, exploitScripts);
             setFinalReport(report);
             setActiveTab('Report');
         } catch (err: any) {
             setError(err.message || 'Failed to generate the report.');
         } finally {
             setIsLoading(false);
         }
    };

    const handleEscalate = async () => {
        if (!user || !reconData || !finalReport || !targetDomain) return;

        setIsLoading(true);
        setError(null);

        try {
            const pentestResult: PenetrationTestResult = {
                id: `pentest-${Date.now()}`,
                type: 'PenetrationTestResult',
                targetDomain,
                reconData,
                vulnerabilities,
                exploitScripts,
                finalReport,
                createdAt: new Date().toISOString()
            };
            
            const newInvestigation = await investigationService.createInvestigation(pentestResult, user);
            
            await logService.addLog({
                action: LogAction.PENTEST_ESCALATED,
                userEmail: user.email,
                userId: user.id,
                details: `Escalated pentest for ${targetDomain} to case ${newInvestigation.id}`
            });

            navigate(`/investigation/${newInvestigation.id}`);

        } catch (err: any) {
            setError(err.message || "Failed to escalate to an investigation.");
            setIsLoading(false);
        }
    };

    const TabButton: React.FC<{ tab: ActiveTab; children: React.ReactNode; disabled?: boolean; }> = ({ tab, children, disabled }) => (
        <button
            onClick={() => setActiveTab(tab)}
            disabled={disabled}
            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'} disabled:text-gray-600 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Penetration Testing Toolkit</h1>
            <div className="content-panel">
                 <div className="border-b border-gray-700 flex">
                    <TabButton tab="Reconnaissance">1. Reconnaissance</TabButton>
                    <TabButton tab="Vulnerability Scan" disabled={!reconData}>2. Vulnerability Scan</TabButton>
                    <TabButton tab="Exploit Generation" disabled={vulnerabilities.length === 0}>3. Exploit Generation</TabButton>
                    <TabButton tab="Report" disabled={!finalReport}>4. Report</TabButton>
                 </div>
                 <div className="p-6">
                    {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
                    
                    {activeTab === 'Reconnaissance' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Target Scoping</h2>
                            <p className="text-gray-400 mb-4 text-sm">Enter a domain to begin the simulated penetration test.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={targetDomain}
                                    onChange={(e) => setTargetDomain(e.target.value)}
                                    placeholder="e.g., example.com"
                                    className="w-full max-w-md bg-gray-900/50 text-white placeholder-gray-500 rounded-lg px-4 py-2 font-mono text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button onClick={handleStartRecon} disabled={isLoading || !targetDomain} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                    {isLoading ? 'Scanning...' : 'Start Scan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Vulnerability Scan' && reconData && (
                        <div>
                             <h2 className="text-xl font-semibold mb-4">Vulnerability Scanning</h2>
                             <p className="text-gray-400 mb-4 text-sm">Based on reconnaissance, the following technologies were identified. Click to scan for common vulnerabilities.</p>
                             <div className="flex flex-wrap gap-2 mb-6">
                                {reconData.technologies.map(tech => (
                                    <button key={tech.name} onClick={() => handleScanVulnerability(tech.name)} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm disabled:opacity-50">
                                        Scan {tech.name}
                                    </button>
                                ))}
                             </div>
                             {vulnerabilities.length > 0 && (
                                <table className="min-w-full leading-normal">
                                    <thead>
                                        <tr className="border-b-2 border-gray-700 bg-gray-700/50 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <th className="px-5 py-3">CVE ID</th><th className="px-5 py-3">Severity</th><th className="px-5 py-3">Description</th><th className="px-5 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vulnerabilities.map(v => (
                                            <tr key={v.cve_id} className="border-b border-gray-700">
                                                <td className="px-5 py-4 font-mono">{v.cve_id}</td>
                                                <td className="px-5 py-4"><span className={`px-2 py-1 text-xs rounded-full ${severityColorMap[v.severity]}`}>{v.severity}</span></td>
                                                <td className="px-5 py-4 text-sm">{v.description}</td>
                                                <td className="px-5 py-4"><button onClick={() => { setActiveTab('Exploit Generation'); handleGenerateExploit(v); }} className="text-blue-400 hover:underline text-sm">Generate Exploit</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             )}
                        </div>
                    )}
                    
                    {activeTab === 'Exploit Generation' && (
                        <div>
                             <h2 className="text-xl font-semibold mb-4">Conceptual Exploit Generation</h2>
                             <p className="text-gray-400 mb-4 text-sm">The AI has generated non-functional, educational scripts to demonstrate exploit logic.</p>
                             <div className="space-y-4">
                                {exploitScripts.map(e => (
                                    <div key={e.cve_id}>
                                        <h3 className="font-semibold font-mono text-blue-400">{e.cve_id}</h3>
                                        <pre className="bg-gray-900/70 p-4 rounded-lg mt-2 text-sm text-gray-300 overflow-x-auto"><code>{e.script}</code></pre>
                                    </div>
                                ))}
                                {vulnerabilities.length > 0 && exploitScripts.length === 0 && <p className="text-gray-500">Click "Generate Exploit" from the Vulnerability Scan tab to begin.</p>}
                             </div>
                             {vulnerabilities.length > 0 && <button onClick={handleGenerateReport} disabled={isLoading} className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Generate Final Report</button>}
                        </div>
                    )}
                    
                    {activeTab === 'Report' && (
                         <div>
                             <h2 className="text-xl font-semibold mb-4">Final Penetration Test Report</h2>
                             <div className="prose prose-invert max-w-none p-4 bg-gray-900/70 rounded-lg border border-gray-600">
                                 <div dangerouslySetInnerHTML={{ __html: finalReport.replace(/\n/g, '<br />') }}></div>
                             </div>
                             <button onClick={handleEscalate} disabled={isLoading} className="mt-6 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                {isLoading ? 'Escalating...' : 'Escalate to Investigation'}
                             </button>
                        </div>
                    )}

                    {isLoading && activeTab !== 'Reconnaissance' && <div className="text-center mt-4 text-blue-400 animate-pulse">AI is working...</div>}
                 </div>
            </div>
        </div>
    )
}

export default PenetrationTestingPage;