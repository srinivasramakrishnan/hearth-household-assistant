import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavBar } from './TopNavBar';

interface LayoutProps {
    children: React.ReactNode;
    currentView: string;
    onNavigate: (view: any) => void;
    onLogout: () => void;
    userEmail?: string | null;
    userName?: string | null;
    userId?: string;
}

export const Layout = ({ children, currentView, onNavigate, onLogout, userEmail, userName, userId }: LayoutProps) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive sidebar behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <TopNavBar
                onMenuClick={toggleSidebar}
                userName={userName}
                userId={userId}
                onLogout={onLogout}
            />

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
                {/* Sidebar - Desktop: Relative/Collapsible | Mobile: Absolute/Drawer */}
                <div className={`
                    ${isMobile ? 'absolute z-30 h-full shadow-2xl' : 'relative'}
                    ${isSidebarOpen ? 'w-64' : 'w-0'} 
                    transition-all duration-300 ease-in-out bg-slate-50 border-r border-slate-200 overflow-hidden
                `}>
                    <div className="w-64 h-full"> {/* Inner container to prevent content squishing */}
                        <Sidebar
                            currentView={currentView as any}
                            onNavigate={(view) => {
                                onNavigate(view);
                                if (isMobile) setSidebarOpen(false);
                            }}
                            onLogout={onLogout}
                            userEmail={userEmail}
                            compact={true} // New prop to hide header/logout if desired since they are in TopNav/UserMenu
                        />
                    </div>
                </div>

                {/* Mobile Backdrop */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/20 z-20 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative w-full bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
};
