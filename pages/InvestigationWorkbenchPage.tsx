import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Investigation, InvestigationChecklist, Alert, LogEntry, User, TimelineEvent, EvidenceFile, Threat } from '../types';
import { InvestigationStatus, Role, UserStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { investigationService } from '../services/investigationService';
import { authService } from '../services/authService';
import { getInvestigationInsights, generateInvestigationReport } from '../services/geminiService';
import { RefreshIcon, TrashIcon, TimelineIcon, EvidenceIcon, ReportIcon, ClipboardListIcon } from '../components/icons';
import InvestigationTimeline from '../components/InvestigationTimeline';
import ReportModal from '../components/ReportModal';


const statusColorMap: Record<InvestigationStatus, string> = {
  [InvestigationStatus.Open]: 'bg-blue-500 text-white',
  [InvestigationStatus.InProgress]: 'bg-yellow-500 text-black',
  [InvestigationStatus.Closed]: 'bg-gray-500 text-white',
};

type ActiveTab = 'Overview' | 'Timeline' | 'Evidence' | 'Report';

const getThreatDescription = (threat: Threat) => {
    if ('attack_type' in threat) {
        return `Primary Alert: <strong class="text-white">${threat.attack_type}</strong> from <span class="font-mono">${threat.src_ip}</span>`;
    }
    if ('riskLevel' in threat) {
        return `Primary Threat: <strong class="text-white">Behavioral Anomaly</strong> for <span class="font-mono">${threat.userEmail}</span>`;
    }
    if (threat.type === 'ThreatHuntResult') {
        return `Source: <strong class="text-white">Threat Hunt</strong> - <span class="font-mono">"${threat.name}"</span>`;
    }
    return 'Unknown Threat Type';
};

// Sub-components moved outside for performance
const ChecklistSection: React.FC<{ checklist: InvestigationChecklist; onCheck: (category: keyof InvestigationChecklist, item: string, value: boolean) => void; }> = ({ checklist, onCheck }) => (
    <div className="space-y-3">
        {Object.entries(checklist).map(([category, items]) => (
            <div key={category}>
                <h3 className="font-semibold text-blue-400 capitalize">{category}</h3>
                <ul className="mt-2 space-y-2">
                    {Object.entries(items).map(([item, checked]) => (
                        <li key={item} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`${category}-${item}`}
                                checked={!!checked}
                                onChange={(e) => onCheck(category as keyof InvestigationChecklist, item, e.target.checked)}
                                className="h-4 w-4 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 rounded"
                            />
                            <label htmlFor={`${category}-${item}`} className="ml-2 text-sm text-gray-300 capitalize">
                                {item.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);

const TeamManager: React.FC<{team: Investigation['team'], availableAnalysts: User[], onAdd: () => void, onRemove: (id: string) => void, memberToAdd: string, setMemberToAdd: (val: string) => void}> = 
({ team, availableAnalysts, onAdd, onRemove, memberToAdd, setMemberToAdd }) => (
    <div>
        <div className="space-y-2 mb-4">
            {team.map(member => (
                <div key={member.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                    <span className="text-sm font-mono text-gray-300">{member.email}</span>
                    <button onClick={() => onRemove(member.id)} className="text-red-400 hover:text-red-300 disabled:opacity-50" disabled={team.length <= 1} title="Remove Member">
                        <TrashIcon />
                    </button>
                </div>
            ))}
        </div>
        <div className="flex gap-2">
            <select value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)} className="flex-grow bg-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Add member...</option>
                {availableAnalysts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
            </select>
            <button onClick={onAdd} disabled={!memberToAdd} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:opacity-50">Add</button>
        </div>
    </div>
);


const InvestigationWorkbenchPage: React.FC = () => {
    const { investigationId } = useParams<{ investigationId: string }>();
    const { user } = useAuth();
    const [investigation, setInvestigation] = useState<Investigation | null>(null);
    const [allAnalysts, setAllAnalysts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [activeTab, setActiveTab] = useState<ActiveTab>('Overview');

    // State for inputs
    const [notes, setNotes] = useState('');
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [memberToAdd, setMemberToAdd] = useState<string>('');
    const [timelineNote, setTimelineNote] = useState('');
    const [evidenceName, setEvidenceName] = useState('');
    const [evidenceType, setEvidenceType] = useState('log');

    // Reporting State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [isReportLoading, setIsReportLoading] = useState(false);

    const fetchInvestigationData = useCallback(async () => {
        if (!investigationId || !user) return;
        setLoading(true);
        try {
            const analystRoles = [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst];
            const [inv, allUsers] = await Promise.all([
                investigationService.getInvestigationById(investigationId),
                authService.getUsers(),
            ]);

            if (inv) {
                setInvestigation(inv);
                setNotes(inv.notes || '');
                const potentialAnalysts = allUsers.filter(u => u.status === UserStatus.Active && analystRoles.includes(u.role));
                setAllAnalysts(potentialAnalysts);
            } else {
                setError("Investigation not found.");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load investigation data.");
        } finally {
            setLoading(false);
        }
    }, [investigationId, user]);

    useEffect(() => {
        fetchInvestigationData();
    }, [fetchInvestigationData]);

    const handleUpdate = async (updates: Partial<Investigation>) => {
        if (!investigation || !user) return;
        const updatedInvestigation = await investigationService.updateInvestigation(investigation.id, updates, user);
        setInvestigation(updatedInvestigation);
        return updatedInvestigation;
    };

    const handleChecklistChange = async (category: keyof InvestigationChecklist, item: string, value: boolean) => {
        if (!investigation) return;

        // This is a safe way to update nested state without knowing the exact type of `item` at compile time
        const newCategoryState = { ...investigation.checklist[category], [item]: value };
        const updatedChecklist = { ...investigation.checklist, [category]: newCategoryState };
        
        const updates: Partial<Investigation> = { checklist: updatedChecklist };
        if (investigation.status === InvestigationStatus.Open) {
            updates.status = InvestigationStatus.InProgress;
        }
        handleUpdate(updates);
    };

    const handleSaveNotes = async () => {
        if (!investigation || notes === investigation.notes) return;
        await handleUpdate({ notes });
    };

    const handleStatusChange = async (newStatus: InvestigationStatus) => {
        if (!investigation) return;
        handleUpdate({ status: newStatus });
    };

    const handleAddMember = async () => {
        if (!memberToAdd || !investigation || !user) return;
        const member = allAnalysts.find(a => a.id === memberToAdd);
        if (member) {
            const updatedInv = await investigationService.addTeamMember(investigation.id, member, user);
            setInvestigation(updatedInv);
            setMemberToAdd('');
        }
    };
    
    const handleRemoveMember = async (memberId: string) => {
        if (!investigation || !user) return;
        try {
            const updatedInv = await investigationService.removeTeamMember(investigation.id, memberId, user);
            setInvestigation(updatedInv);
        } catch (err: any) {
            alert(err.message);
        }
    };
    
    const handleAddTimelineNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!timelineNote.trim() || !investigation || !user) return;
        const updatedInv = await investigationService.addTimelineEvent(investigation.id, {
            title: "Analyst Note",
            description: timelineNote,
            type: 'note',
        }, user);
        setInvestigation(updatedInv);
        setTimelineNote('');
    };

    const handleAddEvidence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evidenceName.trim() || !investigation || !user) return;
        const updatedInv = await investigationService.addEvidence(investigation.id, {
            name: evidenceName,
            type: evidenceType,
        }, user);
        setInvestigation(updatedInv);
        setEvidenceName('');
    };

     const handleAiQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim() || !investigation) return;

        setIsAiLoading(true);
        setAiResponse('');
        const context = `
            Based on the current investigation, answer the analyst's question concisely and in markdown format.
            Case ID: ${investigation.id}
            Status: ${investigation.status}
            Primary Threat Details: ${JSON.stringify(investigation.primaryThreat, null, 2)}
            Current Analyst Notes: "${investigation.notes}"
            Timeline Events Recorded: ${investigation.timeline.length}
            Evidence Files Logged: ${investigation.evidence.length}
            
            Analyst Question: "${aiQuery}"
        `;
        const response = await getInvestigationInsights(context);
        setAiResponse(response.replace(/\n/g, '<br />'));
        setIsAiLoading(false);
        setAiQuery('');
    };

    const handleGenerateReport = async () => {
        if (!investigation) return;
        setIsReportLoading(true);
        const report = await generateInvestigationReport(investigation);
        setReportContent(report);
        setIsReportLoading(false);
        setIsReportModalOpen(true);
    };

    const availableAnalystsToAdd = useMemo(() => {
        if (!investigation) return [];
        const teamIds = new Set(investigation.team.map(m => m.id));
        return allAnalysts.filter(a => !teamIds.has(a.id));
    }, [investigation, allAnalysts]);


    if (loading) return <div className="text-center text-xl p-8">Loading Investigation...</div>;
    if (error) return <div className="text-center text-xl p-8 text-red-400">{error}</div>;
    if (!investigation) return null;

    const TabButton: React.FC<{ tab: ActiveTab; icon: React.ReactNode; children: React.ReactNode; }> = ({ tab, icon, children }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
            {icon}
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
             <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportContent={reportContent} />
            <div className="content-panel p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Investigation: <span className="font-mono text-blue-400">{investigation.id}</span></h1>
                    <p className="text-gray-400 mt-1">Lead Analyst: <span className="font-medium text-gray-300">{investigation.team[0]?.email}</span> | Opened: {new Date(investigation.startTime).toLocaleString()}</p>
                    <p className="mt-2 text-gray-300" dangerouslySetInnerHTML={{ __html: getThreatDescription(investigation.primaryThreat) }} />
                </div>
                <div className="flex items-center gap-4">
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColorMap[investigation.status]}`}>{investigation.status}</span>
                     {investigation.status !== InvestigationStatus.Closed && (
                        <button onClick={() => handleStatusChange(InvestigationStatus.Closed)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg">Close Case</button>
                     )}
                </div>
            </div>

            <div className="content-panel">
                <div className="border-b border-gray-700 flex">
                    <TabButton tab="Overview" icon={<ClipboardListIcon className="h-5 w-5" />}>Overview</TabButton>
                    <TabButton tab="Timeline" icon={<TimelineIcon className="h-5 w-5" />}>Timeline</TabButton>
                    <TabButton tab="Evidence" icon={<EvidenceIcon className="h-5 w-5" />}>Evidence Locker</TabButton>
                    <TabButton tab="Report" icon={<ReportIcon className="h-5 w-5" />}>Reporting</TabButton>
                </div>

                <div className="p-6">
                    {activeTab === 'Overview' && (
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Investigator's Checklist</h2>
                                    <ChecklistSection checklist={investigation.checklist} onCheck={handleChecklistChange} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Investigation Team</h2>
                                    <TeamManager team={investigation.team} availableAnalysts={availableAnalystsToAdd} onAdd={handleAddMember} onRemove={handleRemoveMember} memberToAdd={memberToAdd} setMemberToAdd={setMemberToAdd} />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <h2 className="text-xl font-semibold mb-2">Investigation Notes</h2>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleSaveNotes} placeholder="Record your findings..." className="w-full h-96 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-300 focus:ring-blue-500 focus:border-blue-500" />
                                <div className="mt-6 holographic-card p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">AI Analyst Assistant</h3>
                                    <div className="bg-gray-900/50 rounded-lg p-3 min-h-[6rem] max-h-48 overflow-y-auto">
                                        {isAiLoading && <p className="text-gray-400 animate-pulse">AI is thinking...</p>}
                                        {aiResponse ? <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiResponse }} /> : !isAiLoading && <p className="text-gray-500 text-sm">Ask for insights, recommended next steps, or IoC identification.</p>}
                                    </div>
                                    <form onSubmit={handleAiQuery} className="flex gap-2 mt-3">
                                        <input
                                            type="text"
                                            value={aiQuery}
                                            onChange={(e) => setAiQuery(e.target.value)}
                                            placeholder="e.g., 'What are the top 3 recommended next steps?'"
                                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isAiLoading}
                                        />
                                        <button type="submit" disabled={isAiLoading || !aiQuery.trim()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                            Ask
                                        </button>
                                    </form>
                                </div>
                            </div>
                         </div>
                    )}

                    {activeTab === 'Timeline' && (
                        <div>
                             <h2 className="text-xl font-semibold mb-4">Event Timeline</h2>
                             <InvestigationTimeline timeline={investigation.timeline} />
                             <form onSubmit={handleAddTimelineNote} className="mt-6">
                                 <h3 className="text-lg font-semibold mb-2">Add Note to Timeline</h3>
                                 <textarea value={timelineNote} onChange={e => setTimelineNote(e.target.value)} rows={3} placeholder="Add a key finding or action taken..." className="w-full bg-gray-700 p-2 rounded-lg" />
                                 <button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Add Note</button>
                             </form>
                        </div>
                    )}
                    
                    {activeTab === 'Evidence' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Evidence Locker</h2>
                                <div className="space-y-2">
                                    {investigation.evidence.length > 0 ? investigation.evidence.map(e => (
                                        <div key={e.id} className="bg-gray-700/50 p-3 rounded-lg">
                                            <p className="font-semibold text-white">{e.name}</p>
                                            <p className="text-sm text-gray-400">Type: {e.type} | Added by {e.addedBy} at {new Date(e.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    )) : <p className="text-gray-400">No evidence has been added.</p>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Add Evidence</h2>
                                <form onSubmit={handleAddEvidence} className="space-y-4">
                                    <div>
                                        <label htmlFor="evidenceName" className="text-sm">File Name / Description</label>
                                        <input id="evidenceName" type="text" value={evidenceName} onChange={e => setEvidenceName(e.target.value)} className="w-full mt-1 bg-gray-700 p-2 rounded-lg" required />
                                    </div>
                                    <div>
                                        <label htmlFor="evidenceType" className="text-sm">Evidence Type</label>
                                        <select id="evidenceType" value={evidenceType} onChange={e => setEvidenceType(e.target.value)} className="w-full mt-1 bg-gray-700 p-2 rounded-lg">
                                            <option value="log">Log File</option>
                                            <option value="pcap">Packet Capture (.pcap)</option>
                                            <option value="screenshot">Screenshot</option>
                                            <option value="report">External Report</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Log Evidence</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Report' && (
                        <div>
                             <h2 className="text-xl font-semibold mb-2">Generate Final Report</h2>
                             <p className="text-gray-400 mb-4">Use the AI Assistant to compile all investigation data—notes, timeline, evidence, and checklist findings—into a formal incident report.</p>
                             <button onClick={handleGenerateReport} disabled={isReportLoading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                {isReportLoading ? 'Generating...' : 'Generate AI Report'}
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvestigationWorkbenchPage;