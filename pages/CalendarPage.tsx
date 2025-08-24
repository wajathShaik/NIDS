
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { calendarService } from '../services/calendarService';
import type { CalendarEvent } from '../types';

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Event Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');

    const fetchEvents = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const deptEvents = await calendarService.getEventsForDepartment(user.department);
        setEvents(deptEvents);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !date) return;
        await calendarService.createEvent({
            department: user.department,
            title,
            date,
            description,
            createdBy: user.email,
        });
        // Reset form and close modal
        setTitle('');
        setDate('');
        setDescription('');
        setIsModalOpen(false);
        // Refresh events list
        fetchEvents();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-white">
                    {user?.department} Calendar
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    Add Event
                </button>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                {loading ? (
                    <p className="text-gray-400">Loading events...</p>
                ) : events.length === 0 ? (
                    <p className="text-gray-400">No events scheduled for this department.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="font-bold text-blue-400">{event.date}</p>
                                <h3 className="text-lg font-semibold text-white mt-1">{event.title}</h3>
                                {event.description && <p className="text-gray-300 mt-1">{event.description}</p>}
                                <p className="text-xs text-gray-500 mt-2">Created by: {event.createdBy}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Add New Event</h3>
                        <form onSubmit={handleCreateEvent}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-gray-700 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-300">Date</label>
                                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-gray-700 rounded-md"/>
                                </div>
                                 <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description (Optional)</label>
                                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 mt-1 bg-gray-700 rounded-md"></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-700 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 rounded-md">Create Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
