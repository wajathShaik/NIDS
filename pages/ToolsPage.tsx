





import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import ToolCard from '../components/ToolCard';
import {
    UsersIcon,
    UploadIcon,
    FileTextIcon,
    ClipboardListIcon,
    CalendarIcon,
    SopIcon,
    BrainCircuitIcon,
    DroneIcon,
    QuantumLockIcon,
    PentagonIcon,
    TerminalIcon,
} from '../components/icons';

const ToolsPage: React.FC = () => {
    const { user } = useAuth();

    const tools = [
        {
            title: 'User Management',
            description: 'Add, edit, and manage user accounts and permissions.',
            icon: <UsersIcon className="h-8 w-8 text-white" />,
            link: '/user-management',
            allowedRoles: [Role.Admin],
        },
        {
            title: 'Log Ingestion',
            description: 'Upload and process new log files to generate alerts.',
            icon: <UploadIcon className="h-8 w-8 text-white" />,
            link: '/log-ingestion',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst],
        },
        {
            title: 'Penetration Testing',
            description: 'Simulate attacks and generate vulnerability reports with an AI-powered toolkit.',
            icon: <PentagonIcon className="h-8 w-8 text-white" />,
            link: '/penetration-testing',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst],
        },
        {
            title: 'Virtual SOC Workbench',
            description: 'Run simulated scans using AI-powered versions of famous tools like Nmap, Nessus, and Wireshark.',
            icon: <TerminalIcon className="h-8 w-8 text-white" />,
            link: '/virtual-soc-workbench',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst],
        },
        {
            title: 'Behavioral Analytics',
            description: 'Analyze user behavior, detect anomalies, and identify insider threats.',
            icon: <BrainCircuitIcon className="h-8 w-8 text-white" />,
            link: '/behavioral-analytics',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst],
        },
        {
            title: 'Autonomous Drone Security',
            description: 'Monitor and manage the autonomous drone fleet for physical security.',
            icon: <DroneIcon className="h-8 w-8 text-white" />,
            link: '/drone-security',
            allowedRoles: [Role.Admin, Role.SecurityManager],
        },
        {
            title: 'Platform Security Status',
            description: 'View the health of advanced security systems like QRC and the blockchain ledger.',
            icon: <QuantumLockIcon className="h-8 w-8 text-white" />,
            link: '/platform-security',
            allowedRoles: [Role.Admin, Role.SecurityManager],
        },
        {
            title: 'Audit Log',
            description: 'Review a chronological record of all actions on the platform.',
            icon: <FileTextIcon className="h-8 w-8 text-white" />,
            link: '/audit-log',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst, Role.ReadOnly],
        },
        {
            title: 'Investigations',
            description: 'Manage and collaborate on security incident investigations.',
            icon: <ClipboardListIcon className="h-8 w-8 text-white" />,
            link: '/investigations',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst],
        },
        {
            title: 'Department Calendar',
            description: 'View and manage team schedules, on-call rotations, and events.',
            icon: <CalendarIcon className="h-8 w-8 text-white" />,
            link: '/calendar',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst, Role.ReadOnly],
        },
        {
            title: 'Standard Operating Procedures',
            description: 'Access role-specific SOPs and query the AI assistant for guidance.',
            icon: <SopIcon className="h-8 w-8 text-white" />,
            link: '/sops',
            allowedRoles: [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst, Role.ReadOnly],
        },
    ];

    if (!user) {
        return null; // ProtectedRoute handles this, but as a fallback.
    }

    const visibleTools = tools.filter(tool =>
        user.role === Role.Admin || tool.allowedRoles.includes(user.role)
    );

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Cybersecurity Toolkit</h1>
            <p className="text-gray-400 mb-8 max-w-3xl">
                Access all platform features and management tools from this central hub. Your available tools are based on your role: <span className="font-semibold text-gray-300">{user.role}</span>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleTools.map((tool) => (
                    <ToolCard
                        key={tool.title}
                        title={tool.title}
                        description={tool.description}
                        icon={tool.icon}
                        link={tool.link}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToolsPage;