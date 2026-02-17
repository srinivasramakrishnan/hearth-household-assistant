import {
    Calendar,
    List,
    Inbox,
    Sun,
    CalendarDays,
    Trash2,
    ChevronDown,
    ChevronRight,
    Plus,
    ShoppingBasket,
    HelpCircle,
    Sparkles
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ShoppingList } from '../types';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    userEmail?: string | null;
    userId?: string;
    compact?: boolean;
}

export const Sidebar = ({ currentView, onNavigate, onLogout, userEmail, userId, compact }: SidebarProps) => {
    const [listsExpanded, setListsExpanded] = useState(true);

    // --- Data Fetching ---

    // 1. Collaborations
    const [collabSnapshotUID] = useCollection(
        userId ? query(collection(db, 'collaborations'), where('inviteeId', '==', userId)) : null
    );
    const [collabSnapshotEmail] = useCollection(
        userEmail ? query(collection(db, 'collaborations'), where('inviteeEmail', '==', userEmail)) : null
    );

    const allowedUserIds = useMemo(() => {
        if (!userId) return [];
        const idsFromUID = collabSnapshotUID?.docs.map(d => d.data().inviterId) || [];
        const idsFromEmail = collabSnapshotEmail?.docs.map(d => d.data().inviterId) || [];
        // Unique IDs, max 30 for Firestore 'in' query
        return [...new Set([userId, ...idsFromUID, ...idsFromEmail])].slice(0, 30);
    }, [collabSnapshotUID, collabSnapshotEmail, userId]);

    // 2. Lists
    const listQuery = useMemo(() =>
        allowedUserIds.length > 0
            ? query(collection(db, 'lists'), where('userId', 'in', allowedUserIds))
            : null
        , [allowedUserIds]);

    const [listsSnapshot] = useCollection(listQuery);

    const lists = useMemo(() =>
        listsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingList)) || [],
        [listsSnapshot]);

    const smartLists = [
        { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-500' },
        { id: 'today', label: 'Today', icon: Sun, color: 'text-yellow-500' },
        { id: 'next7days', label: 'Next 7 Days', icon: CalendarDays, color: 'text-purple-500' },
    ];

    const NavItem = ({ id, label, icon: Icon, color, count }: any) => (
        <button
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5
                ${currentView === id
                    ? 'bg-blue-100/50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
        >
            <Icon size={18} className={color} />
            <span className="flex-1 text-left truncate">{label}</span>
            {count > 0 && (
                <span className="text-xs text-slate-400 font-medium">{count}</span>
            )}
        </button>
    );

    return (
        <aside className="h-full flex flex-col py-4 px-2 overflow-y-auto bg-slate-50">
            {/* Smart Lists */}
            <div className="mb-6">
                {smartLists.map(list => (
                    <NavItem key={list.id} {...list} />
                ))}
            </div>

            {/* Lists Section */}
            <div className="mb-2">
                <div
                    className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors group"
                    onClick={() => setListsExpanded(!listsExpanded)}
                >
                    <div className="flex items-center gap-1">
                        {listsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>Lists</span>
                    </div>
                </div>

                {listsExpanded && (
                    <div className="mt-1">
                        {lists.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400 italic">No lists yet</p>
                        ) : (
                            lists.map(list => (
                                <NavItem
                                    key={list.id}
                                    id={list.id}
                                    label={list.name}
                                    icon={List}
                                    color="text-slate-400"
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
                <NavItem id="pantry" label="Pantry" icon={ShoppingBasket} color="text-green-600" />
                <NavItem id="calendar" label="Calendar" icon={Calendar} color="text-pink-500" />
                <NavItem id="help" label="Help" icon={HelpCircle} color="text-slate-400" />
                <NavItem id="landing" label="About Sam" icon={Sparkles} color="text-indigo-500" />
            </div>

        </aside>
    );
};
