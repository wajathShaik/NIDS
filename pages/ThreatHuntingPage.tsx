import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hunt, Alert, ThreatHuntResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { threatHuntService } from '../services/threatHuntService';
import { logService, LogAction } from '../services/logService';
import { investigationService } from '../services/investigationService';
import { translateNaturalLanguageToQuery } from '../services/geminiService';
import { SearchIcon, TrashIcon } from '../components/icons';

const ThreatHuntingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [hunts, setHunts] = useState<Hunt[]>([]);
    const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [huntName, setHuntName] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [query, setQuery] = useState('');
    const [findings, setFindings] = useState('');
    const [nlQuery, setNlQuery] = useState('');
    const [isAiTranslating, setIsAiTranslating] = useState(false);

    // Results state
    const [results, setResults] = useState<Alert[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchHunts = useCallback(async () => {
        setIsLoading(true);
        const data = await threatHuntService.getHunts();
        setHunts(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchHunts();
    }, [fetchHunts]);
    
    const clearForm = () => {
        setSelectedHunt(null);
        setHuntName('');
        setHypothesis('');
        setQuery('');
        setFindings('');
        setResults([]);
    };

    const handleSelectHunt = (hunt: Hunt) => {
        setSelectedHunt(hunt);
        setHuntName(hunt.name);
        setHypothesis(hunt.hypothesis);
        setQuery(hunt.query);
        setFindings(hunt.findings);
        setResults([]);
    };

    const handleSaveHunt = async () => {
        if (!huntName || !user) return;
        const huntToSave: Hunt = selectedHunt
            ? { ...selectedHunt, name: huntName, hypothesis, query, findings }
            : {
                id: `hunt-${Date.now()}`,
                name: huntName,
                hypothesis,
                query,
                findings,
                createdBy: user.email,
                createdAt: new Date().toISOString(),
            };
        
        await threatHuntService.saveHunt(huntToSave);
        await logService.addLog({ action: selectedHunt ? LogAction.HUNT_UPDATED : LogAction.HUNT_CREATED, userEmail: user.email, details: `Saved hunt: ${huntName}` });
        fetchHunts();
        handleSelectHunt(huntToSave);
    };

    const handleDeleteHunt = async () => {
        if (!selectedHunt || !user) return;
        if (window.confirm(`Are you sure you want to delete the hunt "${selectedHunt.name}"?`)) {
            await threatHuntService.deleteHunt(selectedHunt.id);
            await logService.addLog({ action: LogAction.HUNT_DELETED, userEmail: user.email, details: `Deleted hunt: ${selectedHunt.name}` });
            clearForm();
            fetchHunts();
        }
    };
    
    const handleTranslateNlq = async () => {
        if (!nlQuery) return;
        setIsAiTranslating(true);
        const translated = await translateNaturalLanguageToQuery(nlQuery);
        if (!translated.startsWith('error:')) {
            setQuery(translated);
        }
        setIsAiTranslating(false);
    };

    const handleRunQuery = async () => {
        if (!query) return;
        setIsSearching(true);
        const searchResults = await logService.searchEvents(query);
        setResults(searchResults);
        setIsSearching(false);
    };
    
    const handleEscalate = async () => {
        if (!selectedHunt || !user) return;
        const threat: ThreatHuntResult = {
            id: selectedHunt.id,
            type: 'ThreatHuntResult',
            name: selectedHunt.name,
            query: selectedHunt.query,
            findings: selectedHunt.findings,
            createdAt: new Date().toISOString()
        };
        const newInvestigation = await investigationService.createInvestigation(threat, user);
        await logService.addLog({ action: LogAction.HUNT_ESCALATED, userEmail: user.email, details: `Escalated hunt "${selectedHunt.name}" to case ${newInvestigation.id}` });
        navigate(`/investigation/${newInvestigation.id}`);
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Threat Hunting Workbench</h1>
            <div className="flex gap-6">
                {/* Left Panel: Notebook */}
                <div className="w-1/4 content-panel p-4">
                    <h2 className="text-lg font-semibold mb-2">Hunt Notebook</h2>
                    <button onClick={clearForm} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg mb-4 text-sm">
                        + New Hunt
                    </button>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {isLoading ? <p>Loading...</p> : hunts.map(hunt => (
                            <div key={hunt.id} onClick={() => handleSelectHunt(hunt)} className={`p-3 rounded-lg cursor-pointer ${selectedHunt?.id === hunt.id ? 'bg-blue-900/70' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                <p className="font-semibold truncate">{hunt.name}</p>
                                <p className="text-xs text-gray-400">By {hunt.createdBy}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Workbench */}
                <div className="w-3/4 content-panel p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <input type="text" value={huntName} onChange={e => setHuntName(e.target.value)} placeholder="Untitled Hunt" className="text-2xl font-bold bg-transparent border-b-2 border-gray-700 focus:border-blue-500 outline-none text-white flex-grow"/>
                        <div className="space-x-2">
                             {selectedHunt && <button onClick={handleDeleteHunt} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-sm">Delete</button>}
                            <button onClick={handleSaveHunt} disabled={!huntName} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50">Save Hunt</button>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold">Hypothesis</label>
                        <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={2} placeholder="e.g., An external actor is attempting to enumerate open SMB shares on internal servers." className="w-full bg-gray-700/50 mt-1 p-2 rounded-lg"/>
                    </div>

                    <div>
                        <label className="font-semibold">AI Query Helper</label>
                         <div className="flex gap-2 mt-1">
                            <input type="text" value={nlQuery} onChange={e => setNlQuery(e.target.value)} placeholder="Describe your goal, e.g., 'look for unusual outbound traffic after midnight'" className="w-full bg-gray-700/50 p-2 rounded-lg flex-grow"/>
                            <button onClick={handleTranslateNlq} disabled={isAiTranslating} className="bg-violet-500 hover:bg-violet-400 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50">{isAiTranslating ? '...' : 'Translate'}</button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-semibold">Query</label>
                        <div className="flex gap-2 mt-1">
                            <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} placeholder='attack_type="Port Scan" AND protocol="TCP"' className="w-full bg-gray-700/50 p-2 rounded-lg font-mono text-sm flex-grow"/>
                             <button onClick={handleRunQuery} disabled={isSearching || !query} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50 self-stretch flex items-center gap-2"><SearchIcon className="h-4 w-4"/> Run</button>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <h3 className="font-semibold text-sm mb-1">{isSearching ? 'Searching...' : `Results: ${results.length}`}</h3>
                        {results.length > 0 && (
                            <table className="w-full text-xs">
                                <thead><tr className="text-left text-gray-400"><th className="font-normal">Timestamp</th><th className="font-normal">Source IP</th><th className="font-normal">Destination IP</th><th className="font-normal">Attack Type</th></tr></thead>
                                <tbody>{results.slice(0, 100).map(r => <tr key={r.id} className="font-mono"><td>{new Date(r.timestamp).toLocaleTimeString()}</td><td>{r.src_ip}</td><td>{r.dst_ip}</td><td>{r.attack_type}</td></tr>)}</tbody>
                            </table>
                        )}
                    </div>
                     <div>
                        <label className="font-semibold">Findings</label>
                        <textarea value={findings} onChange={e => setFindings(e.target.value)} rows={4} placeholder="Summarize your findings here. What did the query results show? Does it confirm or deny the hypothesis?" className="w-full bg-gray-700/50 mt-1 p-2 rounded-lg"/>
                    </div>
                    
                    <div className="text-right">
                         <button onClick={handleEscalate} disabled={!selectedHunt || !findings} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Escalate to Investigation</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreatHuntingPage;