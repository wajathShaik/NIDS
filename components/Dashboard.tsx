
import React from 'react';
import ThreatMap from './ThreatMap';
import ThreatFeed from './ThreatFeed';
import { ShieldIcon } from './icons';

const Dashboard: React.FC = () => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-semibold text-white">Security Command Center</h1>
                 <div className="flex items-center gap-2 text-green-400 glow-pulse-text">
                    <ShieldIcon className="h-6 w-6" />
                    <span className="font-medium">All Systems Nominal</span>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Threat Map */}
                <div className="lg:col-span-2 holographic-card p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Global Threat Activity</h2>
                    <ThreatMap />
                </div>
                
                {/* Side Threat Feed */}
                <div className="lg:col-span-1 holographic-card p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Critical Threat Feed</h2>
                    <ThreatFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;