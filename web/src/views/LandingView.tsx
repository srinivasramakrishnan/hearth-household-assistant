import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, Box, ArrowRight, Loader2, Check, ChefHat, Users } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ListCard } from '../components/ListCard';

interface LandingViewProps {
    onLoginSuccess: () => void;
}

export const LandingView = ({ onLoginSuccess }: LandingViewProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle Email Link Sign-in
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            setIsLoading(true);
            let email = window.localStorage.getItem('emailForSignIn');

            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }

            if (email) {
                signInWithEmailLink(auth, email, window.location.href)
                    .then(async (result) => {
                        window.localStorage.removeItem('emailForSignIn');
                        if (result.user) {
                            await setDoc(doc(db, 'users', result.user.uid), {
                                uid: result.user.uid,
                                email: result.user.email,
                                displayName: result.user.displayName || email?.split('@')[0],
                                photoURL: result.user.photoURL,
                                lastLogin: serverTimestamp()
                            }, { merge: true });
                        }
                        onLoginSuccess();
                    })
                    .catch((err) => {
                        console.error("Email link sign-in failed:", err);
                        setError(err.message);
                        setIsLoading(false);
                    });
            } else {
                setIsLoading(false);
                setError("Email is required to complete sign-in.");
            }
        }
    }, [onLoginSuccess]);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (result.user) {
                await setDoc(doc(db, 'users', result.user.uid), {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }

            onLoginSuccess();
        } catch (err: any) {
            console.error("Login failed:", err);
            if (err.code === 'auth/popup-blocked') {
                setError("Popup blocked! Please allow popups for this site and try again.");
            } else if (err.code === 'auth/configuration-not-found') {
                setError("Firebase Authentication is not configured. Please enable Google Sign-In in the Firebase Console.");
            } else {
                setError(err.message || "Failed to sign in. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">Pantry<span className="text-indigo-600">2List</span></span>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Copy */}
                    <div className="max-w-2xl relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold mb-6 border border-indigo-100">
                            <Zap size={16} className="fill-indigo-700" />
                            <span>New: Smart Pantry Tracking</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                            Stop buying spread. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                Start tracking bread.
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                            Pantry2List bridges the gap between your shopping list and your kitchen inventory. Never wonder "Do I have milk?" again.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="h-14 px-8 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Get Started Free'}
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {error && (
                            <p className="mt-4 text-red-600 text-sm bg-red-50 py-2 px-4 rounded-lg inline-block">{error}</p>
                        )}

                        <div className="mt-8 flex items-center gap-4 text-sm text-slate-500 font-medium">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                                ))}
                            </div>
                            <p>Joined by 1,000+ smart shoppers</p>
                        </div>
                    </div>

                    {/* Right: Phone Mockup */}
                    <div className="relative z-0 lg:h-[600px] flex items-center justify-center">
                        {/* Decorative Blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-200 rounded-full blur-3xl opacity-30" />

                        {/* The Mockup */}
                        <div className="relative w-[320px] bg-white rounded-[40px] shadow-2xl border-8 border-slate-900 overflow-hidden transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500 ease-out">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-2xl z-20" />

                            {/* App Header */}
                            <div className="bg-slate-50 p-6 pt-12 border-b border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                                        Hi <span className="text-indigo-600">Srinivas</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                        <ArrowRight size={16} className="rotate-[-45deg]" />
                                    </div>
                                </div>
                                {/* Fake Tabs */}
                                <div className="flex p-1 bg-slate-200/50 rounded-xl">
                                    <div className="flex-1 py-2 text-center text-xs font-bold bg-white shadow-sm rounded-lg text-slate-900">
                                        Lists
                                    </div>
                                    <div className="flex-1 py-2 text-center text-xs font-bold text-slate-500">
                                        Pantry
                                    </div>
                                </div>
                            </div>

                            {/* App Content */}
                            <div className="bg-surface p-4 space-y-3 min-h-[400px]">
                                <ListCard
                                    title="Weekly Groceries"
                                    itemsCount={12}
                                    pantryCount={5}
                                    variant="purple"
                                    activeTab="shopping"
                                />
                                <ListCard
                                    title="Taco Night"
                                    itemsCount={4}
                                    pantryCount={8}
                                    variant="yellow"
                                    activeTab="shopping"
                                />
                                <ListCard
                                    title="Costco Run"
                                    itemsCount={18}
                                    pantryCount={2}
                                    variant="blue"
                                    activeTab="shopping"
                                />
                            </div>

                            {/* Floating Action Button */}
                            <div className="absolute bottom-6 right-6 w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl material-fab-shadow">
                                <div className="w-6 h-6 border-2 border-white rounded-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to master your kitchen</h2>
                        <p className="text-slate-500 text-lg">Managing groceries shouldn't be a chore. We've built the tools to make it effortless.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-amber-500" />}
                            title="Auto-Replenish"
                            description="Bought it? It's in your pantry. Used it? It's back on your list. The cycle is seamless."
                        />
                        <FeatureCard
                            icon={<ChefHat className="text-indigo-500" />}
                            title="Smart Pantry"
                            description="Know exactly what you have at home before you buy. Reduce food waste and save money."
                        />
                        <FeatureCard
                            icon={<Users className="text-emerald-500" />}
                            title="Collaborative Lists"
                            description="Plan dinner with your partner or roommates. Changes sync in real-time across all devices."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-xl text-slate-900">Pantry<span className="text-indigo-600">2List</span></span>
                    </div>
                    <p className="text-slate-400 text-sm">© 2026 Pantry2List. Built for smart shoppers.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
);
