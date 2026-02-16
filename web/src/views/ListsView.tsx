import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, or, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';
import type { ShoppingList, ListItem } from '../types';
import { Accordion } from '../components/Accordion';
import { Plus, Check, Trash2, ShoppingCart, UserPlus, Users, LogOut } from 'lucide-react';
import { moveItemToPantry } from '../lib/logic';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareModal } from '../components/ShareModal';

interface ListsViewProps {
    userId: string;
}

export const ListsView = ({ userId }: ListsViewProps) => {
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [items, setItems] = useState<ListItem[]>([]);
    const [newListName, setNewListName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [sharingList, setSharingList] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        // Find lists where user is owner OR collaborator
        const qLists = query(
            collection(db, 'lists'),
            or(
                where('userId', '==', userId),
                where('collaborators', 'array-contains', userId)
            )
        );

        const unsubscribeLists = onSnapshot(qLists, (snapshot) => {
            setLists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingList)));
        });

        const qItems = query(collection(db, 'items'), where('userId', '==', userId));
        // Note: For items in collaborative lists, would need more complex query or separate collection.
        // For now, simplicity: only items created by user.

        const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ListItem)));
        });

        return () => {
            unsubscribeLists();
            unsubscribeItems();
        };
    }, [userId]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        await addDoc(collection(db, 'lists'), {
            name: newListName,
            createdAt: Date.now(),
            userId,
            ownerEmail: auth.currentUser?.email || '',
            collaborators: []
        });
        setNewListName('');
        setIsAddingList(false);
    };

    const handleDeleteList = async (listId: string) => {
        if (window.confirm("Are you sure you want to delete this list? All items will be removed.")) {
            // 1. Delete all items in the list
            const q = query(collection(db, 'items'), where('listId', '==', listId));
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(itemDoc => deleteDoc(doc(db, 'items', itemDoc.id)));
            await Promise.all(deletePromises);

            // 2. Delete the list itself
            await deleteDoc(doc(db, 'lists', listId));
        }
    };

    const handleLeaveList = async (listId: string) => {
        if (window.confirm("Are you sure you want to leave this shared list?")) {
            const listRef = doc(db, 'lists', listId);
            await updateDoc(listRef, {
                collaborators: arrayRemove(userId)
            });
        }
    };

    const handleAddItem = async (listId: string, name: string) => {
        if (!name.trim()) return;
        await addDoc(collection(db, 'items'), {
            listId,
            name,
            isBought: false,
            addedAt: Date.now(),
            userId
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        await deleteDoc(doc(db, 'items', itemId));
    };

    return (
        <div className="pb-24">
            <header className="p-6 bg-white shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">My Lists</h1>
                <button
                    onClick={() => setIsAddingList(!isAddingList)}
                    className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="p-4">
                {isAddingList && (
                    <form onSubmit={handleCreateList} className="mb-6 bg-white p-4 rounded-xl shadow-md border border-indigo-100">
                        <input
                            autoFocus
                            className="w-full p-3 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="List Name (e.g. Weekly Groceries)"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                        />
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold"
                            >
                                Create List
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddingList(false)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {lists.map(list => (
                        <Accordion
                            key={list.id}
                            title={list.name}
                            defaultOpen
                            actions={
                                <div className="flex items-center space-x-1">
                                    {list.userId !== userId && (
                                        <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                                            <Users size={12} />
                                            <span>Shared</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setSharingList({ id: list.id, name: list.name })}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Share List"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                    {list.userId === userId ? (
                                        <button
                                            onClick={() => handleDeleteList(list.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete List"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleLeaveList(list.id)}
                                            className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
                                            title="Leave List"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    )}
                                </div>
                            }
                        >
                            <div className="space-y-2">
                                {items.filter(item => item.listId === list.id && !item.isBought).map(item => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => moveItemToPantry(userId, item, list.name)}
                                                className="w-6 h-6 border-2 border-indigo-200 rounded-md flex items-center justify-center text-transparent hover:border-indigo-500 hover:text-indigo-500 transition-all"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <span className="text-slate-700 font-medium">{item.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}

                                <AddItemInput onAdd={(name) => handleAddItem(list.id, name)} />
                            </div>
                        </Accordion>
                    ))}

                    {lists.length === 0 && !isAddingList && (
                        <div className="text-center py-20 text-slate-400">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No lists yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {sharingList && (
                    <ShareModal
                        listId={sharingList.id}
                        listName={sharingList.name}
                        onClose={() => setSharingList(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const AddItemInput = ({ onAdd }: { onAdd: (name: string) => void }) => {
    const [val, setVal] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (val.trim()) {
            onAdd(val);
            setVal('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2">
            <input
                className="w-full bg-slate-50 border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-200"
                placeholder="+ Add item..."
                value={val}
                onChange={(e) => setVal(e.target.value)}
            />
        </form>
    );
};
