
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, getDoc, collection, query, where, setDoc, deleteDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '../lib/firebase';
import { Loader2, Save, Phone, User as UserIcon, LogOut, Users, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';

export const SettingsView = () => {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Collaborators State
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
    const [editPhone, setEditPhone] = useState('');

    // Fetch Profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const userRef = doc(db, 'users', user.uid);
                const snapshot = await getDoc(userRef);
                if (snapshot.exists()) {
                    const data = snapshot.data() as UserProfile;
                    setPhoneNumber(data.phoneNumber || '');
                    setDisplayName(data.displayName || user.displayName || '');
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };
        fetchProfile();
    }, [user]);

    // Fetch Collaborators
    const [collaborationsSnapshot, collabsLoading] = useCollection(
        user ? query(collection(db, 'collaborations'), where('inviterId', '==', user.uid)) : null
    );

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        try {
            let formattedPhone = phoneNumber.trim();
            if (formattedPhone && !formattedPhone.startsWith('+')) {
                setErrorMsg("Phone number must start with + (e.g. +14155552671)");
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                phoneNumber: formattedPhone,
                displayName: displayName
            });
            setSuccessMsg("Profile updated successfully!");
        } catch (err: any) {
            console.error("Error saving profile:", err);
            setErrorMsg("Failed to save profile. " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !user) return;

        try {
            const collabId = `${user.uid}_${inviteEmail.trim()}`;
            await setDoc(doc(db, 'collaborations', collabId), {
                inviterId: user.uid,
                inviteeEmail: inviteEmail.trim(),
                createdAt: Date.now()
            });

            setInviteEmail('');
            setIsInviting(false);
        } catch (error: any) {
            console.error('Error sending invite:', error);
            setErrorMsg('Failed to send invite: ' + error.message);
        }
    };

    const handleRemoveCollaborator = async (collabId: string) => {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;
        try {
            await deleteDoc(doc(db, 'collaborations', collabId));
        } catch (error: any) {
            console.error("Error removing collaborator:", error);
            setErrorMsg("Failed to remove collaborator.");
        }
    };

    const startEditCollaborator = (collabId: string, currentPhone?: string) => {
        setEditingCollabId(collabId);
        setEditPhone(currentPhone || '');
    };

    const saveCollaboratorPhone = async (collabId: string) => {
        try {
            await updateDoc(doc(db, 'collaborations', collabId), {
                phoneNumber: editPhone.trim()
            });
            setEditingCollabId(null);
        } catch (error: any) {
            console.error("Error updating collaborator:", error);
            setErrorMsg("Failed to update collaborator phone.");
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 p-4 overflow-y-auto pb-24">
            <div className="max-w-md mx-auto w-full space-y-8">

                {/* Profile Header */}
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                        <UserIcon size={40} />
                    </div>
                    <h2 className="text-2xl font-serif text-slate-800">Settings</h2>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                </div>

                {/* Main Settings Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-medium text-slate-800">Your Profile</h3>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Display Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Your WhatsApp Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Phone size={16} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono text-sm"
                                    placeholder="+1234567890"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm">
                                {successMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Profile
                        </button>
                    </form>
                </div>

                {/* Collaborators Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-medium text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-slate-500" />
                            Collaborators
                        </h3>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-500">
                            Invite family members to share your lists and pantry. You can also add their phone number so they can use WhatsApp.
                        </p>

                        {!isInviting ? (
                            <button
                                onClick={() => setIsInviting(true)}
                                className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30 flex items-center justify-center gap-2 transition-colors text-slate-500 font-medium text-sm"
                            >
                                <UserPlus size={16} />
                                Invite Collaborator
                            </button>
                        ) : (
                            <form onSubmit={handleInviteSubmit} className="flex gap-2 items-center">
                                <input
                                    type="email"
                                    required
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter user email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    <Check size={18} />
                                </button>
                                <button type="button" onClick={() => setIsInviting(false)} className="p-2 text-slate-400 hover:bg-slate-100">
                                    <X size={18} />
                                </button>
                            </form>
                        )}

                        <div className="space-y-3 pt-2">
                            {collabsLoading && <Loader2 className="animate-spin mx-auto text-slate-400" />}

                            {!collabsLoading && collaborationsSnapshot?.empty && (
                                <div className="text-center text-slate-400 text-xs py-2">No collaborators yet.</div>
                            )}

                            {collaborationsSnapshot?.docs.map(doc => {
                                const data = doc.data();
                                const isEditing = editingCollabId === doc.id;

                                return (
                                    <div key={doc.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium text-sm text-slate-800">{data.inviteeEmail}</div>
                                                <div className="text-[10px] text-slate-400">Added {new Date(data.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCollaborator(doc.id)}
                                                className="text-slate-400 hover:text-red-600 p-1"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Phone Number Field */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Phone size={12} className="text-slate-400" />
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        className="flex-1 text-xs px-2 py-1 rounded border border-indigo-200 focus:outline-none"
                                                        value={editPhone}
                                                        onChange={e => setEditPhone(e.target.value)}
                                                        placeholder="+123..."
                                                    />
                                                    <button onClick={() => saveCollaboratorPhone(doc.id)} className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"><Check size={12} /></button>
                                                    <button onClick={() => setEditingCollabId(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded"><X size={12} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 flex-1 group cursor-pointer" onClick={() => startEditCollaborator(doc.id, data.phoneNumber)}>
                                                    <span className={`text-xs ${data.phoneNumber ? 'text-slate-600 font-mono' : 'text-slate-400 italic'}`}>
                                                        {data.phoneNumber || "Add phone number..."}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={() => auth.signOut()}
                        className="text-red-600 text-sm font-medium hover:text-red-700 flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>

            </div>
        </div>
    );
};
