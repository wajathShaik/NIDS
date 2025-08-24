
import React from 'react';

export const DroneIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M19.07 4.93a10 10 0 00-14.14 0 10 10 0 000 14.14 10 10 0 0014.14 0 10 10 0 000-14.14zM10 6v2a2 2 0 104 0V6h2v2a4 4 0 11-8 0V6h2zm-2 8v-2a4 4 0 118 0v2h-2v-2a2 2 0 10-4 0v2H8z" clipRule="evenodd" />
    </svg>
);
