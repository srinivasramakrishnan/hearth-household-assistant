import { Trash2, GripVertical, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskItemProps {
    id: string;
    title: string;
    completed: boolean;
    timestamp?: string;
    onToggle: () => void;
    onDelete: () => void;
}

export const TaskItem = ({ id, title, completed, timestamp, onToggle, onDelete }: TaskItemProps) => {
    return (
        <motion.div
            layoutId={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white rounded-[var(--radius-lg)] p-4 mb-3 flex items-start space-x-4 material-shadow-1 hover:shadow-md transition-shadow"
        >
            {/* Custom Radio/Checkbox */}
            <button
                onClick={onToggle}
                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completed
                        ? 'bg-primary border-primary text-white'
                        : 'border-slate-300 hover:border-primary'
                    }`}
            >
                {completed && <Check size={14} strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {timestamp && (
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                                <span>{timestamp}</span>
                            </div>
                        )}
                        <h4 className={`text-base font-medium leading-relaxed transition-all ${completed ? 'text-slate-400 line-through decoration-2 decoration-slate-200' : 'text-slate-800'
                            }`}>
                            {title}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 flex items-center bg-white pl-2">
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </motion.div>
    );
};
