import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, BarChart2, Target } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    return (
        <nav className="glass-effect p-4 sticky top-0 z-50 border-b border-white/5">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <Link to="/" className="flex items-center space-x-2 text-white font-extrabold text-xl hover:text-indigo-400 transition-colors font-['Outfit']">
                        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Target className="h-5 w-5 text-white" />
                        </div>
                        <span>GitManager</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-2 border-l border-gray-700/50 pl-6 h-8">
                        <Link
                            to="/dashboard"
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${location.pathname === '/' || location.pathname === '/dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                        >
                            Projects
                        </Link>
                        <Link
                            to="/analytics"
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${location.pathname === '/analytics' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                        >
                            <BarChart2 className="h-4 w-4" />
                            <span>Analytics</span>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 hidden sm:flex">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
                            <span className="text-sm font-bold text-white font-['Outfit']">{username?.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-colors font-semibold text-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
