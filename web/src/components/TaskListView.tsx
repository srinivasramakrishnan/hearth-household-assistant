import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, collection, where, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TaskItem } from './TaskItem';
import { moveItemToPantry } from '../lib/logic';
import type { ListItem } from '../types';

interface TaskListViewProps {
    viewId: string;
    userId: string;
}

export const TaskListView = ({ viewId, userId }: TaskListViewProps) => {
    const [newItemName, setNewItemName] = useState('');
    const [viewTitle, setViewTitle] = useState('Today');
    const [currentListId, setCurrentListId] = useState<string | null>(null);

    // --- Query Logic ---
    // 1. Determine if it's a Smart View or a List View
    const isSmartView = ['inbox', 'today', 'next7days', 'trash'].includes(viewId);

    // 2. Fetch List Details (if not smart View) to get title
    useEffect(() => {
        const fetchListDetails = async () => {
            if (isSmartView) {
                const titles: Record<string, string> = {
                    'inbox': 'Inbox',
                    'today': 'Today',
                    'next7days': 'Next 7 Days',
                    'trash': 'Trash'
                };
                setViewTitle(titles[viewId] || 'Tasks');
                setCurrentListId(null);
            } else {
                // Fetch list name
                const listDoc = await getDoc(doc(db, 'lists', viewId));
                if (listDoc.exists()) {
                    setViewTitle(listDoc.data().name);
                    setCurrentListId(viewId);
                }
            }
        };
        fetchListDetails();
    }, [viewId, isSmartView]);


    // 3. Query Items
    let q = null;
    if (isSmartView) {
        if (viewId === 'today') {
            // For now, "Today" will just show EVERYTHING for the user as we don't have due dates yet
            // Or strictly "Inbox" items if we want to differentiate.
            // Let's make "Today" = All unbought items for now to populate the view
            q = query(collection(db, 'items'), where('userId', '==', userId), where('isBought', '==', false));
        } else if (viewId === 'inbox') {
            // Items with no listId? Or strictly "General" list?
            // For now let's map Inbox to "General" list if it exists, or just all items
            q = query(collection(db, 'items'), where('userId', '==', userId), where('isBought', '==', false));
        } else {
            q = query(collection(db, 'items'), where('userId', '==', userId), where('isBought', '==', false));
        }
    } else {
        q = query(collection(db, 'items'), where('listId', '==', viewId), where('isBought', '==', false));
    }

    const [itemsSnapshot, loading, error] = useCollection(q);
    const items = itemsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [];

    // --- Handlers ---

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        // If in a specific list, add to that list.
        // If in Smart View, add to "Inbox" (or General).

        let targetListId = currentListId;

        if (!targetListId) {
            // Find "General" list or create it
            // For MVP, if we are in "Today" view, let's just not support add or alert user
            // Better: find a default list.
            // Let's try to find "General" list for userId
            // ... (Simple workaround: require explicit list selection or assume first found list)
            console.warn("Adding to default list not fully implemented in frontend smart view yet");
            return;
        }

        try {
            // Check for duplicate in this list
            const existing = items.find(i => i.name.toLowerCase() === newItemName.trim().toLowerCase());
            if (existing) {
                await updateDoc(doc(db, 'items', existing.id), { quantity: increment(1) });
            } else {
                await addDoc(collection(db, 'items'), {
                    userId,
                    listId: targetListId,
                    name: newItemName,
                    isBought: false,
                    quantity: 1,
                    addedAt: Date.now()
                });
            }
            setNewItemName('');
        } catch (err) {
            console.error("Error adding item:", err);
        }
    };

    const handleToggle = async (item: ListItem) => {
        // "Buying" the item -> Move to Pantry
        // We need the list name for the pantry logic
        // If we are in smart view, we might not know the list name easily without fetching the list doc
        // BUT, the item has 'listId'.

        // Optimization: Pass listName if known, or fetch it in moveItemToPantry
        // For now let's assume moveItemToPantry can handle it or we pass a placeholder.
        await moveItemToPantry(userId, item, viewTitle); // viewTitle might be "Today" which is wrong...
        // TODO: Fix Pantry ListName logic to look up list name from ID if not provided
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-8 py-6 pb-2">
                <div className="flex items-center gap-2 mb-4">
                    <h1 className="text-2xl font-bold text-slate-900">{viewTitle}</h1>
                </div>

                {/* Quick Add Bar */}
                {currentListId && (
                    <form onSubmit={handleAddItem} className="relative group">
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={`Add a task to "${viewTitle}"...`}
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-none focus:ring-2 focus:ring-indigo-100 rounded-lg py-3 pl-10 pr-4 text-base transition-all outline-none placeholder-slate-400"
                        />
                    </form>
                )}
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <p>No tasks found.</p>
                    </div>
                ) : (
                    <div className="">
                        {items.map(item => (
                            <TaskItem
                                key={item.id}
                                item={item}
                                onToggle={handleToggle}
                                // In smart view, we ideally want to show which list it comes from
                                listName={isSmartView ? "List" : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
