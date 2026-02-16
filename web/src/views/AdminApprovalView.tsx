
import React, { useState, useEffect } from 'react';
import { X, Check, Search, Shield, User } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AdminApprovalViewProps {
    onClose: () => void;
}

export function AdminApprovalView({ onClose }: AdminApprovalViewProps) {
    const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            // Fetch users where isApproved is false or missing
            const q = query(collection(db, 'users'), where('isApproved', '==', false));
            const querySnapshot = await getDocs(q);

            const users: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                users.push({ uid: doc.id, ...doc.data() } as UserProfile);
            });

            setPendingUsers(users);
        } catch (error) {
            console.error("Error fetching pending users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                isApproved: true
            });
            // Remove from local state
            setPendingUsers(prev => prev.filter(u => u.uid !== userId));
        } catch (error) {
            console.error("Error approving user:", error);
            alert("Failed to approve user");
        }
    };

    const handleDecline = async (userId: string) => {
        // Requirements say: "decline should just not enable access" - effectively doing nothing for now, 
        // potentially we could delete the user or mark as declined, but for now we'll just leave them in the list or maybe mark explicitly declined?
        // Request says: "check should enable access and cross should decline their access ... for now, decline should just not enable access"
        // So functionally, doing nothing on the backend is "not enabling".
        // But to give feedback to the admin, maybe we should just remove them from the list? 
        // Or perhaps toggling 'isApproved: false' explicitly if it was undefined?
        // Let's just alert for now since the requirement is vague on state change for decline.
        // Actually, "decline should just not enable access" implies no change needed, but maybe we want to hide them from this list?
        // I'll leave them there for now pending clarification, or just log it.
        console.log("Decline logic clicked for", userId);
        // User requested: "check should enable access and cross should decline their access"
        // "we will implement decline flow later but for now, decline should just not enable access"
        // This implies that clicking X might just do nothing, or maybe close the row? 
        // I'll make it do nothing but maybe show a toast or something.
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-variant/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">Approve Users</h2>
                            <p className="text-sm text-slate-500">Manage pending access requests</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading requests...</div>
                    ) : pendingUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">No pending user requests</p>
                            <p className="text-sm text-slate-400 mt-1">New signups will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {pendingUsers.map((user) => (
                                <div key={user.uid} className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                            {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{user.displayName || 'Unnamed User'}</h3>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDecline(user.uid)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Decline Access"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(user.uid)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                                            title="Approve Access"
                                        >
                                            <Check size={20} className="stroke-[3]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-surface-variant/30 border-t border-border text-center text-xs text-slate-400">
                    Showing {pendingUsers.length} pending request{pendingUsers.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
}
