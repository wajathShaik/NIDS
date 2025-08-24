
import type { InboxMessage } from '../types';

const INBOX_KEY = 'nids_xai_inbox';

const getInboxFromStorage = (): InboxMessage[] => {
    const data = localStorage.getItem(INBOX_KEY);
    return data ? JSON.parse(data) : [];
};

const saveInboxToStorage = (messages: InboxMessage[]) => {
    localStorage.setItem(INBOX_KEY, JSON.stringify(messages));
};

type MessageInput = Omit<InboxMessage, 'id' | 'timestamp' | 'read'>;

export const inboxService = {
    async getMessagesForUser(userId: string): Promise<InboxMessage[]> {
        const allMessages = getInboxFromStorage();
        return allMessages
            .filter(msg => msg.toUserId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    async getUnreadCount(userId: string): Promise<number> {
        const allMessages = getInboxFromStorage();
        return allMessages.filter(msg => msg.toUserId === userId && !msg.read).length;
    },

    async sendMessage(messageInput: MessageInput): Promise<void> {
        const allMessages = getInboxFromStorage();
        const newMessage: InboxMessage = {
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: false,
            ...messageInput,
        };
        allMessages.unshift(newMessage);
        saveInboxToStorage(allMessages);
    },

    async markMessageAsRead(messageId: string, userId: string): Promise<void> {
        const allMessages = getInboxFromStorage();
        const message = allMessages.find(msg => msg.id === messageId && msg.toUserId === userId);
        if (message && !message.read) {
            message.read = true;
            saveInboxToStorage(allMessages);
        }
    },
};
