import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, BarChart2, Briefcase, Activity, TrendingUp, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import {
    PieChart as RePieChart, Pie, Cell, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, LineChart, Line
} from 'recharts';
import { subDays, format, isSameDay } from 'date-fns';
import api from '../services/api';
import Navbar from '../components/Navbar';

const STATUS_COLORS = {
    todo: '#6366f1',
    in_progress: '#f59e0b',
    done: '#10b981'
};

const PRIORITY_COLORS = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444'
};

/* ── Custom Tooltip ─────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
            {label && <p className="text-gray-400 mb-1 font-medium">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.stroke }} className="font-bold">
                    {p.name}: {p.value ?? '—'}
                </p>
            ))}
        </div>
    );
};

/* ── Center label for donut ─────────────────────── */
const DonutCenter = ({ cx, cy, total, label }) => (
    <>
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={28} fontWeight={800} fontFamily="Outfit">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#9ca3af" fontSize={12}>{label}</text>
    </>
);

const Analytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [stats, setStats] = useState(null);
    const [velocity, setVelocity] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState(null);
    const [burndown, setBurndown] = useState(null);
    const [burndownLoading, setBurndownLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const projRes = await api.get('/projects');
                const currProj = projRes.data.find(p => p.id === parseInt(id));
                setProject(currProj);

                const [statsRes, activitiesRes, sprintsRes] = await Promise.all([
                    api.get(`/analytics/project/${id}/stats`),
                    api.get(`/analytics/project/${id}/activities`),
                    api.get(`/sprints/project/${id}`)
                ]);
                setStats(statsRes.data);
                setSprints(sprintsRes.data);
                if (sprintsRes.data.length > 0) setSelectedSprintId(sprintsRes.data[0].id);

                const recentActivities = activitiesRes.data;
                const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
                const velocityData = last7Days.map(date => ({
                    date: format(date, 'MMM dd'),
                    completed: recentActivities.filter(a =>
                        a.action_type === 'status_update' &&
                        a.description?.includes("to 'done'") &&
                        isSameDay(new Date(a.created_at), date)
                    ).length
                }));
                setVelocity(velocityData);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [id]);

    useEffect(() => {
        if (!selectedSprintId) return;
        const fetchBurndown = async () => {
            setBurndownLoading(true);
            try {
                const res = await api.get(`/analytics/project/${id}/burndown?sprint_id=${selectedSprintId}`);
                setBurndown(res.data);
            } catch (_err) {
                setBurndown(null);
            } finally {
                setBurndownLoading(false);
            }
        };
        fetchBurndown();
    }, [id, selectedSprintId]);

    if (!project || loading || !stats) return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    const statusData = stats.status_breakdown.map(s => ({
        name: (s.name || 'unspecified').replace('_', ' '),
        value: s.value,
        color: STATUS_COLORS[s.name] || '#8b5cf6'
    }));
    const totalTasks = statusData.reduce((acc, s) => acc + s.value, 0);

    const priorityData = stats.priority_breakdown.map(p => ({
        name: (p.name || 'none'),
        value: p.value,
        fill: PRIORITY_COLORS[p.name] || '#8b5cf6'
    }));

    const workloadData = stats.workload.map(w => ({
        name: w.assignee_id ? `User ${w.assignee_id}` : 'Unassigned',
        Points: w.total_estimate || 0
    }));

    const done = statusData.find(s => s.name === 'done')?.value ?? 0;
    const inProgress = statusData.find(s => s.name === 'in progress')?.value ?? 0;

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-['Inter']">
            <Navbar />

            <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">

                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate(`/project/${id}`)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center font-['Outfit']">
                            <Activity className="w-7 h-7 mr-3 text-emerald-400" />
                            Analytics
                        </h1>
                        <p className="text-gray-500 mt-0.5">{project.name} · Task insights and team performance</p>
                    </div>
                </div>

                {/* ── KPI Summary Cards ──────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <ListTodo className="w-5 h-5 text-indigo-400" />, label: 'Total Tasks', value: totalTasks, sub: 'all statuses', glow: 'shadow-indigo-500/10' },
                        { icon: <Clock className="w-5 h-5 text-amber-400" />, label: 'In Progress', value: inProgress, sub: 'being worked on', glow: 'shadow-amber-500/10' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, label: 'Completed', value: done, sub: 'tasks done', glow: 'shadow-emerald-500/10' },
                        { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, label: 'Completion', value: totalTasks > 0 ? `${Math.round((done / totalTasks) * 100)}%` : '0%', sub: 'success rate', glow: 'shadow-purple-500/10' },
                    ].map(k => (
                        <div key={k.label} className={`glass-card border border-white/5 rounded-2xl p-5 shadow-xl ${k.glow}`}>
                            <div className="flex items-center space-x-2 mb-3">{k.icon}<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{k.label}</span></div>
                            <p className="text-3xl font-extrabold text-white font-['Outfit']">{k.value}</p>
                            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Row 1: Status Donut + Priority Bars ───────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                    {/* Donut — Task Status */}
                    <div className="glass-card border border-white/5 rounded-2xl p-6 bg-gray-900/40">
                        <h2 className="text-lg font-bold font-['Outfit'] mb-5 flex items-center">
                            <PieChart className="w-4 h-4 mr-2 text-indigo-400" /> Task Status
                        </h2>
                        {statusData.length > 0 ? (
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <defs>
                                            {statusData.map((s, i) => (
                                                <linearGradient key={i} id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                                                    <stop offset="100%" stopColor={s.color} stopOpacity={0.6} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <Pie data={statusData} cx="50%" cy="50%"
                                            innerRadius={65} outerRadius={95}
                                            paddingAngle={4} dataKey="value"
                                            strokeWidth={0}>
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={`url(#sg${i})`} />
                                            ))}
                                        </Pie>
                                        <DonutCenter cx="50%" cy="50%" total={totalTasks} label="Total Tasks" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            formatter={(value) => <span className="text-gray-300 capitalize text-xs font-semibold">{value}</span>}
                                            iconType="circle" iconSize={8}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <EmptyChart />}
                    </div>

                    {/* Horizontal Bar — Priority Breakdown */}
                    <div className="glass-card border border-white/5 rounded-2xl p-6 bg-gray-900/40">
                        <h2 className="text-lg font-bold font-['Outfit'] mb-5 flex items-center">
                            <BarChart2 className="w-4 h-4 mr-2 text-pink-400" /> Priority Breakdown
                        </h2>
                        {priorityData.length > 0 ? (
                            <div className="space-y-4 mt-2">
                                {priorityData.map(p => {
                                    const pct = totalTasks > 0 ? Math.round((p.value / totalTasks) * 100) : 0;
                                    return (
                                        <div key={p.name}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-semibold capitalize text-gray-300">{p.name}</span>
                                                <span className="font-bold" style={{ color: p.fill }}>{p.value} tasks · {pct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-3 rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, backgroundColor: p.fill, boxShadow: `0 0 8px ${p.fill}60` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <EmptyChart />}
                    </div>
                </div>

                {/* ── Velocity Area Chart ───────────────────────────── */}
                <div className="glass-card border border-white/5 rounded-2xl p-6 bg-gray-900/40 mb-6">
                    <h2 className="text-lg font-bold font-['Outfit'] mb-5 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" /> Daily Velocity — Tasks Completed
                    </h2>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="date" stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="completed" name="Completed"
                                    stroke="#10b981" strokeWidth={3}
                                    fill="url(#velGrad)"
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0A0A0B' }}
                                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Workload Bar Chart ────────────────────────────── */}
                <div className="glass-card border border-white/5 rounded-2xl p-6 bg-gray-900/40 mb-6">
                    <h2 className="text-lg font-bold font-['Outfit'] mb-5 flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-blue-400" /> Team Workload (Story Points)
                    </h2>
                    {workloadData.length > 0 && workloadData.some(w => w.Points > 0) ? (
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                    <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                                    <Bar dataKey="Points" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={48}
                                        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.4))' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-600">
                            <Briefcase className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No story points assigned yet. Add estimates to tasks!</p>
                        </div>
                    )}
                </div>

                {/* ── Sprint Burndown ───────────────────────────────── */}
                {sprints.length > 0 && (
                    <div className="glass-card border border-white/5 rounded-2xl p-6 bg-gray-900/40 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                            <h2 className="text-lg font-bold font-['Outfit'] flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" /> Sprint Burndown
                            </h2>
                            <select
                                value={selectedSprintId || ''}
                                onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                                className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                                {sprints.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                ))}
                            </select>
                        </div>
                        {burndownLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : burndown?.data?.length > 0 ? (
                            <>
                                <div className="flex items-center space-x-4 mb-4">
                                    <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/20">
                                        {burndown.total_points} total pts
                                    </span>
                                    <span className="text-xs text-gray-600">Ideal (dashed) vs Actual remaining (solid)</span>
                                </div>
                                <div className="w-full h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={burndown.data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="remainGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                            <XAxis dataKey="date" stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                                            <YAxis stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />}
                                                formatter={(value, name) => [value === null ? '—' : value, name === 'ideal' ? 'Ideal' : 'Remaining']} />
                                            <Legend formatter={(v) => <span className="text-gray-400 text-xs capitalize">{v === 'ideal' ? 'Ideal' : 'Remaining'}</span>} iconType="circle" iconSize={8} />
                                            <Line type="monotone" dataKey="ideal" name="ideal"
                                                stroke="#4b5563" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                                            <Area type="monotone" dataKey="remaining" name="remaining"
                                                stroke="#6366f1" strokeWidth={3}
                                                fill="url(#remainGrad)"
                                                dot={{ r: 3, fill: '#6366f1', stroke: '#0A0A0B', strokeWidth: 2 }}
                                                connectNulls={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                                {burndown?.error || 'Set start/end dates on the Sprints page to see the burndown chart.'}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
};

/* ── Shared empty state ─────────────────────────── */
const EmptyChart = () => (
    <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet.</div>
);

export default Analytics;
