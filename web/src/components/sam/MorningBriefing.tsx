
import React from 'react';
import { ChevronDown, Calendar, AlertCircle } from 'lucide-react';

export const MorningBriefing = () => {
    return (
        <details className="group bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-[var(--shadow-soft)] mb-2 transition-all duration-300">
            <summary className="list-none p-4 cursor-pointer flex justify-between items-center bg-[var(--bg-card)]">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Morning Briefing</span>
                <ChevronDown size={16} className="text-[var(--text-secondary)] transition-transform group-open:rotate-180" />
            </summary>

            <div className="px-4 pb-4 flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                    <div className="w-7 h-7 bg-[var(--bg-paper)] rounded-full flex items-center justify-center text-[var(--accent-olive)]">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-[16px] text-[var(--text-primary)]">3 Items</div>
                        <div className="text-[13px] text-[var(--text-secondary)]">Expiring soon</div>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="w-7 h-7 bg-[var(--bg-paper)] rounded-full flex items-center justify-center text-[var(--accent-olive)]">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-[16px] text-[var(--text-primary)]">Soccer</div>
                        <div className="text-[13px] text-[var(--text-secondary)]">Starts in 2h</div>
                    </div>
                </div>
            </div>
        </details>
    );
};
