import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Lock, User, Target } from 'lucide-react';
import api from '../services/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', { username, password });
            setSuccess('Registration successful! Redirecting to sign in...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>

            {/* Left Side: Branding / Graphic */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-gray-900/50 backdrop-blur-3xl border-r border-white/5 p-12 relative z-10">
                <div className="max-w-md text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-bl from-emerald-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <Target className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 mb-6 font-['Outfit']">
                        Join GitManager
                    </h1>
                    <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                        Create your workspace to orchestrate tasks effectively and track your GitHub repositories natively in one place.
                    </p>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="w-full lg:w-1/2 flex justify-center items-center p-8 z-10">
                <div className="w-full max-w-md glass-card p-10 rounded-3xl relative">

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold text-white mb-2 font-['Outfit']">Create Account</h2>
                        <p className="text-gray-400">Set up your workspace in seconds.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-medium animate-[pulse_1s_ease-in-out]">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-center font-medium animate-[pulse_1s_ease-in-out]">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-transparent text-white placeholder-gray-500 outline-none transition-all focus:bg-gray-800/80"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={success}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-transparent text-white placeholder-gray-500 outline-none transition-all focus:bg-gray-800/80"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={success}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl font-bold flex justify-center items-center space-x-2 transition-all shadow-lg hover:shadow-emerald-500/25 ${loading || success ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Sign Up</span>
                                    <UserPlus className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors pointer-events-auto">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
