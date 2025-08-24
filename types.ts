

export enum Severity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum AttackType {
    DoS = 'DoS',
    DDoS = 'DDoS',
    PortScan = 'Port Scan',
    Bot = 'Bot',
    WebAttack = 'Web Attack',
    Infiltration = 'Infiltration',
    Benign = 'Benign',
    BruteForce = 'Brute Force',
}

export interface Alert {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip:string;
  protocol: string;
  attack_type: AttackType;
  severity: Severity;
  description: string;
}

export interface ShapValue {
  feature: string;
  contribution: number;
}

export interface XAIExplanation {
  shap_values: ShapValue[];
  lime_summary: string;
}

export enum Role {
    Admin = 'Admin',
    SecurityManager = 'Security Manager',
    SeniorAnalyst = 'Senior Analyst',
    Analyst = 'Analyst',
    ReadOnly = 'Read Only',
}

export enum UserStatus {
    Pending = 'Pending',
    Active = 'Active',
    Disabled = 'Disabled',
}

export enum Department {
    BlueTeam = 'Blue Team',
    RedTeam = 'Red Team',
    SOC = 'SOC',
    Unassigned = 'Unassigned',
}

export interface User {
    id: string;
    email: string;
    personalEmail: string;
    role: Role;
    status: UserStatus;
    department: Department;
}

export enum LogAction {
    LOGIN = 'User Login',
    LOGOUT = 'User Logout',
    LOGIN_FAILED = 'Failed Login Attempt',
    USER_CREATED = 'Admin Created User',
    ADMIN_PASSWORD_RESET = 'Admin Reset Password',
    USER_PASSWORD_CHANGED = 'User Changed Password',
    VIEW_EXPLANATION = 'Viewed Alert Explanation',
    REFRESH_DATA = 'Manually Refreshed Data',
    TOGGLE_AUTOREFRESH_ON = 'Enabled Auto-Refresh',
    TOGGLE_AUTOREFRESH_OFF = 'Disabled Auto-Refresh',
    USER_ROLE_CHANGED = 'User Role Changed',
    USER_STATUS_CHANGED = 'User Status Changed',
    USER_DEPARTMENT_CHANGED = 'User Department Changed',
    LOGS_UPLOADED = 'Log File Ingested',
    INVESTIGATION_STARTED = 'Started Investigation',
    INVESTIGATION_UPDATED = 'Updated Investigation',
    INVESTIGATION_CLOSED = 'Closed Investigation',
    INVESTIGATION_MEMBER_ADDED = 'Added Member to Investigation',
    INVESTIGATION_MEMBER_REMOVED = 'Removed Member from Investigation',
    USER_REGISTERED = 'User Self-Registered',
    ACCOUNT_VERIFIED = 'User Verified Account',
    PASSWORD_RESET_REQUEST = 'User Requested Password Reset',
    PASSWORD_RESET_SUCCESS = 'User Successfully Reset Password',
    TIMELINE_EVENT_ADDED = 'Added Timeline Event',
    EVIDENCE_ADDED = 'Added Evidence to Case',
    HUNT_CREATED = 'Threat Hunt Created',
    HUNT_UPDATED = 'Threat Hunt Updated',
    HUNT_DELETED = 'Threat Hunt Deleted',
    HUNT_ESCALATED = 'Threat Hunt Escalated to Investigation',
    PENTEST_ESCALATED = 'Penetration Test Escalated to Investigation',
}

export interface LogEntry {
    id: string;
    timestamp: string;
    userId?: string;
    userEmail: string;
    action: LogAction;
    details?: string;
}

export enum InvestigationStatus {
    Open = 'Open',
    InProgress = 'In Progress',
    Closed = 'Closed',
}

export interface InvestigationChecklist {
    triage: {
        severityConfirmed: boolean;
        checkedForFalsePositives: boolean;
    };
    correlation: {
        foundRelatedEvents: boolean;
        correlatedWithAuditLogs: boolean;
    };
    analysis: {
        identifiedIOCs: boolean;
        reconstructedTimeline: boolean;
    };
    mitigation: {
        proposedSteps: boolean;
    };
}

export interface TimelineEvent {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: 'alert' | 'log' | 'note' | 'evidence' | 'behavior' | 'hunt' | 'pentest';
    author: string; // user email
}

export interface EvidenceFile {
    id: string;
    name: string;
    type: string; // e.g., 'pcap', 'log', 'screenshot', 'report', 'script'
    addedBy: string; // user email
    timestamp: string;
    content?: string;
}

export interface BehavioralData {
    id: string;
    userEmail: string;
    baselineScore: number;
    currentScore: number;
    anomalies: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface Hunt {
  id: string;
  name: string;
  hypothesis: string;
  query: string;
  findings: string;
  createdBy: string; // user email
  createdAt: string;
}

export interface ThreatHuntResult {
    id: string; // a unique ID for this result, usually same as hunt id
    type: 'ThreatHuntResult';
    name: string; // from Hunt
    query: string; // from Hunt
    findings: string; // from Hunt
    createdAt: string; // when escalated
}

export interface ReconData {
    subdomains: string[];
    open_ports: { port: number; service: string; description: string; }[];
    technologies: { name: string; category: string; }[];
    potential_vulnerabilities: string[];
}
export interface Vulnerability {
    cve_id: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
    description: string;
    recommendation: string;
}
export interface ExploitScript {
    cve_id: string;
    script: string;
}

export interface PenetrationTestResult {
    id: string;
    type: 'PenetrationTestResult';
    targetDomain: string;
    reconData: ReconData;
    vulnerabilities: Vulnerability[];
    exploitScripts: ExploitScript[];
    finalReport: string;
    createdAt: string;
}

export type Threat = Alert | BehavioralData | ThreatHuntResult | PenetrationTestResult;

export interface Investigation {
    id: string;
    primaryThreat: Threat;
    team: {
        id: string;
        email: string;
    }[];
    status: InvestigationStatus;
    startTime: string;
    endTime?: string;
    checklist: InvestigationChecklist;
    notes: string;
    timeline: TimelineEvent[];
    evidence: EvidenceFile[];
}

export interface InboxMessage {
    id: string;
    from: string; // "System" or a user's email
    toUserId: string;
    subject: string;
    body: string;
    timestamp: string;
    read: boolean;
}

export interface CalendarEvent {
    id: string;
    department: Department;
    title: string;
    date: string; // YYYY-MM-DD
    description: string;
    createdBy: string; // user email
}

export interface Drone {
    id: string;
    status: 'Patrolling' | 'Responding' | 'Charging' | 'Offline';
    location: string; // e.g., 'Sector 4B'
    battery: number; // percentage
}