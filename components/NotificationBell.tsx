
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { inboxService } from '../services/inboxService';
import { BellIcon } from './icons';

const NotificationBell: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (user) {
                const count = await inboxService.getUnreadCount(user.id);
                setUnreadCount(count);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, [user]);

    return (
        <button onClick={() => navigate('/inbox')} className="relative text-gray-400 hover:text-white">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
