import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Lock, User, Target, GitBranch, BarChart2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import api from '../services/api';
import { scaleIn, fadeUp, staggerContainer } from '../animations';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
        }
    };

    const FEATURES = [
        { icon: GitBranch, text: 'Sync issues & PRs from GitHub in real time' },
        { icon: BarChart2, text: 'Sprint velocity, burndown & cumulative flow charts' },
        { icon: Bell, text: 'In-app notifications, comments & time tracking' },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] flex relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-10 animate-blob" />
            <div className="absolute top-1/4 -right-4 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-10 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-600 rounded-full blur-[120px] opacity-[0.06] animate-blob animation-delay-4000" />

            {/* Left branding panel */}
            <motion.div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-gray-950/60 backdrop-blur-3xl border-r border-white/5 p-16 relative z-10"
                initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <div className="max-w-md">
                    <motion.div className="mb-8 flex justify-center"
                        animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                            <Target className="w-12 h-12 text-white" />
                        </div>
                    </motion.div>
                    <h1 className="text-5xl font-extrabold gradient-text mb-5 font-['Outfit'] text-center">GitManager</h1>
                    <p className="text-gray-400 text-center leading-relaxed mb-10 text-lg">
                        Elevate your workflow with deeply integrated GitHub task orchestration and intelligent analytics.
                    </p>
                    <motion.div className="space-y-4"
                        variants={staggerContainer(0.1, 0.3)} initial="hidden" animate="show">
                        {/* eslint-disable-next-line no-unused-vars */}
                        {FEATURES.map(({ icon: IconComp, text }) => (
                            <motion.div key={text} variants={fadeUp}
                                className="flex items-center space-x-3 text-gray-400 text-sm">
                                <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <IconComp className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span>{text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right login form */}
            <div className="w-full lg:w-1/2 flex justify-center items-center p-8 z-10">
                <motion.div className="w-full max-w-md glass-card p-10 rounded-3xl border border-white/8"
                    variants={scaleIn} initial="hidden" animate="show">

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold text-white mb-2 font-['Outfit']">Welcome Back</h2>
                        <p className="text-gray-400">Sign in to orchestrate your tasks.</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-medium">
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input type="text" required value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 outline-none transition-all"
                                    placeholder="Enter your username" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input type="password" required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 outline-none transition-all"
                                    placeholder="••••••••" />
                            </div>
                        </div>

                        <motion.button type="submit" disabled={loading}
                            whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 24px rgba(99,102,241,0.5)' } : {}}
                            whileTap={!loading ? { scale: 0.97 } : {}}
                            className={`w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex justify-center items-center space-x-2 shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {loading ? (
                                <motion.div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                            ) : (
                                <><span>Sign In</span><LogIn className="h-5 w-5" /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center text-gray-400 text-sm">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                            Create Workspace
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
