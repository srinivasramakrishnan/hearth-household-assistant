import { useState, useMemo } from 'react';
import { Plus, HelpCircle } from 'lucide-react';
import { ListCard } from '../components/ListCard';
import { TabSwitcher } from '../components/TabSwitcher';
import { ExpandedListView } from '../components/ExpandedListView';
import {
    collection,
    addDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import type { ShoppingList, ListItem, PantryItem } from '../types';

import { UserMenu } from '../components/UserMenu';

interface AllListsViewProps {
    userId: string;
    userName?: string | null;
    userEmail?: string | null;
    isAdmin?: boolean;
    onLogout: () => void;
    onBack: () => void;
    onNavigateToHelp: () => void;
}

export const AllListsView = ({ userId, userName, userEmail, isAdmin, onLogout, onBack, onNavigateToHelp }: AllListsViewProps) => {
    const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');
    const [expandedListId, setExpandedListId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');

    // --- Data Fetching ---

    // 0. Collaborations (Shared with me)
    // We check both inviteeId (legacy/direct) and inviteeEmail (new flow)
    const [collabSnapshotUID] = useCollection(
        query(collection(db, 'collaborations'), where('inviteeId', '==', userId))
    );
    const [collabSnapshotEmail] = useCollection(
        userEmail ? query(collection(db, 'collaborations'), where('inviteeEmail', '==', userEmail)) : null
    );

    const allowedUserIds = useMemo(() => {
        const idsFromUID = collabSnapshotUID?.docs.map(d => d.data().inviterId) || [];
        const idsFromEmail = collabSnapshotEmail?.docs.map(d => d.data().inviterId) || [];

        // Firestore 'in' limit is 30. We prioritize the current user + first 29 collaborators.
        const allIds = [userId, ...idsFromUID, ...idsFromEmail];
        return [...new Set(allIds)].slice(0, 30);
    }, [collabSnapshotUID, collabSnapshotEmail, userId]);

    // 1. Lists
    const listQuery = useMemo(() =>
        allowedUserIds.length > 0
            ? query(collection(db, 'lists'), where('userId', 'in', allowedUserIds))
            : null
        , [allowedUserIds]);

    const [listsSnapshot] = useCollection(listQuery);

    const lists = useMemo(() =>
        listsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingList)) || [],
        [listsSnapshot]);

    // 2. All Items (for counts)
    const itemsQuery = useMemo(() =>
        allowedUserIds.length > 0
            ? query(collection(db, 'items'), where('userId', 'in', allowedUserIds), where('isBought', '==', false))
            : null
        , [allowedUserIds]);

    const [itemsSnapshot] = useCollection(itemsQuery);

    const allItems = useMemo(() =>
        itemsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [],
        [itemsSnapshot]);

    // 3. All Pantry Items (for counts)
    const pantryQuery = useMemo(() =>
        allowedUserIds.length > 0
            ? query(collection(db, 'pantry'), where('userId', 'in', allowedUserIds))
            : null
        , [allowedUserIds]);

    const [pantrySnapshot] = useCollection(pantryQuery);

    const allPantryItems = useMemo(() =>
        pantrySnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as PantryItem)) || [],
        [pantrySnapshot]);

    // --- Derived State ---

    const getListStats = (listId: string) => {
        const itemsCount = allItems.filter(i => i.listId === listId).length;
        const pantryCount = allPantryItems.filter(i => i.sourceListId === listId).length;
        return { itemsCount, pantryCount };
    };

    const getColorForList = (index: number) => {
        const colors = ['purple', 'blue', 'yellow', 'green', 'pink'] as const;
        return colors[index % colors.length];
    };

    // --- Handlers ---

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) {
            setIsCreating(false);
            return;
        }

        const docRef = await addDoc(collection(db, 'lists'), {
            userId,
            name: newListName,
            createdAt: Date.now(),
            ownerEmail: '' // Optional or verify auth provider
        });

        setNewListName('');
        setIsCreating(false);
        // Optionally expand the new list immediately
        setExpandedListId(docRef.id);
    };

    // --- Render ---

    // 1. Expanded View?
    if (expandedListId) {
        const list = lists.find(l => l.id === expandedListId);
        if (list) {
            const index = lists.findIndex(l => l.id === expandedListId);
            return (
                <div className="pb-24 px-6 pt-12 max-w-md mx-auto min-h-screen bg-surface">
                    <ExpandedListView
                        listId={list.id}
                        listName={list.name}
                        userId={userId} // Pass userId so we know who is viewing
                        variant={getColorForList(index)}
                        activeTab={activeTab}
                        onBack={() => setExpandedListId(null)}
                    />
                </div>
            );
        }
    }

    // 2. Main List View
    return (
        <div className="pb-24 px-6 pt-12 max-w-md mx-auto min-h-screen bg-surface">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <UserMenu userName={userName} userId={userId} isAdmin={isAdmin} onLogout={onLogout} />
                <div className="flex gap-3">
                    <button
                        onClick={onNavigateToHelp}
                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        aria-label="Help"
                    >
                        <HelpCircle size={24} />
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
                        aria-label="Create New List"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content */}
            <div className="grid grid-cols-1 gap-4">
                {/* Creation Card */}
                {isCreating && (
                    <div className="rounded-[var(--radius-xl)] p-6 bg-slate-100 material-shadow-1 border-2 border-dashed border-slate-300">
                        <form onSubmit={handleCreateList}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="List Name..."
                                className="w-full bg-transparent text-xl font-bold placeholder-slate-400 focus:outline-none"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                onBlur={() => !newListName && setIsCreating(false)}
                                onKeyDown={e => e.key === 'Escape' && setIsCreating(false)}
                            />
                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lists */}
                {lists.length === 0 && !isCreating ? (
                    <div className="text-center py-10 opacity-50">
                        <p>No lists found. Click + to create one.</p>
                    </div>
                ) : (
                    lists.map((list, index) => {
                        const { itemsCount, pantryCount } = getListStats(list.id);
                        return (
                            <ListCard
                                key={list.id}
                                title={list.name}
                                itemsCount={itemsCount}
                                pantryCount={pantryCount}
                                variant={getColorForList(index)}
                                activeTab={activeTab}
                                onClick={() => setExpandedListId(list.id)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
