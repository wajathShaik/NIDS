
import React, { useState } from 'react';
import { otpService } from '../services/otpService';

interface MockInboxProps {
    email: string;
}

const MockInbox: React.FC<MockInboxProps> = ({ email }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [otp, setOtp] = useState<string | null>(null);

    const checkInbox = async () => {
        const fetchedOtp = await otpService.getOtpForEmail(email);
        setOtp(fetchedOtp);
        setIsOpen(true);
    };

    const closeModal = () => setIsOpen(false);

    return (
        <>
            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={checkInbox}
                    className="text-sm font-medium text-blue-400 hover:underline"
                >
                    ✉️ Check Development Inbox for OTP
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-6 transform transition-all">
                        <h3 className="text-lg font-bold text-white text-center">Development Inbox</h3>
                        <p className="mt-2 text-sm text-gray-400 text-center">For: {email}</p>
                        <div className="mt-4 p-4 bg-gray-900 rounded-lg text-center">
                            {otp ? (
                                <>
                                    <p className="text-gray-300">Your One-Time Password is:</p>
                                    <p className="text-3xl font-bold text-green-400 tracking-widest my-2">{otp}</p>
                                    <p className="text-xs text-gray-500">This code will expire in 5 minutes.</p>
                                </>
                            ) : (
                                <p className="text-yellow-400">No active OTP found. It may have expired or already been used.</p>
                            )}
                        </div>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MockInbox;
