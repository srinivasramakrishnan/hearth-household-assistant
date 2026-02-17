"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, List, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Don't show nav if not logged in (handled by protected routes mostly, but good check)
    if (!user) return null;

    const navItems = [
        { name: 'Lists', href: '/lists', icon: List },
        { name: 'Events', href: '/events', icon: Calendar },
    ];

    return (
        <>
            {/* Top Bar */}
            <div className="fixed top-0 right-0 p-4 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 bg-white rounded-full shadow-md text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Slide-out Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black z-40"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            <div className="p-4 flex justify-between items-center border-b border-slate-100">
                                <h2 className="font-bold text-lg text-slate-800">Menu</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 py-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive
                                                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">Log Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
