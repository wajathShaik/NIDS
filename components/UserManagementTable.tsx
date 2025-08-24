import React from 'react';
import type { User, Role, UserStatus, Department } from '../types';
import { Role as RoleEnum, UserStatus as UserStatusEnum, Department as DeptEnum } from '../types';

interface UserManagementTableProps {
  users: User[];
  loading: boolean;
  onUpdateRole: (userId: string, newRole: Role) => void;
  onUpdateStatus: (userId: string, newStatus: UserStatus) => void;
  onUpdateDepartment: (userId: string, newDepartment: Department) => void;
  onAdminResetPassword: (userId: string, userEmail: string) => void;
  highlightedUserId: string | null;
}

const statusColorMap: Record<UserStatus, string> = {
  [UserStatusEnum.Active]: 'bg-green-500/20 text-green-400',
  [UserStatusEnum.Pending]: 'bg-yellow-500/20 text-yellow-400',
  [UserStatusEnum.Disabled]: 'bg-red-500/20 text-red-400',
};

const TableSkeleton: React.FC = () => (
    <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-700 animate-pulse">
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                <td className="px-5 py-5"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                <td className="px-5 py-5"><div className="h-8 bg-gray-700 rounded w-28"></div></td>
                <td className="px-5 py-5"><div className="h-8 bg-gray-700 rounded w-28"></div></td>
                <td className="px-5 py-5"><div className="h-6 bg-gray-700 rounded-full w-24"></div></td>
                <td className="px-5 py-5"><div className="h-8 bg-gray-700 rounded w-full"></div></td>
            </tr>
        ))}
    </tbody>
);

const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, loading, onUpdateRole, onUpdateStatus, onUpdateDepartment, onAdminResetPassword, highlightedUserId }) => {
  return (
    <div className="content-panel overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-700/50">
            <tr className="border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3">Work Email</th>
              <th className="px-5 py-3">Personal Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          {loading ? <TableSkeleton /> : (
            <tbody>
              {users.map((user) => {
                const isPrimaryAdmin = user.email === 'shaikhussain098098@gmail.com';
                const controlsDisabled = isPrimaryAdmin || user.role === RoleEnum.Admin;
                const disableReason = isPrimaryAdmin ? "Primary admin account cannot be modified." : "Admin accounts cannot be modified by other admins via this panel.";

                return (
                <tr key={user.id} className={`border-b border-gray-700 ${user.id === highlightedUserId ? 'highlight-row' : ''}`}>
                  <td className="px-5 py-4 text-sm text-gray-300 font-mono">{user.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-300 font-mono">{user.personalEmail}</td>
                  <td className="px-5 py-4 text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
                      className="bg-gray-700 text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={controlsDisabled}
                      title={controlsDisabled ? disableReason : ''}
                    >
                      {Object.values(RoleEnum).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                   <td className="px-5 py-4 text-sm">
                    <select
                      value={user.department}
                      onChange={(e) => onUpdateDepartment(user.id, e.target.value as Department)}
                      className="bg-gray-700 text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={isPrimaryAdmin}
                      title={isPrimaryAdmin ? disableReason : ''}
                    >
                      {Object.values(DeptEnum).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${statusColorMap[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm space-x-2 flex items-center">
                    {user.status === UserStatusEnum.Pending && (
                       <button
                        onClick={() => onUpdateStatus(user.id, UserStatusEnum.Active)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={controlsDisabled}
                        title={controlsDisabled ? disableReason : ''}
                      >
                        Approve
                      </button>
                    )}
                    {user.status === UserStatusEnum.Active && (
                      <button
                        onClick={() => onUpdateStatus(user.id, UserStatusEnum.Disabled)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={controlsDisabled}
                        title={controlsDisabled ? disableReason : ''}
                      >
                        Disable
                      </button>
                    )}
                     {user.status === UserStatusEnum.Disabled && (
                      <button
                        onClick={() => onUpdateStatus(user.id, UserStatusEnum.Active)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={controlsDisabled}
                        title={controlsDisabled ? disableReason : ''}
                      >
                        Re-enable
                      </button>
                    )}
                    <button
                        onClick={() => onAdminResetPassword(user.id, user.email)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={controlsDisabled}
                        title={controlsDisabled ? disableReason : ''}
                    >
                        Reset Password
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default UserManagementTable;