
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
    moveItemToPantry,
    depleteItemFromPantry,
    undoMoveToPantry,
    incrementPantryItem,
    updateShoppingItemQuantity,
    deleteShoppingItem,
    deletePantryItem,
    updateShoppingItem,
    updatePantryItem
} from '../lib/logic';
import { type ListItem, type PantryItem } from '../types';

import { SamLayout } from '../components/sam/SamLayout';
import { InventoryItem } from '../components/sam/InventoryItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ChatView } from './ChatView';
import { SettingsView } from './SettingsView';
import { AddItemPopover, AddListPopover } from '../components/sam/AddItemFlyout';

export const SamDashboard = () => {
    const [user] = useAuthState(auth);
    // Main Tab State (Bottom Nav)
    const [activeTab, setActiveTab] = useState<'shopping' | 'events' | 'summary' | 'chat' | 'settings'>('shopping');
    // Sub Tab State for Shopping view
    const [activeShoppingTab, setActiveShoppingTab] = useState<'shopping' | 'stock'>('shopping');

    // Local state for items bought in this session (to keep them visible)
    const [recentlyBought, setRecentlyBought] = useState<ListItem[]>([]);

    // --- Data Fetching ---
    // 1. Lists (for mapping names)
    const [listsSnapshot] = useCollection(
        user ? query(collection(db, 'lists'), where('userId', '==', user.uid)) : null
    );
    const listsMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        listsSnapshot?.docs.forEach(doc => {
            map[doc.id] = doc.data().name;
        });
        return map;
    }, [listsSnapshot]);

    // 2. Shopping List Items (Unbought)
    const [itemsSnapshot] = useCollection(
        user ? query(collection(db, 'items'), where('userId', '==', user.uid), where('isBought', '==', false)) : null
    );
    const shoppingItemsRaw = itemsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as ListItem)) || [];

    // 3. Pantry Items (Stock)
    const [pantrySnapshot] = useCollection(
        user ? query(collection(db, 'pantry'), where('userId', '==', user.uid)) : null
    );
    const pantryItems = pantrySnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as PantryItem)) || [];

    // --- Data Munging ---
    // Combine raw unbought items with recently bought items for display
    const mergedShoppingItems = React.useMemo(() => {
        // Filter out any raw items that might also be in recentlyBought (dedup based on ID)
        // This handles the transition period where Firestore hasn't updated yet but we added to local state
        const unbought = shoppingItemsRaw.filter(i => !recentlyBought.some(r => r.id === i.id));
        const combined = [...unbought, ...recentlyBought];
        // Sort by addedAt desc to keep order stable regardless of bought status
        return combined.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }, [shoppingItemsRaw, recentlyBought]);


    // --- Grouping Logic ---
    const groupedShopping = React.useMemo(() => {
        const groups: Record<string, ListItem[]> = {};
        mergedShoppingItems.forEach(item => {
            // Group by list name if available, otherwise "Shopping List"
            let listName = 'General';
            if (item.listId) {
                listName = listsMap[item.listId] || 'General';
            }

            if (!groups[listName]) groups[listName] = [];
            groups[listName].push(item);
        });
        return groups;
    }, [mergedShoppingItems, listsMap]);

    const groupedPantry = React.useMemo(() => {
        const groups: Record<string, PantryItem[]> = {};
        pantryItems.forEach(item => {
            const listName = item.sourceListName || 'General';
            if (!groups[listName]) groups[listName] = [];
            groups[listName].push(item);
        });
        return groups;
    }, [pantryItems]);


    // --- Handlers ---
    const handleToggleShopping = async (item: ListItem) => {
        if (!user) return;

        if (item.isBought) {
            // Undo: Remove from recently bought and revert DB
            setRecentlyBought(prev => prev.filter(i => i.id !== item.id));
            await undoMoveToPantry(user.uid, item);
        } else {
            // Buy: Add to recently bought (optimistic) and update DB
            setRecentlyBought(prev => [...prev, { ...item, isBought: true }]);
            const listName = listsMap[item.listId] || 'Shopping List';
            await moveItemToPantry(user.uid, item, listName);
        }
    };

    const handleAddToShoppingList = async (item: PantryItem) => {
        if (!user) return;
        await depleteItemFromPantry(user.uid, item, true);
    };

    const handleStockDecrement = async (item: PantryItem) => {
        if (!user) return;
        // Decrement (audit), don't add to list automatically (unless using left action)
        await depleteItemFromPantry(user.uid, item, false);
    };

    const handleIncrementStock = async (item: PantryItem) => {
        if (!user) return;
        await incrementPantryItem(item);
    };

    // --- Shopping List Handlers ---
    const handleShoppingIncrement = async (item: ListItem) => {
        if (!user) return;
        await updateShoppingItemQuantity(item.id, 1);
    };

    const handleShoppingDecrement = async (item: ListItem) => {
        if (!user) return;
        // If qty is 1, maybe confirm delete? Or just don't decrement below 1?
        // User said "implement qty", preventing < 1 usually safer unless explicit delete.
        if ((item.quantity || 1) > 1) {
            await updateShoppingItemQuantity(item.id, -1);
        } else {
            // Optional: Allow deleting by decrementing to 0? For now, stick to >1 constraint and use explicit delete.
            if (window.confirm(`Remove "${item.name}" from shopping list?`)) {
                await deleteShoppingItem(item.id);
            }
        }
    };

    const handleShoppingDelete = async (item: ListItem) => {
        if (!user || !window.confirm(`Delete "${item.name}"?`)) return;
        await deleteShoppingItem(item.id);
    };

    const handleShoppingEdit = async (item: ListItem) => {
        if (!user) return;
        const newName = window.prompt("Rename item:", item.name);
        if (newName && newName !== item.name) {
            await updateShoppingItem(item.id, { name: newName });
        }
    };

    // --- Pantry Handlers ---
    const handlePantryDelete = async (item: PantryItem) => {
        if (!user || !window.confirm(`Delete "${item.name}" from stock?`)) return;
        await deletePantryItem(item.id);
    };

    const handlePantryEdit = async (item: PantryItem) => {
        if (!user) return;
        const newName = window.prompt("Rename item:", item.name);
        if (newName && newName !== item.name) {
            await updatePantryItem(item.id, { name: newName });
        }
    };

    // List of lists for the flyout
    const lists = listsSnapshot?.docs.map(doc => ({ id: doc.id, name: doc.data().name })) || [];

    const handleAddItemFlyout = async (name: string, listId: string) => {
        if (!user) return;

        if (activeShoppingTab === 'shopping') {
            // Add to Shopping List
            await addDoc(collection(db, 'items'), {
                name,
                listId,
                userId: user.uid,
                isBought: false,
                quantity: 1,
                addedAt: Date.now()
            });
        } else {
            // Add to Pantry
            const list = lists.find(l => l.id === listId);
            const listName = list ? list.name : 'Unknown List';

            await addDoc(collection(db, 'pantry'), {
                name,
                quantity: 1,
                userId: user.uid,
                sourceListId: listId,
                sourceListName: listName,
                lastUpdated: Date.now()
            });
        }
    };

    const handleAddListFlyout = async (name: string) => {
        if (!user) return;
        await addDoc(collection(db, 'lists'), {
            name,
            userId: user.uid,
            createdAt: Date.now()
        });
    };

    return (
        <SamLayout activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab)}>

            {/* Main Scroll Content */}
            <div className="mt-4">


                {/* SHOPPING VIEW with Tabs */}
                {activeTab === 'shopping' && (
                    <Tabs defaultValue="shopping" value={activeShoppingTab} onValueChange={(val: string) => setActiveShoppingTab(val as 'shopping' | 'stock')} className="w-full">

                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="bg-slate-100 p-1 rounded-full h-auto inline-flex justify-start">
                                <TabsTrigger
                                    value="shopping"
                                    className="rounded-full px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm text-[var(--text-secondary)] font-medium"
                                >
                                    Shopping
                                </TabsTrigger>
                                <TabsTrigger
                                    value="stock"
                                    className="rounded-full px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm text-[var(--text-secondary)] font-medium"
                                >
                                    Stock
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <AddItemPopover
                                    lists={lists}
                                    onAddItem={handleAddItemFlyout}
                                />
                                <AddListPopover
                                    onAddList={handleAddListFlyout}
                                />
                            </div>
                        </div>

                        <TabsContent value="shopping" className="mt-0">
                            {/* Content */}
                            <div className="flex flex-col gap-2">
                                {mergedShoppingItems.length === 0 && (
                                    <div className="text-center text-[var(--text-secondary)] py-8 text-sm italic">
                                        Your shopping list is empty!
                                    </div>
                                )}
                                {Object.entries(groupedShopping).map(([listName, items]) => (
                                    <div key={listName} className="mb-2">
                                        <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mt-4 mb-2 pl-1">{listName}</div>
                                        <div className="flex flex-col gap-2">
                                            {items.map(item => (
                                                <InventoryItem
                                                    key={item.id}
                                                    name={item.name}
                                                    isChecked={item.isBought}
                                                    onToggle={() => handleToggleShopping(item)}

                                                    // Quantity
                                                    showQuantity={true}
                                                    quantity={item.quantity || 1}
                                                    onIncrement={() => handleShoppingIncrement(item)}
                                                    onDecrement={() => handleShoppingDecrement(item)}

                                                    // Actions
                                                    onEdit={() => handleShoppingEdit(item)}
                                                    onDelete={() => handleShoppingDelete(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="stock" className="mt-0">
                            <div className="flex flex-col gap-2">
                                {pantryItems.length === 0 && (
                                    <div className="text-center text-[var(--text-secondary)] py-8 text-sm italic">
                                        Your pantry is empty.
                                    </div>
                                )}
                                {Object.entries(groupedPantry).map(([listName, items]) => (
                                    <div key={listName} className="mb-2">
                                        <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mt-4 mb-2 pl-1">{listName}</div>
                                        <div className="flex flex-col gap-2">
                                            {items.map(item => (
                                                <InventoryItem
                                                    key={item.id}
                                                    name={item.name}
                                                    variant="add"
                                                    showQuantity={true}
                                                    quantity={item.quantity}
                                                    onToggle={() => handleAddToShoppingList(item)}

                                                    onDecrement={() => handleStockDecrement(item)}
                                                    onIncrement={() => handleIncrementStock(item)}

                                                    // Actions
                                                    onEdit={() => handlePantryEdit(item)}
                                                    onDelete={() => handlePantryDelete(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}


                {/* EVENTS VIEW */}
                {activeTab === 'events' && (
                    <div className="text-center text-[var(--text-secondary)] py-8 text-sm italic">
                        <h2 className="text-lg font-serif text-[var(--text-primary)] mb-2">Upcoming Events</h2>
                        <p>No upcoming events.</p>
                    </div>
                )}

                {/* SUMMARY VIEW (Placeholder) */}
                {activeTab === 'summary' && (
                    <div className="text-center text-[var(--text-secondary)] py-8 text-sm italic">
                        <h2 className="text-lg font-serif text-[var(--text-primary)] mb-2">Summary</h2>
                        <p>Summary dashboard coming soon.</p>
                    </div>
                )}

                {/* CHAT VIEW */}
                {activeTab === 'chat' && (
                    <ChatView />
                )}

                {/* SETTINGS VIEW */}
                {activeTab === 'settings' && (
                    <SettingsView />
                )}

            </div>
        </SamLayout>
    );
};
