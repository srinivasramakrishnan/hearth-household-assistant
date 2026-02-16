"use client";
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './lib/firebase';
import { DashboardView } from './views/DashboardView';
import { AllListsView } from './views/AllListsView';
import { LandingView } from './views/LandingView';
import { WaitApprovalView } from './views/WaitApprovalView';
import { HelpView } from './views/HelpView';
import { Loader2, LogOut } from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';

function App() {
  const [user, loading, error] = useAuthState(auth);
  const [appUser, setAppUser] = useState<UserProfile | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'all-lists' | 'help'>('all-lists');
  const [timedOut, setTimedOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch or Create Firestore User
  useEffect(() => {
    let unsubscribe = () => { };

    const syncUser = async () => {
      if (!user) {
        setAppUser(null);
        return;
      }

      setIsAppUserLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        // Use onSnapshot to listen for changes (like approval) in real-time
        unsubscribe = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            setAppUser({ uid: user.uid, ...snapshot.data() } as UserProfile);
          } else {
            // New user registration
            const newUser: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: 'user',
              isApproved: false,
              preferences: {
                autoAddBackToShoppingList: true
              }
            };
            await setDoc(userRef, newUser);
            // Snapshot listener will pick this up immediately
          }
          setIsAppUserLoading(false);
        });
      } catch (err) {
        console.error("Error fetching user doc:", err);
        setIsAppUserLoading(false);
      }
    };

    syncUser();
    return () => unsubscribe();
  }, [user]);

  // Prevent hydration mismatch
  if (!isMounted) return null;

  if ((loading || (user && isAppUserLoading)) && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 className="text-primary animate-spin mx-auto mb-4" size={48} />
          <p className="text-slate-500 animate-pulse">Connecting...</p>
        </div>
      </div>
    );
  }

  if (error || (timedOut && !user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
        <div className="max-w-xs">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Connection Issue</h2>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingView onLoginSuccess={() => setCurrentView('all-lists')} />;
  }

  // Check approval status
  if (appUser && !appUser.isApproved) {
    return <WaitApprovalView onLogout={() => auth.signOut()} email={user.email} />;
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary selection:text-white">
      {currentView === 'dashboard' && (
        <DashboardView
          userName={user.displayName}
          onNavigateToLists={() => setCurrentView('all-lists')}
        />
      )}
      {currentView === 'all-lists' && (
        <AllListsView
          userId={user.uid}
          userName={user.displayName}
          userEmail={user.email}
          isAdmin={appUser?.role === 'admin'}
          onLogout={() => auth.signOut()}
          onBack={() => setCurrentView('dashboard')}
          onNavigateToHelp={() => setCurrentView('help')}
        />
      )}
      {currentView === 'help' && (
        <HelpView onBack={() => setCurrentView('all-lists')} />
      )}
    </div>
  );
}

export default App;
