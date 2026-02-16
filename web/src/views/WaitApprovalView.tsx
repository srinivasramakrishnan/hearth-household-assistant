
import React from 'react';
import { Clock, LogOut } from 'lucide-react';

interface WaitApprovalViewProps {
    onLogout: () => void;
    email?: string | null;
}

export function WaitApprovalView({ onLogout, email }: WaitApprovalViewProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Clock className="text-primary" size={40} />
                </div>

                <h1 className="text-3xl font-bold text-on-surface mb-4">Account Pending</h1>

                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                    Thanks for signing up{email ? `, ${email}` : ''}!
                    <br />
                    Your account is currently waiting for administrator approval.
                    You will be granted access once an admin reviews your request.
                </p>

                <div className="bg-surface-variant/50 border border-border p-4 rounded-xl mb-8 text-sm text-slate-500">
                    Please contact the administrator if you believe this is an error or if you need immediate access.
                </div>

                <button
                    onClick={onLogout}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
