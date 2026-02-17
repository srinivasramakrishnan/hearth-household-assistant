import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { PantryItem } from '../types';
import { Box, Minus, Plus, RefreshCcw, Check } from 'lucide-react';
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

    const confirmDeplete = async (addBack: boolean, specificItem?: PantryItem) => {
        const itemToProcess = specificItem || showPrompt?.item;
        if (itemToProcess) {
            await depleteItemFromPantry(userId, itemToProcess, addBack);
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
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">{group}</h2>
                        <div className="space-y-2">
                            {groupItems.map(item => (
                                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                    {/* Restock Button (Uncheck) */}
                                    <button
                                        onClick={() => confirmDeplete(true, item)}
                                        className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-indigo-600 flex items-center justify-center text-white hover:bg-transparent hover:text-transparent transition-all group"
                                        title="Restock (Move to List)"
                                    >
                                        <div className="opacity-100 group-hover:opacity-0 transition-opacity">
                                            <Check size={14} />
                                        </div>
                                    </button>

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 line-through decoration-slate-300 decoration-2">{item.name}</h3>
                                        <p className="text-xs text-slate-400">{item.quantity} {item.unit || 'units'}</p>
                                    </div>

                                    {/* Qty Controls */}
                                    <div className="flex items-center bg-slate-50 rounded-lg p-1">
                                        <button
                                            onClick={() => handleDeplete(item)}
                                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-indigo-600 text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => {/* Implement increment later if needed, or simple update */ }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-md transition-all opacity-50 cursor-not-allowed"
                                        >
                                            <Plus size={14} />
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
