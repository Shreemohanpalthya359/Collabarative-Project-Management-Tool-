import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Target } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const triggerShortcutsHelp = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    };

    const isActive = (path) =>
        location.pathname === path || (path === '/dashboard' && location.pathname === '/');

    return (
        <motion.nav
            className="glass-effect p-3.5 sticky top-0 z-50 border-b border-white/5"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.05 }}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <Link to="/" className="flex items-center space-x-2.5 font-extrabold text-xl font-['Outfit'] group">
                        <motion.div
                            className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                        >
                            <Target className="h-4 w-4 text-white" />
                        </motion.div>
                        <span className="gradient-text">GitManager</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1 border-l border-gray-700/50 pl-6">
                        {[{ label: 'Projects', to: '/dashboard' }, { label: 'About', to: '/about' }, { label: '🗑 Bin', to: '/recycle-bin' }].map(({ label, to }) => (
                            <Link key={to} to={to}
                                className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${isActive(to) ? 'text-indigo-300' : 'text-gray-500 hover:text-white'
                                    }`}>
                                {isActive(to) && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={triggerShortcutsHelp}
                        className="hidden sm:flex items-center px-2.5 py-1.5 rounded-lg border border-gray-700/50 text-gray-500 hover:text-gray-200 hover:border-gray-500 transition-colors text-xs font-mono"
                        title="Keyboard shortcuts (?)"
                    >
                        ?
                    </motion.button>

                    <NotificationBell />

                    <Link to="/profile" className="hidden sm:flex items-center space-x-2.5 group">
                        <motion.div
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg"
                            whileHover={{ scale: 1.12, boxShadow: '0 0 0 3px rgba(99,102,241,0.45)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                        >
                            <span className="text-sm font-bold text-white font-['Outfit']">
                                {username?.charAt(0).toUpperCase()}
                            </span>
                        </motion.div>
                        <span className="text-gray-400 text-sm font-medium group-hover:text-white transition-colors">
                            {username}
                        </span>
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-colors font-semibold text-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </motion.button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
