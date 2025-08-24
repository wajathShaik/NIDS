
import React, { useState } from 'react';
import { virtualSocService } from '../services/virtualSocService';
import { logService } from '../services/logService';
import { TerminalIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

const availableTools = [
    'Nmap',
    'Nessus',
    'Wireshark',
    'Burp Suite',
    'Metasploit',
    'John the Ripper',
];

const VirtualSocWorkbenchPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedTool, setSelectedTool] = useState(availableTools[0]);
    const [target, setTarget] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState('');
    const [ingestSuccessMessage, setIngestSuccessMessage] = useState('');

    const handleRunTool = async () => {
        if (!target) {
            setError('A target must be specified.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReport('');
        setIngestSuccessMessage('');
        try {
            const result = await virtualSocService.runVirtualTool(selectedTool, target);
            setReport(result);
        } catch (err: any) {
            setError(err.message || `An error occurred while running ${selectedTool}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIngestResults = async () => {
        if (!report) return;
        setIsIngesting(true);
        setError(null);
        setIngestSuccessMessage('');
        try {
            const newAlerts = await virtualSocService.parseReportToAlerts(report, selectedTool, target);
            if (newAlerts.length > 0) {
                await logService.addEvents(newAlerts);
                setIngestSuccessMessage(`${newAlerts.length} new alert(s) ingested successfully! You can find them in the Threat Center or via Search.`);
            } else {
                 setIngestSuccessMessage(`No new Critical or High severity alerts were found in the report to ingest.`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to ingest results.');
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Virtual SOC Workbench</h1>
            </div>
            <p className="text-gray-400 mb-8 max-w-3xl">
                Select an industry-standard tool, provide a target (e.g., an IP address or domain), and the AI will generate a simulated output as if the real tool were run. You can then ingest the findings as actionable alerts.
            </p>
            <div className="content-panel p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <label htmlFor="tool-select" className="sr-only">Select Tool</label>
                        <select
                            id="tool-select"
                            value={selectedTool}
                            onChange={e => setSelectedTool(e.target.value)}
                            className="w-full bg-gray-700/80 text-white font-semibold rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            {availableTools.map(tool => (
                                <option key={tool} value={tool}>{tool}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-grow w-full">
                         <label htmlFor="target-input" className="sr-only">Target</label>
                         <input
                            id="target-input"
                            type="text"
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                            placeholder="Enter Target IP or Domain (e.g., 192.168.1.1 or example.com)"
                            className="w-full bg-gray-900/50 text-white placeholder-gray-500 rounded-lg px-4 py-3 font-mono text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <button
                            onClick={handleRunTool}
                            disabled={isLoading || !target}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <TerminalIcon className="h-5 w-5" />
                            Run Simulation
                        </button>
                    </div>
                </div>

                 {error && <div className="mt-4 bg-red-900/50 text-red-300 p-3 rounded-lg text-sm">{error}</div>}
                 {ingestSuccessMessage && <div className="mt-4 bg-green-900/50 text-green-300 p-3 rounded-lg text-sm">{ingestSuccessMessage}</div>}
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Simulated Output</h2>
                    <button
                        onClick={handleIngestResults}
                        disabled={!report || isLoading || isIngesting}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
                    >
                        {isIngesting ? 'Ingesting...' : 'Ingest Results as Alerts'}
                    </button>
                </div>
                <div className="bg-gray-900 rounded-xl shadow-lg p-6 min-h-[50vh] font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto border border-gray-700">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                             <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-4 text-lg">AI is running the simulation...</p>
                                <p className="text-gray-500">This may take a moment.</p>
                             </div>
                        </div>
                    ) : report ? (
                        <code>{report}</code>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>Output will appear here after a simulation is run.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VirtualSocWorkbenchPage;