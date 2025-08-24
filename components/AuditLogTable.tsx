import React, { useState, useMemo } from 'react';
import type { LogEntry } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

interface AuditLogTableProps {
  logs: LogEntry[];
  loading: boolean;
}

const TableSkeleton: React.FC = () => (
    <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-700 animate-pulse">
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-full"></div></td>
            </tr>
        ))}
    </tbody>
);

type SortDirection = 'ascending' | 'descending';
type SortKey = keyof LogEntry;

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, loading }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'timestamp', direction: 'descending' });
    const logsPerPage = 15;

    const sortedLogs = useMemo(() => {
        let sortableLogs = [...logs];
        if (sortConfig !== null) {
            sortableLogs.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableLogs;
    }, [logs, sortConfig]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * logsPerPage;
        return sortedLogs.slice(startIndex, startIndex + logsPerPage);
    }, [sortedLogs, currentPage]);
    
    const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

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
        if (!sortConfig || sortConfig.key !== key) return <span className="inline-block w-4"></span>;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : <ArrowDownIcon className="inline ml-1 h-4 w-4" />;
    };

    const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="px-5 py-3 cursor-pointer select-none transition-colors hover:bg-gray-600/50" onClick={() => requestSort(sortKey)}>
           <div className="flex items-center"><span>{children}</span>{getSortIcon(sortKey)}</div>
        </th>
    );

    return (
    <div className="content-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead className="bg-gray-700/50">
                    <tr className="border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <SortableHeader sortKey="timestamp">Timestamp</SortableHeader>
                        <SortableHeader sortKey="userEmail">User</SortableHeader>
                        <th className="px-5 py-3">Action</th>
                        <th className="px-5 py-3">Details</th>
                    </tr>
                </thead>
                {loading ? <TableSkeleton /> : (
                <tbody>
                    {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="px-5 py-4 text-sm text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">{log.userEmail}</td>
                        <td className="px-5 py-4 text-sm text-gray-200">{log.action}</td>
                        <td className="px-5 py-4 text-sm text-gray-400 font-mono">{log.details}</td>
                    </tr>
                    )) : (
                        <tr><td colSpan={4} className="text-center py-10 text-gray-400">No log entries found.</td></tr>
                    )}
                </tbody>
                )}
            </table>
        </div>
         <div className="px-5 py-5 bg-gray-800/50 border-t border-gray-700 flex flex-col xs:flex-row items-center xs:justify-between">
              <span className="text-xs xs:text-sm text-gray-400">
                  Showing {paginatedLogs.length > 0 ? (currentPage - 1) * logsPerPage + 1 : 0} to {Math.min(currentPage * logsPerPage, sortedLogs.length)} of {sortedLogs.length} Entries
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

export default AuditLogTable;