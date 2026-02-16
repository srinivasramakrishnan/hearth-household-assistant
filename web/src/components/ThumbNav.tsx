import { List, Box, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThumbNavProps {
    activeTab: 'lists' | 'pantry' | 'profile';
    onTabChange: (tab: 'lists' | 'pantry' | 'profile') => void;
}

export const ThumbNav = ({ activeTab, onTabChange }: ThumbNavProps) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-around items-center h-20 shadow-lg z-50">
            <button
                onClick={() => onTabChange('lists')}
                className={cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors",
                    activeTab === 'lists' ? "text-indigo-600" : "text-slate-400"
                )}
            >
                <List size={24} />
                <span className="text-xs font-medium">Lists</span>
            </button>

            <button
                onClick={() => onTabChange('pantry')}
                className={cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors",
                    activeTab === 'pantry' ? "text-indigo-600" : "text-slate-400"
                )}
            >
                <Box size={24} />
                <span className="text-xs font-medium">Pantry</span>
            </button>

            <button
                onClick={() => onTabChange('profile')}
                className={cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors",
                    activeTab === 'profile' ? "text-indigo-600" : "text-slate-400"
                )}
            >
                <User size={24} />
                <span className="text-xs font-medium">Profile</span>
            </button>
        </nav>
    );
};
