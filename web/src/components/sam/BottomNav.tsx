
import React from 'react';
import { ShoppingBasket, Calendar, MessageSquare, Settings, PieChart } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'shopping' | 'events' | 'summary' | 'chat' | 'settings';
    onNavigate: (tab: 'shopping' | 'events' | 'summary' | 'chat' | 'settings') => void;
}

export const BottomNav = ({ activeTab, onNavigate }: BottomNavProps) => {
    const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
        <button
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors
                ${activeTab === id ? 'text-[var(--accent-olive)]' : 'text-[var(--text-tertiary)]'}
            `}
        >
            <Icon size={20} className={activeTab === id ? 'stroke-2' : 'stroke-[1.5px]'} />
            {label}
        </button>
    );

    return (
        <nav className="absolute bottom-0 left-0 right-0 bg-white h-[72px] flex justify-around items-center border-t border-[rgba(0,0,0,0.05)] pb-3 z-30">
            <NavItem id="shopping" icon={ShoppingBasket} label="Shopping" />
            <NavItem id="events" icon={Calendar} label="Events" />
            <NavItem id="summary" icon={PieChart} label="Summary" />
            <NavItem id="chat" icon={MessageSquare} label="Chat" />
            <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>
    );
};
