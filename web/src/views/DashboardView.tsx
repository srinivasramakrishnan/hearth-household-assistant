import {
    Clock,
    Calendar,
    Layers,
    AlertCircle,
    Bell,
    Grip
} from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { TaskItem } from '../components/TaskItem';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useState } from 'react';

interface DashboardViewProps {
    userName?: string | null;
    onNavigateToLists: () => void;
}

export const DashboardView = ({ userName, onNavigateToLists }: DashboardViewProps) => {
    // Mock data for now, ideally this comes from Firestore
    const [tasks, setTasks] = useState([
        { id: '1', title: 'Project retrospective', completed: false, timestamp: 'Today, 4:50 PM' },
        { id: '2', title: 'Evening team meeting', completed: false, timestamp: 'Today, 4:50 PM' },
        { id: '3', title: 'Create monthly deck', completed: false, timestamp: 'Today' },
        { id: '4', title: 'Shop for groceries', completed: false, timestamp: 'Today, 6:00 PM' },
        { id: '5', title: 'Read book', completed: false, timestamp: 'Yesterday, 10:30 PM' },
    ]);

    const handleToggle = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <div className="pb-24 px-6 pt-12 max-w-md mx-auto min-h-screen bg-surface">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hello {userName?.split(' ')[0] || 'User'},</h1>
                    <p className="text-slate-500 mt-1">You have work today</p>
                </div>
                <div className="flex gap-4">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Bell size={24} />
                    </button>
                    <button
                        onClick={onNavigateToLists}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <Grip size={24} />
                    </button>
                </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <StatusCard
                    title="Today"
                    count={9}
                    icon={Clock}
                    variant="blue"
                />
                <StatusCard
                    title="Scheduled"
                    count={5}
                    icon={Calendar}
                    variant="yellow"
                />
                <StatusCard
                    title="All"
                    count={14}
                    icon={Layers}
                    variant="green"
                />
                <StatusCard
                    title="Overdue"
                    count={3}
                    icon={AlertCircle}
                    variant="pink"
                />
            </div>

            {/* Tasks List */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-6">Today's Task</h2>
                <div className="space-y-1">
                    {tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            id={task.id}
                            title={task.title}
                            completed={task.completed}
                            timestamp={task.timestamp}
                            onToggle={() => handleToggle(task.id)}
                            onDelete={() => { }}
                        />
                    ))}
                </div>
            </div>

            <FloatingActionButton onClick={() => console.log('Add')} />
        </div>
    );
};
