
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Alert } from '../types';
import { Severity, AttackType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { investigationService } from '../services/investigationService';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

interface AlertsTableProps {
  alerts: Alert[];
  loading: boolean;
  onViewExplanation: (alert: Alert) => void;
}

const severityColorMap: Record<Severity, string> = {
  [Severity.Critical]: 'bg-red-500/20 text-red-400 border border-red-500/30',
  [Severity.High]: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  [Severity.Medium]: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  [Severity.Low]: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

const attackTypeColorMap: Record<AttackType, string> = {
    [AttackType.DoS]: 'bg-red-900',
    [AttackType.DDoS]: 'bg-red-800',
    [AttackType.PortScan]: 'bg-yellow-800',
    [AttackType.Bot]: 'bg-purple-800',
    [AttackType.WebAttack]: 'bg-pink-800',
    [AttackType.Infiltration]: 'bg-indigo-800',
    [AttackType.Benign]: 'bg-green-800',
    [AttackType.BruteForce]: 'bg-gray-700',
};

const TableSkeleton: React.FC = () => (
    <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-700 animate-pulse">
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                <td className="px-5 py-5"><div className="h-6 bg-gray-700 rounded-full w-20"></div></td>
                <td className="px-5 py-5"><div className="h-6 bg-gray-700 rounded-full w-24"></div></td>
                <td className="px-5 py-5"><div className="h-8 bg-gray-700 rounded w-28"></div></td>
            </tr>
        ))}
    </tbody>
);

type SortDirection = 'ascending' | 'descending';
type SortKey = keyof Alert;

const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, loading, onViewExplanation }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'timestamp', direction: 'descending' });
    const alertsPerPage = 10;
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setCurrentPage(1);
    }, [alerts.length]);

    const handleStartInvestigation = async (alert: Alert) => {
        if (!user) return;
        try {
            const newInvestigation = await investigationService.createInvestigation(alert, user);
            navigate(`/investigation/${newInvestigation.id}`);
        } catch (error) {
            console.error("Failed to start investigation:", error);
            // Optionally, show an error to the user
        }
    };

    const sortedAlerts = useMemo(() => {
        let sortableAlerts = [...alerts];
        if (sortConfig !== null) {
            sortableAlerts.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableAlerts;
    }, [alerts, sortConfig]);

    const paginatedAlerts = useMemo(() => {
        const startIndex = (currentPage - 1) * alertsPerPage;
        return sortedAlerts.slice(startIndex, startIndex + alertsPerPage);
    }, [sortedAlerts, currentPage]);
    
    const totalPages = Math.ceil(sortedAlerts.length / alertsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <span className="inline-block w-4"></span>;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="inline ml-1 h-4 w-4" />;
        }
        return <ArrowDownIcon className="inline ml-1 h-4 w-4" />;
    };

    const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode; className?: string }> = ({ sortKey, children, className }) => (
        <th className={`px-5 py-3 cursor-pointer select-none transition-colors hover:bg-gray-600/50 ${className}`} onClick={() => requestSort(sortKey)}>
           <div className="flex items-center">
             <span>{children}</span>
             {getSortIcon(sortKey)}
           </div>
        </th>
    );

    return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
            <h2 className="text-xl font-semibold text-white">Recent Security Alerts</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead>
                    <tr className="border-b-2 border-gray-700 bg-gray-700/50 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <SortableHeader sortKey="timestamp">Timestamp</SortableHeader>
                        <th className="px-5 py-3">Source IP</th>
                        <th className="px-5 py-3">Destination IP</th>
                        <SortableHeader sortKey="severity">Severity</SortableHeader>
                        <SortableHeader sortKey="attack_type">Attack Type</SortableHeader>
                        <th className="px-5 py-3">Actions</th>
                    </tr>
                </thead>
                {loading ? <TableSkeleton /> : (
                <tbody>
                    {paginatedAlerts.length > 0 ? paginatedAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="px-5 py-5 text-sm">
                            <p className="text-gray-300 whitespace-no-wrap">{new Date(alert.timestamp).toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-5 text-sm">
                            <p className="text-gray-300 whitespace-no-wrap font-mono">{alert.src_ip}</p>
                        </td>
                        <td className="px-5 py-5 text-sm">
                            <p className="text-gray-300 whitespace-no-wrap font-mono">{alert.dst_ip}</p>
                        </td>
                        <td className="px-5 py-5 text-sm">
                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${severityColorMap[alert.severity]}`}>
                                {alert.severity}
                            </span>
                        </td>
                        <td className="px-5 py-5 text-sm">
                            <span className={`px-2 py-1 text-xs font-semibold text-white rounded-md ${attackTypeColorMap[alert.attack_type] || 'bg-gray-600'}`}>
                                {alert.attack_type}
                            </span>
                        </td>
                        <td className="px-5 py-5 text-sm space-x-2">
                            <button
                                onClick={() => onViewExplanation(alert)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Explain
                            </button>
                             <button
                                onClick={() => handleStartInvestigation(alert)}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Investigate
                            </button>
                        </td>
                    </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="text-center py-10 text-gray-400">
                                No alerts match the current filters.
                            </td>
                        </tr>
                    )}
                </tbody>
                )}
            </table>
        </div>
         <div className="px-5 py-5 bg-gray-800 flex flex-col xs:flex-row items-center xs:justify-between">
              <span className="text-xs xs:text-sm text-gray-400">
                  Showing {paginatedAlerts.length > 0 ? (currentPage - 1) * alertsPerPage + 1 : 0} to {Math.min(currentPage * alertsPerPage, sortedAlerts.length)} of {sortedAlerts.length} Alerts
              </span>
              <div className="inline-flex mt-2 xs:mt-0">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || totalPages === 0} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      Prev
                  </button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      Next
                  </button>
              </div>
          </div>
    </div>
  );
};

export default AlertsTable;