import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VoiceprintAuthProps {
    onSuccess: () => void;
}

const VoiceprintAuth: React.FC<VoiceprintAuthProps> = ({ onSuccess }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState('Ready to analyze');
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const draw = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) return;

        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = '#0d1117';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#76e3ea';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        animationFrameRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const setupAudio = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Microphone not supported.');
                }
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
                analyserRef.current.fftSize = 2048;
                setStatus('Ready to analyze');
                draw();
            } catch (err) {
                setError('Microphone access denied. Please enable permissions.');
                setStatus('Error');
            }
        };

        setupAudio();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [draw]);

    const handleAnalyze = () => {
        if (error) return;
        setIsAnalyzing(true);
        setStatus('Analyzing voiceprint...');
        setTimeout(() => {
            setStatus('Voiceprint matched');
            setTimeout(onSuccess, 1000);
        }, 4000);
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <canvas ref={canvasRef} width="300" height="150" className="bg-gray-900 rounded-lg"></canvas>
            <p className="text-center">Please state the passphrase: <br/> <strong className="text-cyan-500">"Activate security matrix omega"</strong></p>
            <p className={`text-center font-medium ${
                status === 'Voiceprint matched' ? 'text-green-400' : 'text-gray-400'
            }`}>{status}</p>
            {error && <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>}
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !!error}
                className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50"
            >
                {isAnalyzing ? 'Analyzing...' : 'Authenticate with Voice'}
            </button>
        </div>
    );
};

export default VoiceprintAuth;
