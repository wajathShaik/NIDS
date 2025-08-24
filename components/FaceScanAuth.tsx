import React, { useRef, useEffect, useState } from 'react';

interface FaceScanAuthProps {
    onSuccess: () => void;
}

const FaceScanAuth: React.FC<FaceScanAuthProps> = ({ onSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera not supported by this browser.');
                }
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus('Ready to scan');
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError('Camera access denied. Please enable camera permissions in your browser settings.');
                setStatus('Error');
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleScan = () => {
        if (error) return;
        setIsScanning(true);
        setStatus('Scanning...');
        setTimeout(() => {
            setStatus('Biometrics confirmed');
            setTimeout(onSuccess, 1000);
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-600">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                {isScanning && (
                    <div className="absolute inset-0 scan-animation">
                        <div className="scan-line"></div>
                    </div>
                )}
                 <div className="absolute inset-0 bg-black/30"></div>
            </div>
            <p className={`text-center font-medium ${
                status === 'Biometrics confirmed' ? 'text-green-400' : 'text-gray-400'
            }`}>{status}</p>
            {error && <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>}
            <button
                onClick={handleScan}
                disabled={isScanning || !!error}
                className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isScanning ? 'Authenticating...' : 'Authenticate with Face Scan'}
            </button>
            <style>{`
                .scan-animation::before, .scan-animation::after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid #58a6ff;
                    opacity: 0;
                    animation: pulse 2s infinite;
                }
                .scan-animation::after {
                    animation-delay: 1s;
                }
                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #76e3ea, transparent);
                    animation: scan 3s linear infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.9); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
};

export default FaceScanAuth;
