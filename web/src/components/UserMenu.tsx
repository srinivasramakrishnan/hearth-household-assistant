import { useState, useRef, useEffect } from 'react';
import { LogOut, UserPlus, Check, X, Users, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminApprovalView } from '../views/AdminApprovalView';
import { CollaboratorsView } from '../views/CollaboratorsView';

interface UserMenuProps {
    userName?: string | null;
    userId: string;
    isAdmin?: boolean;
    onLogout: () => void;
}

export const UserMenu = ({ userName, userId, isAdmin, onLogout }: UserMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAdminApproval, setShowAdminApproval] = useState(false);
    const [showCollaborators, setShowCollaborators] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsInviting(false);
                // Don't close admin/collab view here, handled by their own close buttons
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            alert(`Invite sent to ${inviteEmail}!`);
            setInviteEmail('');
            setIsInviting(false);
        } catch (error: any) {
            console.error('Error sending invite:', error);
            alert('Failed to send invite: ' + error.message);
        }
    };

    return (
        <div className="relative font-display" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-2xl font-bold text-slate-900 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                Hi <span className="text-primary">{userName || 'User'}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-[var(--radius-lg)] material-shadow-2 z-50 overflow-hidden border border-slate-100 p-2 text-sm">

                    {/* Invite Action */}
                    <div className="mb-1">
                        {!isInviting ? (
                            <button
                                onClick={() => setIsInviting(true)}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <UserPlus size={18} />
                                </div>
                                Invite Collaborator
                            </button>
                        ) : (
                            <form onSubmit={handleInviteSubmit} className="p-2 flex gap-2 bg-slate-50 rounded-lg items-center">
                                <input
                                    type="email"
                                    autoFocus
                                    className="flex-1 bg-transparent text-sm font-medium placeholder-slate-400 focus:outline-none min-w-0 h-8"
                                    placeholder="friend@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviting(false)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-8 h-8 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!inviteEmail}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Manage Collaborators */}
                    <div className="mb-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowCollaborators(true);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <Users size={18} />
                            </div>
                            Manage Collaborators
                        </button>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="mb-1">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowAdminApproval(true);
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Shield size={18} />
                                </div>
                                Approve Users
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-1 mx-2" />

                    {/* Logout Action */}
                    <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600 font-medium group"
                    >
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                            <LogOut size={18} />
                        </div>
                        Log Out
                    </button>
                </div>
            )}
            {showAdminApproval && <AdminApprovalView onClose={() => setShowAdminApproval(false)} />}
            {showCollaborators && <CollaboratorsView userId={userId} onClose={() => setShowCollaborators(false)} />}
        </div>
    );
};
