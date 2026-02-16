import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import guideCreate from '../assets/guide-create.png';
import guideAdd from '../assets/guide-add.png';
import guidePantry from '../assets/guide-pantry.png';
import guideInvite from '../assets/guide-invite.png';
import guideRestock from '../assets/guide-restock.png';

interface HelpViewProps {
    onBack: () => void;
}

export const HelpView = ({ onBack }: HelpViewProps) => {
    const guides = [
        {
            title: "Creating a List",
            description: "Tap the + button in the top right to start a new shopping list. Give it a name and it will appear in your main view.",
            image: guideCreate,
            color: "bg-purple-100 text-purple-900"
        },
        {
            title: "Adding Items",
            description: "Tap on any list to expand it. Type in the bottom bar to add items quickly. They will appear at the top of your list.",
            image: guideAdd,
            color: "bg-blue-100 text-blue-900"
        },
        {
            title: "Managing Pantry",
            description: "Switch between 'Shopping' and 'Pantry' tabs. Checked items from your shopping list can be moved directly to your pantry to keep track of what you have at home.",
            image: guidePantry,
            color: "bg-yellow-100 text-yellow-900"
        },
        {
            title: "Inviting Collaborators",
            description: "Share your lists with family or roommates. Go to the menu, select 'Manage Collaborators', and invite them by email.",
            image: guideInvite,
            color: "bg-green-100 text-green-900"
        },
        {
            title: "Restocking & Consuming",
            description: "In your pantry, use the '+' button to quickly add an item back to your shopping list. Use the '-' button to decrease the quantity as you use items.",
            image: guideRestock,
            color: "bg-orange-100 text-orange-900"
        }
    ];

    return (
        <div className="min-h-screen bg-surface pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Help & Guides</h1>
            </div>

            <div className="px-6 py-6 max-w-2xl mx-auto space-y-12">
                {guides.map((guide, index) => (
                    <section key={index} className="space-y-4">
                        <div className={`rounded-2xl overflow-hidden shadow-sm border border-slate-100 ${guide.color}`}>
                            <div className="aspect-video w-full bg-white/50 relative">
                                <Image
                                    src={guide.image}
                                    alt={guide.title}
                                    className="object-contain p-4"
                                    fill
                                />
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-2">{guide.title}</h2>
                                <p className="opacity-90 leading-relaxed">
                                    {guide.description}
                                </p>
                            </div>
                        </div>
                    </section>
                ))}


            </div>
        </div>
    );
};
