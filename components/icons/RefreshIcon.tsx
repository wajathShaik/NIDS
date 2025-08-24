import React from 'react';

export const RefreshIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 11A8.1 8.1 0 004.5 9.5M4 5v5h5M4 13a8.1 8.1 0 0015.5 1.5M20 19v-5h-5" />
    </svg>
);
