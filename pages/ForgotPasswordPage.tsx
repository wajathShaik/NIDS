import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';
import { ShieldIcon } from '../components/icons';
import AnimatedBackground from '../components/AnimatedBackground';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            await logService.addLog({ action: LogAction.PASSWORD_RESET_REQUEST, userEmail: email });
            setMessage("If an account exists for this email, an OTP has been sent to your inbox.");
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 3000);
        } catch (err: any) {
            // To prevent email enumeration, we show a generic message even on error.
            setMessage("If an account exists for this email, an OTP has been sent to your inbox.");
            // Log the actual error for debugging
            console.error(err);
             setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
            <AnimatedBackground />
            <div className="relative z-10 w-full max-w-md p-8 space-y-6 material-thick rounded-2xl">
                <div className="text-center">
                    <ShieldIcon className="w-12 h-12 mx-auto text-blue-500" />
                    <h1 className="mt-4 text-3xl font-bold text-white">Reset Password</h1>
                    <p className="mt-2 text-gray-400">Enter your email to receive a reset OTP.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-300">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {message && <p className="text-sm text-green-400">{message}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full flex justify-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {loading ? 'Sending...' : 'Send Reset OTP'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-400">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-blue-400 hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;