import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    if (!user) return null;

    const isPasswordStrong = (password: string): boolean => {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
      return password.length >= 12 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!isPasswordStrong(newPassword)) {
            setError("New password is not strong enough. It must be at least 12 characters and include uppercase, lowercase, number, and special characters.");
            return;
        }
        
        setLoading(true);
        try {
            await authService.userChangePassword(user.id, oldPassword, newPassword);
            await logService.addLog({
                action: LogAction.USER_PASSWORD_CHANGED,
                userEmail: user.email,
                userId: user.id
            });
            setSuccess("Password changed successfully!");
            // Clear fields
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Profile & Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Details Card */}
                <div className="content-panel p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-400">Email Address</label>
                            <p className="text-white font-mono">{user.email}</p>
                        </div>
                         <div>
                            <label className="text-sm text-gray-400">Role</label>
                            <p className="text-white">{user.role}</p>
                        </div>
                         <div>
                            <label className="text-sm text-gray-400">Department</label>
                            <p className="text-white">{user.department}</p>
                        </div>
                         <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <p className="text-green-400">{user.status}</p>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="content-panel p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-300">Current Password</label>
                             <div className="relative">
                                <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-md pr-10"/>
                                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute inset-y-0 right-0 top-1 flex items-center px-3 text-gray-400">
                                    {showOld ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                             </div>
                        </div>
                         <div>
                            <label className="text-sm text-gray-300">New Password</label>
                             <div className="relative">
                                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-md pr-10"/>
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 top-1 flex items-center px-3 text-gray-400">
                                    {showNew ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                             </div>
                        </div>
                         <div>
                            <label className="text-sm text-gray-300">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-md"/>
                        </div>
                         {error && <p className="text-sm text-red-400">{error}</p>}
                         {success && <p className="text-sm text-green-400">{success}</p>}
                        <div>
                            <button type="submit" disabled={loading} className="w-full px-4 py-2 mt-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;