import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
    id: string;
    title: string;
    date: string; // ISO string
    type: 'one-time' | 'recurring';
    created_by: string;
}

interface CalendarViewProps {
    userId: string;
    onBack: () => void;
}

export const CalendarView = ({ userId, onBack }: CalendarViewProps) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState('');

    useEffect(() => {
        // Query events created by user OR shared (collaborations logic needed ideally)
        // For simple v1: fetch all where created_by == userId
        const q = query(
            collection(db, 'family_schedule'),
            where('created_by', '==', userId)
            // orderBy('date', 'asc') // Requires composite index usually, can sort client side
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
            // Sort by date ascending
            fetchedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setEvents(fetchedEvents);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !newEventDate) return;

        await addDoc(collection(db, 'family_schedule'), {
            title: newEventTitle,
            date: new Date(newEventDate).toISOString(),
            type: 'one-time',
            created_by: userId,
            created_at: new Date().toISOString()
        });

        setNewEventTitle('');
        setNewEventDate('');
        setIsAdding(false);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm("Delete this event?")) {
            await deleteDoc(doc(db, 'family_schedule', eventId));
        }
    };

    // Group by date for display
    const groupedEvents = events.reduce((acc, event) => {
        const dateKey = new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, Event[]>);

    return (
        <div className="pb-24 px-6 pt-12 max-w-md mx-auto min-h-screen bg-surface">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="text-indigo-600" />
                    Family Calendar
                </h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Add Event Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <form onSubmit={handleAddEvent} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 space-y-3">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Event Title (e.g. Dentist Appt)"
                                className="w-full p-2 border-b border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="datetime-local"
                                    className="flex-1 p-2 bg-slate-50 rounded-lg text-sm text-slate-600 focus:ring-1 focus:ring-indigo-200 outline-none"
                                    value={newEventDate}
                                    onChange={e => setNewEventDate(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg font-semibold"
                                >
                                    Add Event
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Events List */}
            <div className="space-y-6">
                {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                    <div key={date}>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 sticky top-0 bg-surface py-2 z-10">
                            {date}
                        </h2>
                        <div className="space-y-3">
                            {dayEvents.map(event => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{event.title}</h3>
                                            <p className="text-sm text-slate-500">
                                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                {events.length === 0 && !isAdding && (
                    <div className="text-center py-20 text-slate-400">
                        <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No upcoming events.<br />Enjoy your free time!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
