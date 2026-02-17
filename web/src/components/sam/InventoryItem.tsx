import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, Minus, MoreVertical, Trash2, Pencil } from 'lucide-react';

interface InventoryItemProps {
    name: string;
    isChecked?: boolean;
    subtext?: string;
    isRecurring?: boolean;
    variant?: 'checkbox' | 'add' | 'quantity';

    // Quantity Controls
    quantity?: number;
    showQuantity?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;

    // Toggle (Checkbox/Add)
    onToggle?: () => void;

    // Actions
    onEdit?: () => void;
    onDelete?: () => void;
}

export const InventoryItem = ({
    name,
    isChecked = false,
    subtext,
    variant = 'checkbox',
    quantity = 1,
    showQuantity = false,
    onToggle,
    onIncrement,
    onDecrement,
    onEdit,
    onDelete
}: InventoryItemProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    // Determine effective showQuantity (backwards compatibility for 'quantity' variant)
    const shouldShowQuantity = showQuantity || variant === 'quantity';

    return (
        <div className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-slate-100 transition-colors relative group">

            {/* Action Icon on the Left */}
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
                {variant === 'checkbox' ? (
                    <label className="relative flex items-center justify-center cursor-pointer group/check">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => { }}
                            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
                            className="appearance-none w-3 h-3 !min-w-[12px] !min-h-[12px] rounded border border-[var(--accent-sage)] checked:bg-[var(--accent-olive)] checked:border-[var(--accent-olive)] transition-colors"
                        />
                        <Check size={8} className="absolute text-white opacity-0 group-has-[:checked]:opacity-100 pointer-events-none stroke-[3px]" />
                    </label>
                ) : variant === 'add' ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
                        className="w-3 h-3 !min-w-[12px] !min-h-[12px] rounded-full bg-[var(--accent-olive)] flex items-center justify-center text-white hover:bg-[var(--accent-sage)] transition-colors shadow-sm"
                    >
                        <Plus size={8} strokeWidth={3} />
                    </button>
                ) : (
                    // Spacer for quantity/other variants
                    <div className="w-5" />
                )}
            </div>

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className={`text-[14px] font-medium leading-tight truncate ${isChecked ? 'text-[var(--text-tertiary)] line-through decoration-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                    {name}
                </div>
                {subtext && (
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">{subtext}</div>
                )}
            </div>

            {/* Quantity Controls */}
            {shouldShowQuantity && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onDecrement}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 hover:text-[var(--accent-orange)] hover:border-[var(--accent-orange)] transition-colors shadow-sm"
                    >
                        <Minus size={10} strokeWidth={3} />
                    </button>

                    <div className="w-4 text-center text-[12px] font-semibold text-[var(--text-primary)]">
                        {quantity}
                    </div>

                    <button
                        onClick={onIncrement}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 hover:text-[var(--accent-olive)] hover:border-[var(--accent-olive)] transition-colors shadow-sm"
                    >
                        <Plus size={10} strokeWidth={3} />
                    </button>
                </div>
            )}

            {/* More / Menu Options */}
            {(onEdit || onDelete) && (
                <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <MoreVertical size={14} />
                    </button>

                    {/* Popover Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-10 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                            {onEdit && (
                                <button
                                    onClick={() => { setIsMenuOpen(false); onEdit(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-slate-50 transition-colors text-left"
                                >
                                    <Pencil size={12} className="text-[var(--text-secondary)]" />
                                    Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => { setIsMenuOpen(false); onDelete(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
