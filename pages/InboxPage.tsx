
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { inboxService } from '../services/inboxService';
import type { InboxMessage } from '../types';

const InboxPage: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const userMessages = await inboxService.getMessagesForUser(user.id);
        setMessages(userMessages);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleSelectMessage = (message: InboxMessage) => {
        setSelectedMessage(message);
        if (!message.read && user) {
            inboxService.markMessageAsRead(message.id, user.id).then(() => {
                // Refresh messages to update read status visually
                setMessages(msgs => msgs.map(m => m.id === message.id ? {...m, read: true} : m));
            });
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-semibold text-white mb-6">NIDS Inbox</h1>
            <div className="flex bg-gray-800 rounded-xl shadow-lg overflow-hidden" style={{ minHeight: '70vh' }}>
                {/* Message List */}
                <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
                    {loading ? (
                         <p className="p-4 text-gray-400">Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p className="p-4 text-gray-400">Your inbox is empty.</p>
                    ) : (
                        <ul>
                            {messages.map(msg => (
                                <li
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 ${selectedMessage?.id === msg.id ? 'bg-blue-900/50' : ''}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className={`font-bold ${!msg.read ? 'text-white' : 'text-gray-300'}`}>{msg.from}</p>
                                        {!msg.read && <span className="h-2 w-2 bg-blue-500 rounded-full"></span>}
                                    </div>
                                    <p className={`truncate ${!msg.read ? 'text-gray-200' : 'text-gray-400'}`}>{msg.subject}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Message View */}
                <div className="w-2/3 p-6">
                    {selectedMessage ? (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedMessage.subject}</h2>
                            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                                <div>
                                    <p className="text-gray-300">From: <span className="font-semibold">{selectedMessage.from}</span></p>
                                </div>
                                <p className="text-sm text-gray-500">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
                            </div>
                            <div
                                className="prose prose-invert prose-sm max-w-none text-gray-300"
                                dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a message to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InboxPage;
