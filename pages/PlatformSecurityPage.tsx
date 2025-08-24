import React, { useState, useEffect } from 'react';
import { ShieldIcon, QuantumLockIcon } from '../components/icons';

interface StatusCardProps {
    title: string;
    status: 'Nominal' | 'Warning' | 'Error';
    children: React.ReactNode;
}

const statusColors = {
    Nominal: { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
    Warning: { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    Error: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
};

const StatusCard: React.FC<StatusCardProps> = ({ title, status, children }) => {
    const colors = statusColors[status];
    return (
        <div className={`content-panel p-6 border-l-4 ${colors.border} ${colors.bg}`}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <span className={`font-bold ${colors.text}`}>{status}</span>
            </div>
            <div className="mt-4 text-sm text-gray-300 space-y-2">
                {children}
            </div>
        </div>
    );
};

const PlatformSecurityPage: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timerId); 
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Platform Security Status</h1>
            <p className="text-gray-400 mb-8 max-w-3xl">
                This dashboard provides a real-time overview of the core security architecture and its advanced components, ensuring operational integrity and resilience against next-generation threats.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard title="Quantum-Resilient Cryptography (QRC)" status="Nominal">
                    <p><strong className="text-gray-400">Primary Algorithm:</strong> CRYSTALS-Kyber (NIST Level 1)</p>
                    <p><strong className="text-gray-400">Signature Scheme:</strong> CRYSTALS-Dilithium</p>
                    <p><strong className="text-gray-400">Mode:</strong> Hybrid (QRC + AES-256)</p>
                </StatusCard>

                <StatusCard title="Blockchain Security Ledger" status="Nominal">
                    <p><strong className="text-gray-400">Ledger Status:</strong> Synchronized</p>
                    <p><strong className="text-gray-400">Total Transactions:</strong> 1,482,901</p>
                    <p><strong className="text-gray-400">Last Block Hash:</strong> 0x7a3...f4d</p>
                </StatusCard>
                
                 <StatusCard title="Federated Learning Network" status="Nominal">
                    <p><strong className="text-gray-400">Network Status:</strong> Online & Learning</p>
                    <p><strong className="text-gray-400">Participating Edge Nodes:</strong> 512 / 512</p>
                    <p><strong className="text-gray-400">Last Model Update:</strong> {currentTime}</p>
                </StatusCard>
                
                <StatusCard title="Homomorphic Encryption" status="Warning">
                    <p><strong className="text-gray-400">Status:</strong> Partially Enabled</p>
                    <p><strong className="text-gray-400">Protected Schemas:</strong> User PII, Financial Data</p>
                    <p className="text-yellow-400">Note: Performance degradation detected in log analysis module. Temporarily disabled for non-critical data.</p>
                </StatusCard>

                <StatusCard title="Zero-Trust Architecture" status="Nominal">
                     <p><strong className="text-gray-400">Policy Engine:</strong> Active</p>
                     <p><strong className="text-gray-400">Continuously Verified Sessions:</strong> 8,342</p>
                     <p><strong className="text-gray-400">Denied Requests (24h):</strong> 19</p>
                </StatusCard>
                
                <StatusCard title="AI-Powered SOAR" status="Nominal">
                     <p><strong className="text-gray-400">Orchestrator Status:</strong> Active</p>
                     <p><strong className="text-gray-400">Automated Playbooks Executed (24h):</strong> 74</p>
                     <p><strong className="text-gray-400">Average Response Time:</strong> 4.2 seconds</p>
                </StatusCard>
            </div>
        </div>
    );
};

export default PlatformSecurityPage;