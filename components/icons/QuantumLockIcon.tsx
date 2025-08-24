
import React from 'react';

export const QuantumLockIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 018.618-3.04 12.02 12.02 0 008.618-3.04z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5v1M12.5 12h-1M11.5 12h1M12 12.5v-1" />
    </svg>
);
