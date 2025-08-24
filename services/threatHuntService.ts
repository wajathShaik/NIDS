import type { Hunt } from '../types';

const THREAT_HUNTS_KEY = 'nids_xai_threat_hunts';

const getHuntsFromStorage = (): Hunt[] => {
    const data = localStorage.getItem(THREAT_HUNTS_KEY);
    return data ? JSON.parse(data) : [];
};

const saveHuntsToStorage = (hunts: Hunt[]) => {
    localStorage.setItem(THREAT_HUNTS_KEY, JSON.stringify(hunts));
};

export const threatHuntService = {
    async getHunts(): Promise<Hunt[]> {
        const hunts = getHuntsFromStorage();
        return hunts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async saveHunt(hunt: Hunt): Promise<Hunt> {
        let hunts = getHuntsFromStorage();
        const existingIndex = hunts.findIndex(h => h.id === hunt.id);

        if (existingIndex > -1) {
            hunts[existingIndex] = hunt;
        } else {
            hunts.unshift(hunt);
        }
        
        saveHuntsToStorage(hunts);
        return hunt;
    },

    async deleteHunt(huntId: string): Promise<void> {
        let hunts = getHuntsFromStorage();
        hunts = hunts.filter(h => h.id !== huntId);
        saveHuntsToStorage(hunts);
    },
};
