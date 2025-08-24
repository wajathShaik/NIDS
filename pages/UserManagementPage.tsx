import React, { useState, useEffect, useCallback } from 'react';
import type { User, Role, UserStatus, Department } from '../types';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';
import UserManagementTable from '../components/UserManagementTable';
import AddUserModal from '../components/AddUserModal';
import JustificationModal from '../components/JustificationModal';
import { RefreshIcon, UsersIcon } from '../components/icons';

type JustificationAction = 
    | { type: 'updateRole'; userId: string; value: Role }
    | { type: 'updateStatus'; userId: string; value: UserStatus }
    | { type: 'updateDepartment'; userId: string; value: Department }
    | { type: 'resetPassword'; userId: string; userEmail: string };

interface JustificationModalState {
    isOpen: boolean;
    action: JustificationAction | null;
    title: string;
    message: string;
}

const UserManagementPage: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [justificationModalState, setJustificationModalState] = useState<JustificationModalState>({ isOpen: false, action: null, title: '', message: '' });
    const [lastUpdatedUserId, setLastUpdatedUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allUsers = await authService.getUsers();
            setUsers(allUsers);
        } catch (err) {
            setError("Failed to load user data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRefresh = useCallback(async () => {
        if (adminUser) {
            logService.addLog({ action: LogAction.REFRESH_DATA, userEmail: adminUser.email, userId: adminUser.id, details: "Refreshed User Management page" });
        }
        await fetchUsers();
    }, [fetchUsers, adminUser]);

    const handleCreateUser = async (email: string, personalEmail: string, role: Role, department: Department) => {
        if (!adminUser) return;
        try {
            const newUser = await authService.createUser(email, personalEmail, role, department, adminUser);
            await logService.addLog({
                action: LogAction.USER_CREATED,
                userEmail: adminUser.email,
                userId: adminUser.id,
                details: `Created new user ${newUser.email} with role ${role}`
            });
            fetchUsers();
            setIsAddUserModalOpen(false);
        } catch (err: any) {
            console.error("Failed to create user:", err);
            setError(err.message || "Failed to create user. Please try again.");
        }
    };
    
    const handleAdminResetPassword = (userId: string, userEmail: string) => {
        setJustificationModalState({
            isOpen: true,
            action: { type: 'resetPassword', userId, userEmail },
            title: 'Confirm Password Reset',
            message: `You are about to reset the password for ${userEmail}. Please provide a reason for this security-sensitive action.`
        });
    };

    const handleUpdateRole = (userId: string, newRole: Role) => {
         const user = users.find(u => u.id === userId);
         if (user?.role === newRole) return; // No change, do nothing
        setJustificationModalState({
            isOpen: true,
            action: { type: 'updateRole', userId, value: newRole },
            title: 'Confirm Role Change',
            message: `You are about to change the role for ${user?.email} to "${newRole}". Please provide a reason.`
        });
    };

    const handleUpdateStatus = (userId: string, newStatus: UserStatus) => {
        const user = users.find(u => u.id === userId);
        setJustificationModalState({
            isOpen: true,
            action: { type: 'updateStatus', userId, value: newStatus },
            title: `Confirm User Status Change`,
            message: `You are about to change the status for ${user?.email} to "${newStatus}". Please provide a reason.`
        });
    };
    
    const handleUpdateDepartment = (userId: string, newDepartment: Department) => {
        const user = users.find(u => u.id === userId);
        if (user?.department === newDepartment) return; // No change
        setJustificationModalState({
            isOpen: true,
            action: { type: 'updateDepartment', userId, value: newDepartment },
            title: 'Confirm Department Change',
            message: `You are about to change the department for ${user?.email} to "${newDepartment}". Please provide a reason.`
        });
    };

    const handleConfirmWithJustification = async (reason: string) => {
        if (!adminUser || !justificationModalState.action) return;

        setError(null);
        setLastUpdatedUserId(null);
        const { action } = justificationModalState;

        try {
            let logDetails = '';
            let logActionType: LogAction;

            switch (action.type) {
                case 'resetPassword':
                    await authService.adminResetPassword(action.userId, adminUser, reason);
                    logDetails = `Reset password for user ${action.userEmail}. Reason: ${reason}`;
                    logActionType = LogAction.ADMIN_PASSWORD_RESET;
                    alert(`Password for ${action.userEmail} has been reset. Notifications have been sent.`);
                    break;
                case 'updateRole':
                    await authService.updateUserRole(action.userId, action.value, adminUser, reason);
                    logDetails = `Changed role for user ID ${action.userId} to ${action.value}. Reason: ${reason}`;
                    logActionType = LogAction.USER_ROLE_CHANGED;
                    setLastUpdatedUserId(action.userId);
                    break;
                case 'updateStatus':
                    const updatedUser = await authService.updateUserStatus(action.userId, action.value, adminUser, reason);
                    logDetails = `Changed status for user ${updatedUser.email} to ${action.value}. Reason: ${reason}`;
                    logActionType = LogAction.USER_STATUS_CHANGED;
                    setLastUpdatedUserId(action.userId);
                    break;
                case 'updateDepartment':
                    await authService.updateUserDepartment(action.userId, action.value, adminUser, reason);
                    logDetails = `Changed department for user ID ${action.userId} to ${action.value}. Reason: ${reason}`;
                    logActionType = LogAction.USER_DEPARTMENT_CHANGED;
                    setLastUpdatedUserId(action.userId);
                    break;
                default:
                    throw new Error("Invalid action type");
            }
            
            await logService.addLog({ action: logActionType, userEmail: adminUser.email, userId: adminUser.id, details: logDetails });

            fetchUsers();
            setJustificationModalState({ isOpen: false, action: null, title: '', message: '' });
        } catch (err: any) {
            console.error(`Failed to perform action ${action.type}:`, err);
            setError(err.message || `Failed to perform action. Please try again.`);
        }
    };
    
    const closeJustificationModal = () => {
        setJustificationModalState({ isOpen: false, action: null, title: '', message: '' });
        // Refresh users in case a dropdown was changed but the action was cancelled.
        fetchUsers();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">User Management</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center gap-2"
                    >
                        <UsersIcon className="h-5 w-5" />
                        Add User
                    </button>
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
            {error && (
                <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative my-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                     <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
            )}
            <UserManagementTable
                users={users}
                loading={loading}
                onUpdateRole={handleUpdateRole}
                onUpdateStatus={handleUpdateStatus}
                onUpdateDepartment={handleUpdateDepartment}
                onAdminResetPassword={handleAdminResetPassword}
                highlightedUserId={lastUpdatedUserId}
            />

            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onCreateUser={handleCreateUser}
            />
            
            <JustificationModal
                isOpen={justificationModalState.isOpen}
                onClose={closeJustificationModal}
                onConfirm={handleConfirmWithJustification}
                title={justificationModalState.title}
                message={justificationModalState.message}
            />
        </div>
    );
};

export default UserManagementPage;