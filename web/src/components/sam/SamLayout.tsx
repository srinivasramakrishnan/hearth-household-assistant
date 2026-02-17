import React, { useState, useRef, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Users, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminApprovalView } from '../../views/AdminApprovalView';
import { CollaboratorsView } from '../../views/CollaboratorsView';

interface SamLayoutProps {
    children: React.ReactNode;
    activeTab: 'shopping' | 'events' | 'summary' | 'chat' | 'settings';
    onNavigate: (tab: 'shopping' | 'events' | 'summary' | 'chat' | 'settings') => void;
}

export const SamLayout = ({ children, activeTab, onNavigate }: SamLayoutProps) => {
    const { user, appUser, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAdminApproval, setShowAdminApproval] = useState(false);
    const [showCollaborators, setShowCollaborators] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : 'S';
    const isAdmin = appUser?.role === 'admin';

    return (
        <div className="flex flex-col h-[100dvh] bg-[var(--bg-paper)] overflow-hidden font-sans text-[var(--text-primary)]">
            {/* Mobile Viewport Constraint */}
            <div className="w-full max-w-[480px] mx-auto h-full flex flex-col relative bg-[var(--bg-paper)] shadow-2xl">

                {/* Header */}
                <header className="p-4 bg-[var(--bg-paper)] z-20 relative">
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-serif text-[20px] font-semibold">Sam</div>

                        {/* Avatar & Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-8 h-8 rounded-full bg-[var(--accent-slate)] text-white text-[13px] flex items-center justify-center font-semibold hover:opacity-90 transition-opacity"
                            >
                                {userInitials}
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 origin-top-right"
                                    >
                                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                            <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Signed in as</div>
                                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.email}</div>
                                        </div>



                                        {isAdmin && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setShowAdminApproval(true);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-slate-50 rounded-lg transition-colors text-left"
                                            >
                                                <Shield size={16} className="text-[var(--text-secondary)]" />
                                                Approve Users
                                            </button>
                                        )}

                                        <div className="h-px bg-slate-100 my-1" />

                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* Header Slot (for Briefing) */}
                    <div id="sam-header-slot" />
                </header>

                {/* Modals */}
                {showAdminApproval && <AdminApprovalView onClose={() => setShowAdminApproval(false)} />}
                {showCollaborators && user && <CollaboratorsView userId={user.uid} onClose={() => setShowCollaborators(false)} />}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-4 pb-[100px]">
                    {children}
                </main>

                {/* Bottom Navigation */}
                <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
            </div>
        </div>
    );
};
