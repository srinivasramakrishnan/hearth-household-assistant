import { ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ListCardProps {
    title: string;
    itemsCount: number;
    pantryCount: number;
    variant: 'blue' | 'yellow' | 'green' | 'pink' | 'purple';
    activeTab: 'shopping' | 'pantry';
    onClick?: () => void;
}

export const ListCard = ({ title, itemsCount, pantryCount, variant, activeTab, onClick }: ListCardProps) => {
    const variants = {
        blue: 'bg-card-blue text-on-card-blue',
        yellow: 'bg-card-yellow text-on-card-yellow',
        green: 'bg-card-green text-on-card-green',
        pink: 'bg-card-pink text-on-card-pink',
        purple: 'bg-purple-200 text-purple-900'
    };

    const isShopping = activeTab === 'shopping';

    return (
        <div
            onClick={onClick}
            className={clsx(
                "rounded-[var(--radius-xl)] p-6 relative overflow-hidden material-shadow-1 transition-transform active:scale-98 cursor-pointer group h-40 flex flex-col justify-between",
                variants[variant]
            )}
        >
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                <div className="bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    {/* Dynamic badge based on what's interesting? Show both for now or just one? Prompt said "instead of pills... show 7 in pantry". Let's show Pantry count prominently */}
                    <span className="text-xs font-semibold">
                        {isShopping ? `${itemsCount} To Buy` : `${pantryCount} In Pantry`}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-end">
                <p className="text-sm font-medium opacity-80">
                    {isShopping ? `${pantryCount} In Pantry` : `${itemsCount} To Buy`}
                </p>
                <button className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center transition-colors group-hover:bg-black/20">
                    <ArrowUpRight size={20} />
                </button>
            </div>
        </div>
    );
};
