

import type { User, LogEntry, LogAction, Alert } from '../types';
import { generateInitialEvents } from './geminiService';

const LOGS_KEY = 'nids_xai_audit_logs';
const EVENTS_KEY = 'nids_xai_log_events';

export { LogAction } from '../types';

type LogInput = {
    action: LogAction;
    userEmail: string;
    userId?: string;
    details?: string;
}

const initializeSimulatedEvents = async () => {
    if (!localStorage.getItem(EVENTS_KEY)) {
        console.log("No simulated events found. Generating initial data lake of 500 events...");
        try {
            // Generate in batches to avoid exceeding the model's output token limit.
            const batchSize = 100;
            const numBatches = 5;
            let allEvents: Alert[] = [];
            
            for (let i = 0; i < numBatches; i++) {
                console.log(`Generating batch ${i + 1} of ${numBatches}...`);
                const events = await generateInitialEvents(batchSize);
                allEvents = allEvents.concat(events);
                 // Add a small delay between API calls to be a good citizen.
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            localStorage.setItem(EVENTS_KEY, JSON.stringify(allEvents));
            console.log(`Successfully generated and stored ${allEvents.length} events.`);
        } catch (e) {
            console.error("Failed to initialize simulated event data lake:", e);
        }
    }
};

// Initialize on load
initializeSimulatedEvents();


const parseQuery = (query: string): ((event: Alert) => boolean)[] => {
    if (!query.trim()) return [];

    const filters: ((event: Alert) => boolean)[] = [];
    // Regex to split by AND/OR, preserving the operators
    const parts = query.split(/\s+(AND|OR)\s+/i);

    let logic: 'AND' | 'OR' = 'AND';

    for (const part of parts) {
        if (part.toUpperCase() === 'AND' || part.toUpperCase() === 'OR') {
            logic = part.toUpperCase() as 'AND' | 'OR';
            continue;
        }

        const match = part.match(/^(\w+)\s*=\s*"?([^"]+)"?$/);
        if (match) {
            const [, key, value] = match;
            const filterFunc = (event: Alert) => {
                const eventValue = event[key as keyof Alert];
                return String(eventValue).toLowerCase() === value.toLowerCase();
            };

            if (logic === 'OR' && filters.length > 0) {
                const lastFilter = filters.pop()!;
                filters.push((event: Alert) => lastFilter(event) || filterFunc(event));
            } else {
                filters.push(filterFunc);
            }
        }
    }
    return filters;
};


export const logService = {
  async getLogs(): Promise<LogEntry[]> {
    const logs = localStorage.getItem(LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  },

  async addLog(logInput: LogInput): Promise<void> {
    const logs = await this.getLogs();
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      userId: logInput.userId,
      userEmail: logInput.userEmail,
      action: logInput.action,
      details: logInput.details || '',
    };
    logs.unshift(newLog); // Add to the beginning
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500))); // Keep max 500 logs
  },
  
  async addEvents(newEvents: Alert[]): Promise<void> {
      const eventsJSON = localStorage.getItem(EVENTS_KEY);
      const allEvents: Alert[] = eventsJSON ? JSON.parse(eventsJSON) : [];
      // Prepend new events so they appear at the top of sorted lists.
      const updatedEvents = [...newEvents, ...allEvents];
      localStorage.setItem(EVENTS_KEY, JSON.stringify(updatedEvents));
  },

  async searchEvents(query: string): Promise<Alert[]> {
      const eventsJSON = localStorage.getItem(EVENTS_KEY);
      if (!eventsJSON) return [];

      const allEvents: Alert[] = JSON.parse(eventsJSON);
      if (!query.trim()) return allEvents;

      const filters = parseQuery(query);
      if (filters.length === 0) return allEvents;

      return allEvents.filter(event => 
          filters.every(filterFunc => filterFunc(event))
      );
  }
};