import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { generateSopByTopic } from '../services/geminiService';
import { SopIcon } from '../components/icons';

const sopTopics = [
    "Phishing Attack Response",
    "Malware Outbreak Containment",
    "Denial-of-Service (DoS) Mitigation",
    "Insider Threat Detection",
    "Data Exfiltration Incident",
    "Web Server Compromise",
    "Brute Force Attack on VPN",
];


const SopPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [sopContent, setSopContent] = useState('');
    const [loadingSop, setLoadingSop] = useState(false);

    const fetchSop = useCallback(async (topic: string) => {
        if (!user) return;
        setLoadingSop(true);
        setSelectedTopic(topic);
        const content = await generateSopByTopic(topic);
        setSopContent(content);
        setLoadingSop(false);
    }, [user]);
    
    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-2">SOP Library</h1>
            <p className="text-gray-400 mb-6">Select a scenario to generate a detailed Standard Operating Procedure.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 content-panel p-6 self-start">
                     <h2 className="text-xl font-semibold text-white mb-4">Incident Scenarios</h2>
                     <div className="space-y-2">
                        {sopTopics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => fetchSop(topic)}
                                disabled={loadingSop}
                                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${selectedTopic === topic ? 'bg-blue-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                {topic}
                            </button>
                        ))}
                     </div>
                </div>

                <div className="lg:col-span-2 content-panel p-6">
                     <h2 className="text-xl font-semibold text-white mb-4">
                        {selectedTopic ? `SOP: ${selectedTopic}` : 'Select a Scenario'}
                     </h2>
                    {loadingSop ? (
                        <div className="prose prose-invert max-w-none animate-pulse">
                            <div className="h-6 w-1/2 bg-gray-700 rounded mb-4"></div>
                            <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
                            <div className="h-4 w-3/4 bg-gray-700 rounded mb-6"></div>
                            <div className="h-6 w-1/3 bg-gray-700 rounded mb-4"></div>
                            <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
                             <div className="h-4 w-5/6 bg-gray-700 rounded mb-2"></div>
                        </div>
                    ) : sopContent ? (
                         <div
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: sopContent.replace(/\n/g, '<br />') }}
                         />
                    ) : (
                        <div className="text-center text-gray-500 py-16">
                            <SopIcon className="h-16 w-16 mx-auto mb-4" />
                            <p>Select an incident scenario from the list to view the corresponding procedure.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SopPage;