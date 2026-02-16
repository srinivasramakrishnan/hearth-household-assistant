import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
    onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-50 material-fab-shadow"
            aria-label="Add Item"
        >
            <Plus size={32} strokeWidth={2.5} />
        </button>
    );
};
