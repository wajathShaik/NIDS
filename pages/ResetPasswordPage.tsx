import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { ShieldIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import AnimatedBackground from '../components/AnimatedBackground';
import MockInbox from '../components/MockInbox';

const ResetPasswordPage: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const isPasswordStrong = (password: string): boolean => {
      return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!isPasswordStrong(password)) {
            setError("Password is not strong enough.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await authService.resetPassword(email, otp, password);
            await logService.addLog({ action: LogAction.PASSWORD_RESET_SUCCESS, userEmail: email });
            setMessage('Password has been reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
            <AnimatedBackground />
            <div className="relative z-10 w-full max-w-md p-8 space-y-6 material-thick rounded-2xl">
                <div className="text-center">
                    <ShieldIcon className="w-12 h-12 mx-auto text-blue-500" />
                    <h1 className="mt-4 text-3xl font-bold text-white">Set New Password</h1>
                    <p className="mt-2 text-gray-400">Enter the OTP from your inbox and your new password for {email}.</p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="otp" className="text-sm font-medium text-gray-300">OTP Code</label>
                        <input
                            id="otp" type="text" required value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="text-sm font-medium text-gray-300">New Password</label>
                        <div className="relative">
                            <input
                                id="password" type={showPassword ? 'text' : 'password'} required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md pr-10"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-1 flex items-center px-3 text-gray-400 hover:text-white">
                                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password"className="text-sm font-medium text-gray-300">Confirm New Password</label>
                        <input
                            id="confirm-password" type="password" required value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {message && <p className="text-sm text-green-400">{message}</p>}
                    <div>
                        <button type="submit" disabled={loading || !!message} className="w-full flex justify-center mt-2 px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                            {loading ? 'Resetting...' : 'Set New Password'}
                        </button>
                    </div>
                </form>

                <MockInbox email={email} />

                 <p className="text-sm text-center text-gray-400">
                    <Link to="/login" className="font-medium text-blue-400 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;