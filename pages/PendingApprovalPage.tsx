import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldIcon, ClockIcon } from '../components/icons';
import AnimatedBackground from '../components/AnimatedBackground';

const PendingApprovalPage: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
            <AnimatedBackground />
            <div className="relative z-10 w-full max-w-md p-8 space-y-6 text-center material-thick rounded-2xl">
                <ShieldIcon className="w-12 h-12 mx-auto text-blue-500" />
                <h1 className="mt-4 text-3xl font-bold text-white">Registration Submitted</h1>
                <p className="mt-2 text-gray-300 leading-relaxed">
                    Thank you for verifying your email. Your account is now pending approval from a system administrator.
                </p>
                <p className="text-gray-400">
                    You will not be able to log in until your account has been activated.
                </p>
                <div className="mt-6">
                    <ClockIcon className="w-10 h-10 mx-auto text-yellow-400 animate-pulse" />
                </div>
                <div className="pt-4">
                     <Link to="/login" className="font-medium text-blue-400 hover:underline">
                        Return to Login Page
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalPage;