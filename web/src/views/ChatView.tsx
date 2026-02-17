
import React, { useState, useEffect, useRef } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { format } from 'date-fns';
import { Loader2, User, Bot, Calendar, ShoppingCart, CheckCircle } from 'lucide-react';

interface Message {
    id: string;
    userId: string;
    text: string;
    direction: 'in' | 'out';
    timestamp: number;
    actionTaken?: {
        type: string;
        args: any;
        result: any;
    };
}

export const ChatView = () => {
    // 1. Fetch Users Data for mapping
    const [usersSnapshot] = useCollection(collection(db, 'users'));
    const usersMap = React.useMemo(() => {
        const map: Record<string, UserProfile> = {};
        usersSnapshot?.docs.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.phoneNumber) {
                map[data.phoneNumber] = { ...data, uid: doc.id };
            }
        });
        return map;
    }, [usersSnapshot]);

    // 2. Fetch All Messages Order by Date
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const [messagesSnapshot, loading] = useCollection(q);
    const messages = messagesSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as Message)) || [];

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const renderActionBubble = (action: Message['actionTaken']) => {
        if (!action) return null;

        let icon = <CheckCircle size={16} />;
        let title = "Action Taken";
        let details = "";
        let colorClass = "bg-green-50 text-green-700 border-green-100";

        switch (action.type) {
            case 'addEvent':
                icon = <Calendar size={16} />;
                title = "Event Scheduled";
                details = `"${action.args.title}" on ${action.args.date}`;
                colorClass = "bg-blue-50 text-blue-700 border-blue-100";
                break;
            case 'addToShoppingList':
                icon = <ShoppingCart size={16} />;
                title = "Added to List";
                details = `"${action.args.item}"` + (action.args.listName ? ` to ${action.args.listName}` : "");
                colorClass = "bg-amber-50 text-amber-700 border-amber-100";
                break;
            case 'updatePantryItem':
                icon = <CheckCircle size={16} />;
                title = "Pantry Updated";
                details = `${action.args.item}: ${action.args.status}`;
                colorClass = "bg-purple-50 text-purple-700 border-purple-100";
                break;
            default:
                details = JSON.stringify(action.args);
        }

        return (
            <div className={`mt-2 mb-1 p-3 rounded-lg border text-sm flex items-start gap-2 ${colorClass}`}>
                <div className="mt-0.5">{icon}</div>
                <div>
                    <div className="font-semibold text-xs uppercase tracking-wider opacity-80">{title}</div>
                    <div className="font-medium">{details}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] md:h-[600px] w-full bg-slate-50 rounded-xl shadow-sm overflow-hidden border border-slate-100">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm z-10">
                <h2 className="font-serif text-lg font-medium text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Bot size={18} />
                    </div>
                    Hearth Chat
                </h2>
                <div className="text-xs text-slate-500">
                    {messages.length} messages
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : !messages || messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-8">No messages yet.</div>
                ) : (
                    messages.map((msg) => {
                        const isOut = msg.direction === 'out';
                        const user = usersMap[msg.userId];
                        const displayName = user?.displayName || msg.userId || "Unknown";
                        const avatarLetter = displayName[0]?.toUpperCase() || '#';

                        return (
                            <div key={msg.id} className={`flex w-full flex-col ${isOut ? 'items-end' : 'items-start'}`}>

                                {/* Sender Name (User or Assistant) */}
                                <div className={`text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-1 ${isOut ? 'flex-row-reverse' : ''}`}>
                                    {isOut ? (
                                        <>
                                            <span className="font-medium text-indigo-500">Hearth</span>
                                            <span className="text-[10px]">• {format(msg.timestamp, 'MMM d, h:mm a')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-medium text-slate-600">{displayName}</span>
                                            <span className="text-[10px]">• {format(msg.timestamp, 'MMM d, h:mm a')}</span>
                                        </>
                                    )}
                                </div>

                                <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isOut ? 'flex-row-reverse' : ''}`}>

                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${isOut ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>
                                        {isOut ? <Bot size={16} /> : avatarLetter}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col w-full ${isOut ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-3 text-sm shadow-sm w-fit ${isOut
                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none'
                                            }`}>
                                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                                        </div>

                                        {/* Action Bubble (Rendered outside the text bubble for visual distinction, or inside?) 
                                            Let's render it below the text bubble if it exists.
                                        */}
                                        {msg.actionTaken && (
                                            <div className="w-full max-w-sm">
                                                {renderActionBubble(msg.actionTaken)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// Removed inner ChatWindow component as it's no longer used.
