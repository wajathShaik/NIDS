import React, { useState, useEffect, useCallback } from 'react';
import type { Drone } from '../types';
import { generateDroneData } from '../services/geminiService';
import { RefreshIcon, DroneIcon } from '../components/icons';

const statusStyles: Record<Drone['status'], { bg: string, text: string, icon: string }> = {
    Patrolling: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: ' घूम ' },
    Responding: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '🚨' },
    Charging: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '⚡' },
    Offline: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '🔌' },
};


const DroneSecurityPage: React.FC = () => {
    const [drones, setDrones] = useState<Drone[]>([]);
    const [events, setEvents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const droneData = await generateDroneData();
            setDrones(droneData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (drones.length === 0) return;
            const randomDrone = drones[Math.floor(Math.random() * drones.length)];
            const eventMessages = [
                `Drone ${randomDrone.id} detected movement in ${randomDrone.location}.`,
                `Drone ${randomDrone.id} confirmed perimeter secure at ${randomDrone.location}.`,
                `Drone ${randomDrone.id} returning to base for charging.`,
                `Drone ${randomDrone.id} commencing patrol route Gamma.`,
            ];
            const newEvent = `[${new Date().toLocaleTimeString()}] ${eventMessages[Math.floor(Math.random() * eventMessages.length)]}`;
            setEvents(prev => [newEvent, ...prev.slice(0, 100)]); // Keep last 100 events
        }, 5000); // New event every 5 seconds

        return () => clearInterval(interval);
    }, [drones]);

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">Autonomous Drone Security</h1>
                 <button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <RefreshIcon className={loading ? 'animate-spin' : ''} />
                    Refresh Fleet Status
                </button>
            </div>
             <p className="text-gray-400 mb-8 max-w-3xl">
                Monitor the real-time status and activity of the autonomous drone fleet responsible for physical asset protection and perimeter security.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 content-panel p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Fleet Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? Array.from({length: 8}).map((_, i) => (
                             <div key={i} className="bg-gray-700/50 p-4 rounded-lg animate-pulse h-24"></div>
                        )) : drones.map(drone => (
                            <div key={drone.id} className={`p-4 rounded-lg ${statusStyles[drone.status].bg}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg text-white">{drone.id}</span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${statusStyles[drone.status].bg} ${statusStyles[drone.status].text}`}>
                                        {statusStyles[drone.status].icon} {drone.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 mt-2">Location: {drone.location}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <progress value={drone.battery} max="100" className={`w-full h-2 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-bar]:bg-gray-600 [&::-webkit-progress-value]:rounded-lg ${drone.battery > 20 ? '[&::-webkit-progress-value]:bg-green-500' : '[&::-webkit-progress-value]:bg-red-500'}`}></progress>
                                    <span className="text-sm font-semibold text-white">{drone.battery}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1 content-panel p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Mission Event Log</h2>
                    <div className="bg-gray-900 rounded-lg p-3 h-96 overflow-y-auto font-mono text-xs text-gray-400 space-y-2">
                        {events.map((event, i) => (
                            <p key={i}>{event}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DroneSecurityPage;