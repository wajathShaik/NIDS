import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { logService, LogAction } from '../services/logService';
import { ShieldIcon } from '../components/icons';
import AnimatedBackground from '../components/AnimatedBackground';
import MockInbox from '../components/MockInbox';

const VerifyAccountPage: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await authService.verifyAccount(email, otp);
            await logService.addLog({ action: LogAction.ACCOUNT_VERIFIED, userEmail: email });
            navigate('/pending-approval');
        } catch (err: any) {
            setError(err.message || 'Failed to verify account.');
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
                    <h1 className="mt-4 text-3xl font-bold text-white">Verify Your Account</h1>
                    <p className="mt-2 text-gray-400">An OTP has been sent to your inbox for {email}.</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="otp" className="text-sm font-medium text-gray-300">Enter OTP</label>
                        <input
                            id="otp"
                            name="otp"
                            type="text"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    </div>
                </form>

                <MockInbox email={email} />

                 <p className="text-sm text-center text-gray-400">
                    Entered the wrong email?{' '}
                    <Link to="/register" className="font-medium text-blue-400 hover:underline">
                        Register again
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyAccountPage;