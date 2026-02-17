import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    Check,
    MessageCircle,
    ShoppingCart,
    Users,
    Leaf,
    Menu,
    X,
    ChevronRight,
    Star
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface LandingViewProps {
    onLoginSuccess: () => void;
    isLoggedIn?: boolean;
    onGoToDashboard?: () => void;
}

export const LandingView = ({ onLoginSuccess, isLoggedIn = false, onGoToDashboard }: LandingViewProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    // Auth State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial check for email link sign-in
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            handleEmailLinkSignIn();
        }
    }, []);

    const handleEmailLinkSignIn = async () => {
        setIsLoading(true);
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }

        if (email) {
            try {
                const result = await signInWithEmailLink(auth, email, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                if (result.user) {
                    await updateUserDoc(result.user);
                }
                onLoginSuccess();
            } catch (err: any) {
                console.error("Email link sign-in failed:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            setError("Email is required to complete sign-in.");
        }
    };

    const handleLogin = async () => {
        if (isLoggedIn && onGoToDashboard) {
            onGoToDashboard();
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                await updateUserDoc(result.user);
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.message || "Failed to sign in.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserDoc = async (user: any) => {
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp()
        }, { merge: true });
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="text-white w-4 h-4" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Sam</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <NavLink href="#features">Features</NavLink>
                        <NavLink href="#how-it-works">How it works</NavLink>
                        <NavLink href="#pricing">Pricing</NavLink>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogin}
                            className="hidden md:flex px-5 py-2 rounded-full bg-white text-slate-950 font-semibold text-sm hover:bg-indigo-50 transition-colors"
                        >
                            {isLoggedIn ? 'Dashboard' : 'Sign In'}
                        </button>
                        <button
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-slate-950 pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-2xl font-light">
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
                            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                            <button
                                onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
                                className="mt-8 w-full py-4 bg-indigo-600 rounded-xl font-bold text-lg text-center"
                            >
                                {isLoggedIn ? 'Go to Dashboard' : 'Sign In'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-medium mb-8"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Now in Public Beta
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
                    >
                        <span className="text-white">Run your home</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
                            on autopilot.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Sam is the AI household manager that remembers the milk, organizes your pantry, and syncs your family schedule. All through a simple chat.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/25 w-full sm:w-auto justify-center"
                        >
                            {isLoading ? 'Connecting...' : (isLoggedIn ? 'Go to Dashboard' : 'Start for Free')}
                            <ArrowRight size={20} />
                        </button>
                        <a
                            href="#demo"
                            className="h-14 px-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            See how it works
                        </a>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl inline-block"
                        >
                            {error}
                        </motion.div>
                    )}
                </div>

                {/* Hero Visual */}
                <motion.div
                    style={{ opacity, scale }}
                    className="mt-24 max-w-6xl mx-auto relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
                    <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-900/20 aspect-[16/10] md:aspect-[21/9] flex flex-col md:flex-row">
                        {/* Fake Clean UI */}
                        <div className="w-full md:w-80 border-r border-white/5 bg-slate-900/80 p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <MessageCircle size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Chat with Sam</div>
                                    <div className="text-xs text-indigo-300">Active now</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 rounded-xl bg-white/5 text-sm text-slate-300">
                                    "I noticed you're out of olive oil. Want me to add it?"
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-600 text-sm text-white ml-auto max-w-[90%]">
                                    "Yes, and remind me to water the plants on Tuesday."
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-950/50 p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Shopping List</h3>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-5 h-5 rounded border-2 border-slate-600" />
                                        <span className="text-slate-200">Extra Virgin Olive Oil</span>
                                        <span className="ml-auto px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">Added via Chat</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-5 h-5 rounded border-2 border-slate-600" />
                                        <span className="text-slate-200">Dish Soap</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Upcoming</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                                            <span className="text-xs text-slate-400 uppercase">Feb</span>
                                            <span className="text-lg font-bold text-white">18</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Water Plants</div>
                                            <div className="text-sm text-slate-400">9:00 AM • Recurring</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MessageCircle className="text-indigo-400" />}
                            title="Chat-First Design"
                            description="Talk to Sam like a person. Text via WhatsApp or the web app to add items, check your pantry, or set reminders."
                        />
                        <FeatureCard
                            icon={<ShoppingCart className="text-emerald-400" />}
                            title="Smart Pantry"
                            description="Stop double-buying. Sam tracks what you have and suggests recipes based on your inventory."
                        />
                        <FeatureCard
                            icon={<Users className="text-violet-400" />}
                            title="Family Sync"
                            description="Real-time sync for the whole house. When you add milk, your partner sees it instantly."
                        />
                    </div>
                </div>
            </section>

            {/* Value Prop Section */}
            <section className="py-32 px-6 bg-slate-900/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">The mental load is real. <br /><span className="text-indigo-400">Sam carries it for you.</span></h2>
                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Managing a household is a full-time job. Between grocery runs, meal planning, and coordinating schedules, it's easy to feel overwhelmed.
                            Sam acts as your central brain, ensuring nothing falls through the cracks.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                "No more 'Did you buy eggs?' texts",
                                "Reduce food waste with pantry tracking",
                                "Automated recurring chores"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <Check size={14} className="text-indigo-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 w-full relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
                        <div className="relative bg-slate-950 border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col gap-4">
                                <ChatBubble text="Hey Sam, we're out of paper towels." isUser />
                                <ChatBubble text="Added Paper Towels to your Shopping List. Anything else?" />
                                <ChatBubble text="Yeah, remind me to check the mail when I get home." isUser />
                                <ChatBubble text="Got it. I'll remind you to 'Check Mail' at 6:00 PM." />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-24 px-6 text-center border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="fill-emerald-400 text-emerald-400" size={20} />)}
                    </div>
                    <h2 className="text-3xl font-bold mb-8">"Finally, a household app that actually works."</h2>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder logos */}
                        <span className="text-xl font-bold">TechCrunch</span>
                        <span className="text-xl font-bold">ProductHunt</span>
                        <span className="text-xl font-bold">TheVerge</span>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900/20" />
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to upgrade your home?</h2>
                    <p className="text-xl text-slate-300 mb-10">Join thousands of organized households today.</p>
                    <button
                        onClick={handleLogin}
                        className="h-16 px-10 rounded-full bg-white text-slate-950 font-bold text-xl hover:bg-indigo-50 transition-all shadow-xl shadow-white/10"
                    >
                        Get Started for Free
                    </button>
                    <p className="mt-6 text-sm text-slate-500">No credit card required.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-slate-950">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Sparkles className="text-white w-4 h-4" />
                        </div>
                        <span className="font-bold text-xl text-white">Sam</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © 2026 Bilbo Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Components
const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
        {children}
    </a>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const ChatBubble = ({ text, isUser = false }: { text: string, isUser?: boolean }) => (
    <div className={`p-4 rounded-2xl max-w-[80%] ${isUser ? 'bg-indigo-600 text-white ml-auto rounded-tr-sm' : 'bg-white/10 text-slate-200 mr-auto rounded-tl-sm'}`}>
        {text}
    </div>
);

