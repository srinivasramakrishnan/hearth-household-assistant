import { useState } from 'react';
import { X, Send, UserPlus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface ShareModalProps {
    listId: string;
    listName: string;
    onClose: () => void;
}

export const ShareModal = ({ listId, listName, onClose }: ShareModalProps) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setMessage(null);

        try {
            // 1. Find user by email in 'users' collection
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setMessage({ type: 'error', text: "User not found. They must sign in to the app first." });
                return;
            }

            const targetUser = querySnapshot.docs[0].data();
            const targetUid = targetUser.uid;

            // 2. Add UID to list collaborators
            const listRef = doc(db, 'lists', listId);
            await updateDoc(listRef, {
                collaborators: arrayUnion(targetUid)
            });

            setMessage({ type: 'success', text: `Successfully shared with ${email}!` });
            setEmail('');
        } catch (error) {
            console.error("Error sharing list:", error);
            setMessage({ type: 'error', text: "Failed to share list. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Share List</h3>
                        <p className="text-slate-500 text-sm">Invite others to edit "{listName}"</p>
                    </div>
                </div>

                <form onSubmit={handleShare} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            User Email
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="friend@example.com"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                        <span>Send Invitation</span>
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
