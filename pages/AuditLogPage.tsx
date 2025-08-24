
import React, { useState, useEffect, useCallback } from 'react';
import type { LogEntry } from '../types';
import { logService, LogAction } from '../services/logService';
import { useAuth } from '../hooks/useAuth';
import AuditLogTable from '../components/AuditLogTable';
import { RefreshIcon } from '../components/icons';

const AuditLogPage: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const fetchedLogs = await logService.getLogs();
        setLogs(fetchedLogs);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = useCallback(async () => {
        if (user) {
            logService.addLog({ action: LogAction.REFRESH_DATA, userEmail: user.email, userId: user.id, details: "Refreshed Audit Log page" });
        }
        await fetchLogs();
    }, [fetchLogs, user]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Audit Log</h1>
                <div className="flex items-center gap-4">
                     <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshIcon className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>
            
            <AuditLogTable logs={logs} loading={loading} />

        </div>
    );
};

export default AuditLogPage;
