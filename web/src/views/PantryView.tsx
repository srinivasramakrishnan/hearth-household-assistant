import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { PantryItem } from '../types';
import { Box, Minus, Plus, RefreshCcw } from 'lucide-react';
import { depleteItemFromPantry } from '../lib/logic';
import { motion, AnimatePresence } from 'framer-motion';

interface PantryViewProps {
    userId: string;
}

export const PantryView = ({ userId }: PantryViewProps) => {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [showPrompt, setShowPrompt] = useState<{ item: PantryItem } | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'pantry'), where('userId', '==', userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem)));
        });

        return () => unsubscribe();
    }, [userId]);

    // Group items by source list
    const groupedItems = items.reduce((acc, item) => {
        const group = item.sourceListName || 'Default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, PantryItem[]>);

    const handleDeplete = async (item: PantryItem) => {
        if (item.quantity <= 1) {
            setShowPrompt({ item });
        } else {
            await depleteItemFromPantry(userId, item, false);
        }
    };

    const confirmDeplete = async (addBack: boolean) => {
        if (showPrompt) {
            await depleteItemFromPantry(userId, showPrompt.item, addBack);
            setShowPrompt(null);
        }
    };

    return (
        <div className="pb-24">
            <header className="p-6 bg-white shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-slate-900">In My Pantry</h1>
            </header>

            <div className="p-4 space-y-8">
                {Object.entries(groupedItems).map(([group, groupItems]) => (
                    <div key={group}>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">{group}</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {groupItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                        <p className="text-sm text-slate-500">{item.quantity} {item.unit || 'units'}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDeplete(item)}
                                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-indigo-600">{item.quantity}</span>
                                        <button
                                            onClick={() => {/* Increment logic optionally */ }}
                                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <Box size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Your pantry is empty.<br />Go shopping to stock up!</p>
                    </div>
                )}
            </div>

            {/* Depletion Prompt Modal */}
            <AnimatePresence>
                {showPrompt && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ translateY: "100%" }}
                            animate={{ translateY: 0 }}
                            exit={{ translateY: "100%" }}
                            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Used up {showPrompt.item.name}?</h3>
                            <p className="text-slate-500 mb-6">Would you like to add this back to your shopping list?</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => confirmDeplete(true)}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg"
                                >
                                    <RefreshCcw size={20} />
                                    <span>Yes, add back to list</span>
                                </button>
                                <button
                                    onClick={() => confirmDeplete(false)}
                                    className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold"
                                >
                                    No, just remove
                                </button>
                                <button
                                    onClick={() => setShowPrompt(null)}
                                    className="w-full py-2 text-slate-400 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
