import React from 'react';

export const PentagonIcon: React.FC<{ className?: string }> = ({ className = "h-8 w-8 text-white" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l9.5 7.5-3.5 11.5h-12l-3.5-11.5L12 2.5z" />
    </svg>
);
