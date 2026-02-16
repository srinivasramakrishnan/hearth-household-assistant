import clsx from 'clsx';

interface TabSwitcherProps {
    activeTab: 'shopping' | 'pantry';
    onTabChange: (tab: 'shopping' | 'pantry') => void;
    className?: string;
}

export const TabSwitcher = ({ activeTab, onTabChange, className }: TabSwitcherProps) => {
    return (
        <div className={clsx("flex p-1 rounded-full mb-6 relative", className || "bg-slate-200")}>
            <button
                onClick={() => onTabChange('shopping')}
                className={clsx(
                    "flex-1 py-3 text-sm font-bold rounded-full transition-all z-10",
                    activeTab === 'shopping' ? "bg-white text-slate-900 shadow-sm" : "text-current opacity-60 hover:opacity-100"
                )}
            >
                Shopping List
            </button>
            <button
                onClick={() => onTabChange('pantry')}
                className={clsx(
                    "flex-1 py-3 text-sm font-bold rounded-full transition-all z-10",
                    activeTab === 'pantry' ? "bg-white text-slate-900 shadow-sm" : "text-current opacity-60 hover:opacity-100"
                )}
            >
                What's in Pantry
            </button>
        </div>
    );
};
