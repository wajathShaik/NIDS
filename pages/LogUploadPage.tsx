import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { generateAlertsFromLogContext } from '../services/geminiService';
import { logService, LogAction } from '../services/logService';
import { UploadIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

const LogUploadPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) return;

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // This is a simulation. In a real app, you'd upload the file to a server.
            // Here, we'll just use the file's metadata to prompt Gemini.
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time

            const newAlerts = await generateAlertsFromLogContext(file.name, file.type);
            
            // Fix: Persist the newly generated alerts into the main event store.
            await logService.addEvents(newAlerts);

            await logService.addLog({
                action: LogAction.LOGS_UPLOADED,
                userEmail: user.email,
                userId: user.id,
                details: `Ingested ${newAlerts.length} alerts from file: ${file.name}`
            });

            setSuccessMessage(`${newAlerts.length} new alerts were generated from ${file.name} and added to the platform! Redirecting...`);
            
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            console.error(err);
            setError("Failed to process the log file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">Log File Ingestion</h1>
            <div className="content-panel p-8 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
                    <label
                        htmlFor="dropzone-file"
                        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-colors ${dragActive ? 'border-blue-500 bg-gray-700' : ''}`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">LOG, TXT, CSV, or JSON files</p>
                            {file && <p className="mt-4 text-sm text-green-400">{file.name}</p>}
                        </div>
                        <input id="dropzone-file" type="file" className="absolute w-full h-full opacity-0" onChange={handleFileChange} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} />
                    </label>

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="w-full flex justify-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUploading ? 'Processing...' : 'Ingest Log File'}
                        </button>
                    </div>
                </form>
                {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
                {successMessage && <p className="mt-4 text-sm text-green-400 text-center">{successMessage}</p>}
            </div>
        </div>
    );
};

export default LogUploadPage;