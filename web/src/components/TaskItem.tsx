import { Check, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { ListItem } from '../types';

interface TaskItemProps {
    item: ListItem;
    onToggle: (item: ListItem) => void;
    onDelete?: (item: ListItem) => void;
    listName?: string; // Optional context
}

export const TaskItem = ({ item, onToggle, onDelete, listName }: TaskItemProps) => {
    // TickTick Style:
    // Left: Checkbox (Priority Color) - Circular for tasks
    // Middle: Content
    // Right: Metadata (Date, Tags, List Name) within the row or on hover actions

    return (
        <div className="group flex items-center gap-3 p-3 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            {/* Checkbox / Priority */}
            <button
                onClick={() => onToggle(item)}
                className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    item.isBought
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-slate-300 hover:border-indigo-500 text-transparent hover:text-indigo-500"
                )}
            >
                <Check size={12} strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={clsx(
                    "text-sm font-medium truncate",
                    item.isBought ? "text-slate-400 line-through" : "text-slate-800"
                )}>
                    {item.name}
                </p>
                {/* Subtitle / Metadata Row */}
                <div className="flex items-center gap-2 mt-0.5">
                    {listName && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {listName}
                        </span>
                    )}
                    {item.quantity && item.quantity > 1 && (
                        <span className="text-xs text-slate-500">
                            Qty: {item.quantity} {item.unit}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions / Date (Right Side) */}
            {/* For now just showing date or nothing. Hover actions could go here. */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Placeholder for future date picker */}
                {/* <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded">
                    <Calendar size={16} />
                 </button> */}
            </div>
        </div>
    );
};
