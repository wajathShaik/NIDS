import React from 'react';

export const ArrowDownIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
