import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { User, CheckCircle2, Clock, Briefcase, AlertCircle, KeySquare, Activity, ChevronRight, Flag, BarChart3 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

const STATUS_COLORS = {
    todo: 'bg-gray-500/20 text-gray-300 border-gray-600/30',
    in_progress: 'bg-amber-500/20 text-amber-300 border-amber-600/30',
    done: 'bg-emerald-500/20 text-emerald-300 border-emerald-600/30'
};

const PRIORITY_COLORS = {
    low: 'text-blue-400',
    medium: 'text-amber-400',
    high: 'text-red-400'
};

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('tasks'); // 'tasks' | 'activity'

    // Password change state
    const [showPwForm, setShowPwForm] = useState(false);
    const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const fetchAll = useCallback(async () => {
        try {
            const [profileRes, tasksRes, actRes] = await Promise.all([
                api.get('/profile/'),
                api.get('/profile/tasks'),
                api.get('/profile/activity')
            ]);
            setProfile(profileRes.data);
            setTasks(tasksRes.data);
            setActivity(actRes.data);
        } catch (_err) {
            console.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');
        if (pwData.new_password !== pwData.confirm) {
            setPwError('New passwords do not match.');
            return;
        }
        try {
            await api.post('/profile/change-password', {
                current_password: pwData.current_password,
                new_password: pwData.new_password
            });
            setPwSuccess('Password updated successfully!');
            setPwData({ current_password: '', new_password: '', confirm: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Failed to update password.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    const username = profile?.username || '';
    const stats = profile?.stats || {};
    const completionRate = stats.total_assigned > 0
        ? Math.round((stats.completed / stats.total_assigned) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <main className="max-w-5xl mx-auto p-6 lg:p-8">

                {/* Header Card */}
                <div className="glass-card rounded-3xl border border-white/5 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-extrabold shadow-2xl shadow-indigo-500/30 border border-white/10">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white font-['Outfit']">{username}</h1>
                            <p className="text-gray-400 mt-1">Member since {profile?.joined ? new Date(profile.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '—'}</p>
                        </div>
                        <button
                            onClick={() => setShowPwForm(v => !v)}
                            className="ml-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium border border-gray-700 transition-colors"
                        >
                            {showPwForm ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {showPwForm && (
                        <form onSubmit={handleChangePassword} className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="password" placeholder="Current password" required
                                value={pwData.current_password}
                                onChange={e => setPwData({ ...pwData, current_password: e.target.value })}
                                className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            <input type="password" placeholder="New password (min 6 chars)" required
                                value={pwData.new_password}
                                onChange={e => setPwData({ ...pwData, new_password: e.target.value })}
                                className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            <input type="password" placeholder="Confirm new password" required
                                value={pwData.confirm}
                                onChange={e => setPwData({ ...pwData, confirm: e.target.value })}
                                className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            {pwError && <p className="md:col-span-3 text-red-400 text-sm">{pwError}</p>}
                            {pwSuccess && <p className="md:col-span-3 text-emerald-400 text-sm">{pwSuccess}</p>}
                            <button type="submit" className="md:col-span-3 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white transition-all">
                                Update Password
                            </button>
                        </form>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <Briefcase className="w-5 h-5 text-indigo-400" />, label: 'Projects', value: stats.projects ?? 0, color: 'indigo' },
                        { icon: <BarChart3 className="w-5 h-5 text-blue-400" />, label: 'Total Tasks', value: stats.total_assigned ?? 0, color: 'blue' },
                        { icon: <Clock className="w-5 h-5 text-amber-400" />, label: 'In Progress', value: stats.in_progress ?? 0, color: 'amber' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, label: 'Completed', value: stats.completed ?? 0, color: 'emerald' },
                    ].map(s => (
                        <div key={s.label} className="glass-card p-5 rounded-2xl border border-white/5">
                            <div className="flex items-center space-x-2 mb-3">{s.icon}<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</span></div>
                            <p className="text-3xl font-extrabold text-white font-['Outfit']">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Completion Rate Bar */}
                <div className="glass-card p-5 rounded-2xl border border-white/5 mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-300">Overall Completion Rate</span>
                        <span className="text-emerald-400 font-bold">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-700"
                            style={{ width: `${completionRate}%` }}
                        ></div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    {['tasks', 'activity'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >{t}</button>
                    ))}
                </div>

                {tab === 'tasks' && (
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        {tasks.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">No tasks assigned to you yet.</div>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {tasks.map(task => (
                                    <li key={task.id} onClick={() => navigate(`/project/${task.project_id}`)}
                                        className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between group">
                                        <div className="flex items-center space-x-4">
                                            <Flag className={`w-4 h-4 ${PRIORITY_COLORS[task.priority] || 'text-gray-400'}`} />
                                            <div>
                                                <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>{task.title}</p>
                                                <p className="text-xs text-indigo-400 mt-0.5">{task.project_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done' && (
                                                <span className="text-xs text-red-400 font-bold">⚠ Overdue</span>
                                            )}
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[task.status]}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {tab === 'activity' && (
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        {activity.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">No recent activity.</div>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {activity.map(a => (
                                    <li key={a.id} className="p-4 hover:bg-white/5 transition-colors flex items-start space-x-3">
                                        <Activity className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-200">{a.description}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
