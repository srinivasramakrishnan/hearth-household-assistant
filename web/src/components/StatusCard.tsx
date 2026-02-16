import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface StatusCardProps {
    title: string;
    count: number;
    icon: LucideIcon;
    variant: 'blue' | 'yellow' | 'green' | 'pink';
}

export const StatusCard = ({ title, count, icon: Icon, variant }: StatusCardProps) => {
    const variants = {
        blue: 'bg-card-blue text-on-card-blue',
        yellow: 'bg-card-yellow text-on-card-yellow',
        green: 'bg-card-green text-on-card-green',
        pink: 'bg-card-pink text-on-card-pink'
    };

    return (
        <div className={clsx(
            "rounded-[var(--radius-lg)] p-4 flex flex-col justify-between aspect-square material-shadow-1 transition-transform active:scale-95 cursor-pointer",
            variants[variant]
        )}>
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-sm">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            </div>

            <div className="mt-2">
                <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
                <h3 className="text-3xl font-bold">{count}</h3>
            </div>
        </div>
    );
};
