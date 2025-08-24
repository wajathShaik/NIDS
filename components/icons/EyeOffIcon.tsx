import React from 'react';

export const EyeOffIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 013.548-5.118m4.912-1.396A10.003 10.003 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-1.423 2.994m-4.042 1.055a3 3 0 01-4.242 0m4.242 0a3 3 0 00-4.242 0m-2.122-2.122a3 3 0 014.242 0M3 3l18 18" />
    </svg>
);