import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Minus } from 'lucide-react';
import { TabSwitcher } from './TabSwitcher';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { moveItemToPantry, depleteItemFromPantry } from '../lib/logic';
import type { ListItem, PantryItem } from '../types';

interface ExpandedListViewProps {
    listId: string;
    listName: string;
    userId: string;
    variant: 'blue' | 'yellow' | 'green' | 'pink' | 'purple';
    activeTab: 'shopping' | 'pantry'; // Initial tab
    onBack: () => void;
}

export const ExpandedListView = ({
    listId,
    listName,
    userId,
    variant,
    activeTab: initialTab,
    onBack
}: ExpandedListViewProps) => {
    const [currentTab, setCurrentTab] = useState<'shopping' | 'pantry'>(initialTab);
    const [newItemName, setNewItemName] = useState('');

    // Query Items (Shopping List)
    const [itemsQuery] = useCollection(
        query(
            collection(db, 'items'),
            where('listId', '==', listId),
            where('isBought', '==', false) // Only show unbought items in shopping list
        )
    );

    // Query Pantry (Items from this list)
    const [pantryQuery] = useCollection(
        query(
            collection(db, 'pantry'),
            where('sourceListId', '==', listId),
            where('userId', '==', userId)
        )
    );

    const items = itemsQuery?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [];
    const pantryItems = pantryQuery?.docs.map(d => ({ id: d.id, ...d.data() } as PantryItem)) || [];

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        const existingItem = items.find(
            i => i.name.toLowerCase() === newItemName.trim().toLowerCase()
        );

        if (existingItem) {
            await updateDoc(doc(db, 'items', existingItem.id), {
                quantity: increment(1)
            });
        } else {
            await addDoc(collection(db, 'items'), {
                listId,
                userId,
                name: newItemName,
                isBought: false,
                quantity: 1,
                addedAt: Date.now()
            });
        }
        setNewItemName('');
    };

    const handleBuyItem = async (item: ListItem) => {
        await moveItemToPantry(userId, item, listName);
    };

    const handleConsumeItem = async (item: PantryItem) => {
        await depleteItemFromPantry(userId, item, true);
    };

    const handleRestockItem = async (item: PantryItem) => {
        const existingItem = items.find(i => i.name === item.name);
        if (existingItem) {
            await updateDoc(doc(db, 'items', existingItem.id), {
                quantity: increment(1)
            });
        } else {
            await addDoc(collection(db, 'items'), {
                listId: item.sourceListId || listId,
                userId,
                name: item.name,
                isBought: false,
                quantity: 1,
                addedAt: Date.now()
            });
        }
    };

    const handleDeletePantryItem = async (item: PantryItem) => {
        await deleteDoc(doc(db, 'pantry', item.id));
    };

    // Color theme classes
    const themes = {
        blue: { bg: 'bg-card-blue', text: 'text-on-card-blue', input: 'placeholder-indigo-300' },
        yellow: { bg: 'bg-card-yellow', text: 'text-on-card-yellow', input: 'placeholder-yellow-600' },
        green: { bg: 'bg-card-green', text: 'text-on-card-green', input: 'placeholder-emerald-600' },
        pink: { bg: 'bg-card-pink', text: 'text-on-card-pink', input: 'placeholder-pink-400' },
        purple: { bg: 'bg-purple-200', text: 'text-purple-900', input: 'placeholder-purple-400' },
    };
    const theme = themes[variant];

    return (
        <div className={`min-h-[60vh] rounded-[var(--radius-xl)] p-6 ${theme.bg} ${theme.text} material-shadow-2 flex flex-col`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold">{listName}</h2>
            </div>

            {/* Local Tab Switcher if needed, utilizing translucent bg */}
            <div className="mb-4">
                <TabSwitcher activeTab={currentTab} onTabChange={setCurrentTab} className="bg-black/10" />
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 overflow-y-auto mb-6">
                {currentTab === 'shopping' ? (
                    items.length === 0 ? (
                        <p className="opacity-60 text-center py-8">Your list is empty.</p>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl backdrop-blur-sm">
                                <button
                                    onClick={() => handleBuyItem(item)}
                                    className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center hover:bg-black/10"
                                >
                                </button>
                                <span className="flex-1 font-medium">{item.name}</span>
                                <button
                                    onClick={() => deleteDoc(doc(db, 'items', item.id))}
                                    className="opacity-50 hover:opacity-100 p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )
                ) : (
                    pantryItems.length === 0 ? (
                        <p className="opacity-60 text-center py-8">Nothing in pantry from this list.</p>
                    ) : (
                        pantryItems.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-white/40 p-3 rounded-xl backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
                                    {item.quantity}
                                </div>
                                <span className="flex-1 font-medium">{item.name}</span>
                                <button
                                    onClick={() => handleRestockItem(item)}
                                    className="opacity-50 hover:opacity-100 p-2"
                                    title="Add to List"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => handleConsumeItem(item)}
                                    className="opacity-50 hover:opacity-100 p-2"
                                    title="Consume"
                                >
                                    <Minus size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeletePantryItem(item)}
                                    className="opacity-50 hover:opacity-100 p-2 text-red-600"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Add Item Input */}
            {currentTab === 'shopping' && (
                <form onSubmit={handleAddItem} className="relative">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add new item..."
                        className={`w-full bg-white/50 backdrop-blur-sm rounded-xl py-4 pl-4 pr-12 font-medium focus:outline-none focus:ring-2 focus:ring-black/10 ${theme.input} placeholder-opacity-60`}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 w-10 bg-black/10 rounded-lg flex items-center justify-center hover:bg-black/20 text-current"
                    >
                        <Plus size={20} />
                    </button>
                </form>
            )}
        </div>
    );
};
