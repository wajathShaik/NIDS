

import type { Investigation, Threat, User, TimelineEvent, EvidenceFile } from '../types';
import { InvestigationStatus, LogAction } from '../types';
import { logService } from './logService';

const INVESTIGATIONS_KEY = 'nids_xai_investigations';

const getInvestigationsFromStorage = (): Investigation[] => {
    const data = localStorage.getItem(INVESTIGATIONS_KEY);
    return data ? JSON.parse(data) : [];
};

const saveInvestigationsToStorage = (investigations: Investigation[]) => {
    localStorage.setItem(INVESTIGATIONS_KEY, JSON.stringify(investigations));
};

export const investigationService = {
    async getInvestigations(): Promise<Investigation[]> {
        return getInvestigationsFromStorage();
    },

    async getInvestigationById(id: string): Promise<Investigation | undefined> {
        const investigations = getInvestigationsFromStorage();
        return investigations.find(inv => inv.id === id);
    },

    async createInvestigation(threat: Threat, user: User): Promise<Investigation> {
        const investigations = getInvestigationsFromStorage();
        
        let initialTimelineEvent: TimelineEvent;
        let logDetails: string;
        let initialNotes: string;
        let initialEvidence: EvidenceFile[] = [];
        
        const timestamp = new Date();

        if ('attack_type' in threat) { // It's an Alert
            initialTimelineEvent = {
                id: `t-evt-${timestamp.getTime()}`,
                timestamp: timestamp.toISOString(),
                type: 'alert',
                title: `Initial Alert: ${threat.attack_type}`,
                description: `Severity: ${threat.severity}, Source: ${threat.src_ip}, Destination: ${threat.dst_ip}`,
                author: 'System',
            };
            logDetails = `Started investigation for Alert ID: ${threat.id}`;
            initialNotes = `Initial investigation created for network alert.`;
        } else if ('riskLevel' in threat) { // It's BehavioralData
            initialTimelineEvent = {
                id: `t-evt-${timestamp.getTime()}`,
                timestamp: timestamp.toISOString(),
                type: 'behavior',
                title: `Behavioral Anomaly: ${threat.riskLevel} Risk`,
                description: `User: ${threat.userEmail}, Anomalies: ${threat.anomalies.join(', ')}`,
                author: 'System',
            };
            logDetails = `Started investigation for Behavioral Threat ID: ${threat.id} (User: ${threat.userEmail})`;
            initialNotes = `Initial investigation created for behavioral anomaly.`;
        } else if (threat.type === 'ThreatHuntResult') { // It's a ThreatHuntResult
             initialTimelineEvent = {
                id: `t-evt-${timestamp.getTime()}`,
                timestamp: timestamp.toISOString(),
                type: 'hunt',
                title: `Escalated from Threat Hunt: ${threat.name}`,
                description: `Query: ${threat.query}`,
                author: user.email,
            };
            logDetails = `Started investigation from Threat Hunt: ${threat.name}`;
            initialNotes = `Investigation created from Threat Hunt "${threat.name}".\n\nInitial Findings:\n${threat.findings}`;
        } else if (threat.type === 'PenetrationTestResult') { // It's a PenetrationTestResult
            const formattedTimestamp = timestamp.toISOString().replace(/[:.]/g, '-');
            const baseFileName = `${threat.targetDomain}_${formattedTimestamp}`;

            initialTimelineEvent = {
                id: `t-evt-${timestamp.getTime()}`,
                timestamp: timestamp.toISOString(),
                type: 'pentest',
                title: `Pentest Escalated: ${threat.targetDomain}`,
                description: `Penetration test results for ${threat.targetDomain} escalated to a full investigation.`,
                author: user.email,
            };
            logDetails = `Started investigation from Penetration Test on ${threat.targetDomain}`;
            initialNotes = `Investigation created from the Penetration Testing Toolkit for the target domain: ${threat.targetDomain}.\n\nReview the attached evidence for the full report and findings.`;
            
            initialEvidence = [
                {
                    id: `evd-${timestamp.getTime()}-report`,
                    name: `${baseFileName}_Report.md`,
                    type: 'report',
                    addedBy: user.email,
                    timestamp: timestamp.toISOString(),
                    content: threat.finalReport,
                },
                ...threat.exploitScripts.map((script, index) => ({
                     id: `evd-${timestamp.getTime()}-script-${index}`,
                     name: `${baseFileName}_Exploit_${script.cve_id}.py`,
                     type: 'script',
                     addedBy: user.email,
                     timestamp: timestamp.toISOString(),
                     content: script.script,
                })),
                {
                     id: `evd-${timestamp.getTime()}-rawdata`,
                     name: `${baseFileName}_RawData.json`,
                     type: 'log',
                     addedBy: user.email,
                     timestamp: timestamp.toISOString(),
                     content: JSON.stringify({ recon: threat.reconData, vulnerabilities: threat.vulnerabilities }, null, 2),
                }
            ];
        } else {
             throw new Error("Unknown threat type provided to createInvestigation");
        }


        const newInvestigation: Investigation = {
            id: `case-${timestamp.getTime()}`,
            primaryThreat: threat,
            team: [{ id: user.id, email: user.email }],
            status: InvestigationStatus.Open,
            startTime: timestamp.toISOString(),
            checklist: {
                triage: { severityConfirmed: false, checkedForFalsePositives: false },
                correlation: { foundRelatedEvents: false, correlatedWithAuditLogs: false },
                analysis: { identifiedIOCs: false, reconstructedTimeline: false },
                mitigation: { proposedSteps: false },
            },
            notes: initialNotes,
            timeline: [initialTimelineEvent],
            evidence: initialEvidence,
        };

        investigations.unshift(newInvestigation);
        saveInvestigationsToStorage(investigations);

        await logService.addLog({
            action: LogAction.INVESTIGATION_STARTED,
            userEmail: user.email,
            userId: user.id,
            details: `${logDetails} - Case ID: ${newInvestigation.id}`
        });

        return newInvestigation;
    },

    async updateInvestigation(id: string, updates: Partial<Investigation>, user: User): Promise<Investigation> {
        let investigations = getInvestigationsFromStorage();
        const index = investigations.findIndex(inv => inv.id === id);

        if (index === -1) {
            throw new Error("Investigation not found");
        }

        const originalInvestigation = investigations[index];
        const updatedInvestigation = { ...originalInvestigation, ...updates };

        if (originalInvestigation.status !== InvestigationStatus.Closed && updatedInvestigation.status === InvestigationStatus.Closed) {
            updatedInvestigation.endTime = new Date().toISOString();
            await logService.addLog({
                action: LogAction.INVESTIGATION_CLOSED,
                userEmail: user.email,
                userId: user.id,
                details: `Closed investigation ${id}`
            });
        } else {
             await logService.addLog({
                action: LogAction.INVESTIGATION_UPDATED,
                userEmail: user.email,
                userId: user.id,
                details: `Updated investigation ${id}`
            });
        }
        
        investigations[index] = updatedInvestigation;
        saveInvestigationsToStorage(investigations);

        return updatedInvestigation;
    },

    async addTimelineEvent(investigationId: string, eventData: Omit<TimelineEvent, 'id' | 'timestamp' | 'author'>, user: User): Promise<Investigation> {
        const investigations = getInvestigationsFromStorage();
        const investigation = investigations.find(inv => inv.id === investigationId);
        if (!investigation) throw new Error("Investigation not found");

        const newEvent: TimelineEvent = {
            id: `t-evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author: user.email,
            ...eventData
        };

        investigation.timeline.push(newEvent);
        investigation.timeline.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        saveInvestigationsToStorage(investigations);

        await logService.addLog({
            action: LogAction.TIMELINE_EVENT_ADDED,
            userEmail: user.email,
            userId: user.id,
            details: `Added '${eventData.title}' to timeline for case ${investigationId}`
        });

        return investigation;
    },
    
    async addEvidence(investigationId: string, evidenceData: Omit<EvidenceFile, 'id' | 'timestamp' | 'addedBy'>, user: User): Promise<Investigation> {
        const investigations = getInvestigationsFromStorage();
        const investigation = investigations.find(inv => inv.id === investigationId);
        if (!investigation) throw new Error("Investigation not found");

        const newEvidence: EvidenceFile = {
            id: `evd-${Date.now()}`,
            timestamp: new Date().toISOString(),
            addedBy: user.email,
            ...evidenceData
        };
        
        investigation.evidence.unshift(newEvidence);
        saveInvestigationsToStorage(investigations);

        await logService.addLog({
            action: LogAction.EVIDENCE_ADDED,
            userEmail: user.email,
            userId: user.id,
            details: `Added evidence '${evidenceData.name}' to case ${investigationId}`
        });

        return investigation;
    },

    async addTeamMember(investigationId: string, memberToAdd: Pick<User, 'id' | 'email'>, currentUser: User): Promise<Investigation> {
        let investigations = getInvestigationsFromStorage();
        const investigation = investigations.find(inv => inv.id === investigationId);
        if (!investigation) throw new Error("Investigation not found");

        if (investigation.team.some(member => member.id === memberToAdd.id)) {
            return investigation; // Member already in team
        }

        investigation.team.push({ id: memberToAdd.id, email: memberToAdd.email });
        saveInvestigationsToStorage(investigations);
        
        await logService.addLog({
            action: LogAction.INVESTIGATION_MEMBER_ADDED,
            userEmail: currentUser.email,
            userId: currentUser.id,
            details: `Added ${memberToAdd.email} to investigation ${investigationId}`
        });

        return investigation;
    },

    async removeTeamMember(investigationId: string, memberIdToRemove: string, currentUser: User): Promise<Investigation> {
        let investigations = getInvestigationsFromStorage();
        const investigation = investigations.find(inv => inv.id === investigationId);
        if (!investigation) throw new Error("Investigation not found");

        if (investigation.team.length <= 1) {
            throw new Error("Cannot remove the last member of the investigation team.");
        }

        const memberToRemove = investigation.team.find(m => m.id === memberIdToRemove);
        investigation.team = investigation.team.filter(member => member.id !== memberIdToRemove);
        saveInvestigationsToStorage(investigations);

        await logService.addLog({
            action: LogAction.INVESTIGATION_MEMBER_REMOVED,
            userEmail: currentUser.email,
            userId: currentUser.id,
            details: `Removed ${memberToRemove?.email || `user ID ${memberIdToRemove}`} from investigation ${investigationId}`
        });
        
        return investigation;
    }
};