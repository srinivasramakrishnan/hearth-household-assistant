"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null | undefined;
    appUser: UserProfile | null;
    loading: boolean;
    error: Error | undefined;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: undefined,
    appUser: null,
    loading: true,
    error: undefined,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, loadingAuth, error] = useAuthState(auth);
    const [appUser, setAppUser] = useState<UserProfile | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);

    useEffect(() => {
        let unsubscribe = () => { };

        const syncUser = async () => {
            if (!user) {
                setAppUser(null);
                setLoadingUser(false);
                return;
            }

            setLoadingUser(true);
            try {
                const userRef = doc(db, 'users', user.uid);
                unsubscribe = onSnapshot(userRef, async (snapshot) => {
                    if (snapshot.exists()) {
                        setAppUser({ uid: user.uid, ...snapshot.data() } as UserProfile);
                    } else {
                        // Create new user profile if logic requires it here, 
                        // matching previous App.tsx logic
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
                    }
                    setLoadingUser(false);
                });
            } catch (err) {
                console.error("Error syncing user:", err);
                setLoadingUser(false);
            }
        };

        syncUser();
        return () => unsubscribe();
    }, [user]);

    const logout = async () => {
        await auth.signOut();
    };

    const loading = loadingAuth || (!!user && loadingUser);

    return (
        <AuthContext.Provider value={{ user, appUser, loading, error, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
