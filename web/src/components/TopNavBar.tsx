import { Menu, Search, User } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface TopNavBarProps {
    onMenuClick: () => void;
    title?: string;
    userName?: string | null;
    userId?: string;
    onLogout: () => void;
}

export const TopNavBar = ({ onMenuClick, title = 'Bilbo', userName, userId, onLogout }: TopNavBarProps) => {
    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative hidden md:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-lg pl-9 pr-4 py-1.5 text-sm transition-all outline-none w-64"
                    />
                </div>

                {/* User Module - Reusing existing UserMenu but making it fit the nav bar style if needed, 
                    or just a simple avatar triggered dropdown */}
                <div className="ml-2">
                    <UserMenu userName={userName} userId={userId || ''} onLogout={onLogout} minimal />
                </div>
            </div>
        </header>
    );
};
