
import React from 'react';
import type { TimelineEvent } from '../types';
import { FileTextIcon, BellIcon, EvidenceIcon, UserIcon } from './icons';

interface InvestigationTimelineProps {
    timeline: TimelineEvent[];
}

const getIconForType = (type: TimelineEvent['type']) => {
    switch (type) {
        case 'alert':
            return <BellIcon className="h-5 w-5 text-red-400" />;
        case 'evidence':
            return <EvidenceIcon className="h-5 w-5 text-blue-400" />;
        case 'log':
            return <FileTextIcon className="h-5 w-5 text-yellow-400" />;
        case 'note':
            return <UserIcon className="h-5 w-5 text-green-400" />;
        default:
            return null;
    }
};

const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({ timeline }) => {
    if (timeline.length === 0) {
        return <p className="text-gray-400">No timeline events recorded.</p>;
    }
    
    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {timeline.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== timeline.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-600" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center ring-8 ring-gray-800">
                                        {getIconForType(event.type)}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {event.title} by <span className="font-medium text-white">{event.author}</span>
                                        </p>
                                        <p className="mt-1 text-sm text-gray-300">{event.description}</p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InvestigationTimeline;
