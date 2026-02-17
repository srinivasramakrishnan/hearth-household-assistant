import { X, Trash2, Users, UserPlus, Check } from 'lucide-react';
import { collection, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';

interface CollaboratorsViewProps {
    userId: string;
    onClose: () => void;
}

export const CollaboratorsView = ({ userId, onClose }: CollaboratorsViewProps) => {
    // Fetch collaborations where I am the inviter
    const [collaborationsSnapshot, loading, error] = useCollection(
        query(collection(db, 'collaborations'), where('inviterId', '==', userId))
    );
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        try {
            const collabId = `${userId}_${inviteEmail.trim()}`;
            await setDoc(doc(db, 'collaborations', collabId), {
                inviterId: userId,
                inviteeEmail: inviteEmail.trim(),
                createdAt: Date.now()
            });

            setInviteEmail('');
            setIsInviting(false);
            // Optional: Show success toast
        } catch (error: any) {
            console.error('Error sending invite:', error);
            alert('Failed to send invite: ' + error.message);
        }
    };

    const handleRemoveCollaborator = async (collabId: string) => {
        if (!confirm('Are you sure you want to remove this collaborator? They will lose access to your lists.')) return;
        try {
            await deleteDoc(doc(db, 'collaborations', collabId));
        } catch (error) {
            console.error("Error removing collaborator:", error);
            alert("Failed to remove collaborator.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl material-shadow-3 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-primary" />
                        Manage Collaborators
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Invite Section */}
                <div className="px-6 pt-4 pb-0">
                    {!isInviting ? (
                        <button
                            onClick={() => setIsInviting(true)}
                            className="w-full py-3 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30 flex items-center justify-center gap-2 transition-colors text-slate-500 font-medium"
                        >
                            <UserPlus size={18} />
                            Invite New Collaborator
                        </button>
                    ) : (
                        <form onSubmit={handleInviteSubmit} className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    autoFocus
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Enter email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!inviteEmail}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsInviting(false)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading && (
                        <div className="text-center py-8 text-slate-500">
                            Loading...
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                            Failed to load collaborators.
                        </div>
                    )}

                    {!loading && !error && collaborationsSnapshot?.empty && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                <Users size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">No active collaborators</p>
                            <p className="text-xs text-slate-400 mt-1">Invite people from the user menu to get started.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {collaborationsSnapshot?.docs.map(doc => {
                            const data = doc.data();
                            return (
                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                            {data.inviteeEmail || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Added {new Date(data.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCollaborator(doc.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Revoke Access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
