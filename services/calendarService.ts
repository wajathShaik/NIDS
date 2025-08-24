
import type { CalendarEvent, Department } from '../types';

const CALENDAR_KEY = 'nids_xai_calendar';

const getCalendarFromStorage = (): CalendarEvent[] => {
    const data = localStorage.getItem(CALENDAR_KEY);
    return data ? JSON.parse(data) : [];
};

const saveCalendarToStorage = (events: CalendarEvent[]) => {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(events));
};

type EventInput = Omit<CalendarEvent, 'id'>;

export const calendarService = {
    async getEventsForDepartment(department: Department): Promise<CalendarEvent[]> {
        const allEvents = getCalendarFromStorage();
        return allEvents
            .filter(event => event.department === department)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    async createEvent(eventInput: EventInput): Promise<CalendarEvent> {
        const allEvents = getCalendarFromStorage();
        const newEvent: CalendarEvent = {
            id: `event-${Date.now()}`,
            ...eventInput,
        };
        allEvents.push(newEvent);
        saveCalendarToStorage(allEvents);
        return newEvent;
    },
};
