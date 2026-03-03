import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Github, Folder, AlertCircle, TrashIcon, Search, Sparkles, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import api from '../services/api';
import Navbar from '../components/Navbar';
import { fadeUp, staggerContainer, scaleIn } from '../animations';

/* ---------- tiny floating particle ---------- */
const Particle = ({ style }) => (
    <motion.div
        className="particle bg-indigo-500/20"
        style={{ width: 4, height: 4, ...style }}
        animate={{ y: [0, -80, 0], opacity: [0, 0.6, 0], scale: [1, 1.4, 0.6] }}
        transition={{ duration: style.duration, delay: style.delay, repeat: Infinity, ease: 'easeInOut' }}
    />
);

/* ---------- animated counter ---------- */
/* ── Project Duration live counter ─── */
const useDuration = (createdAt) => {
    const calc = () => {
        if (!createdAt) return '';
        const diff = Date.now() - new Date(createdAt).getTime();
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };
    const [dur, setDur] = useState(calc);
    useEffect(() => {
        const t = setInterval(() => setDur(calc()), 60000);
        return () => clearInterval(t);
    });
    return dur;
};


/* ── ProjectDuration badge ─── */
const ProjectDuration = ({ createdAt }) => {
    const dur = useDuration(createdAt);
    if (!dur) return null;
    return (
        <span className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
            <Clock className="w-3 h-3" />
            <span>{dur}</span>
        </span>
    );
};

/* ── Animated number ─── */
const AnimatedNumber = ({ value }) => (
    <motion.span
        key={value}
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
        {value}
    </motion.span>
);

/* ---------- loading skeleton ---------- */
const CardSkeleton = ({ i }) => (
    <motion.div
        key={i}
        variants={fadeUp}
        className="glass-card rounded-2xl h-56 border border-white/5 overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%)', backgroundSize: '400% 100%' }}
    >
        <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
    </motion.div>
);

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectRepo, setNewProjectRepo] = useState('');

    const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
        left: `${(i * 8.5) % 100}%`, bottom: 0,
        duration: 6 + (i % 4) * 2.5,
        delay: i * 0.7,
    }));

    const getCleanRepo = (repo) => {
        if (!repo) return '';
        let clean = repo.replace('https://github.com/', '').replace('http://github.com/', '');
        if (clean.endsWith('.git')) clean = clean.slice(0, -4);
        return clean;
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const projectsData = res.data;
            // Show projects immediately, no waiting for GitHub stats
            setProjects(projectsData.map(p => ({ ...p, githubStats: { issues: 0, prs: 0 } })));
            setLoading(false);
            // Fetch GitHub stats in background and update
            projectsData.forEach(async (project) => {
                if (project.github_repo) {
                    try {
                        const issuesRes = await api.get(`/github/issues/${project.github_repo}`);
                        const stats = {
                            issues: issuesRes.data.issues?.length || 0,
                            prs: issuesRes.data.pull_requests?.length || 0,
                        };
                        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, githubStats: stats } : p));
                    } catch (_e) { /* silent */ }
                }
            });
        } catch (_err) {
            setError('Failed to fetch projects');
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => { if (mounted) await fetchProjects(); };
        load();
        return () => { mounted = false; };
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const payload = { name: newProjectName, description: newProjectDesc };
            if (newProjectRepo.trim()) payload.github_repo = newProjectRepo.trim();
            await api.post('/projects', payload);
            setShowModal(false);
            setNewProjectName(''); setNewProjectDesc(''); setNewProjectRepo('');
            fetchProjects();
        } catch (_err) {
            setError('Failed to create project');
        }
    };

    const handleDeleteProject = async (e, projectId) => {
        e.preventDefault(); e.stopPropagation();
        if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (_err) {
            setError('Failed to delete project. Only the owner can delete.');
        }
    };

    const filteredProjects = projects.filter(p =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const STATS = [
        { label: 'Total Projects', value: projects.length, color: 'blue', glow: '#3b82f620' },
        { label: 'Active Repos', value: projects.filter(p => p.github_repo).length, color: 'indigo', glow: '#6366f120' },
        { label: 'Open Issues', value: projects.reduce((a, p) => a + (p.githubStats?.issues || 0), 0), color: 'amber', glow: '#f59e0b20' },
        { label: 'Pull Requests', value: projects.reduce((a, p) => a + (p.githubStats?.prs || 0), 0), color: 'emerald', glow: '#10b98120' },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
            <Navbar />

            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-3/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-0 w-full h-64 overflow-hidden">
                    {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}
                </div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
                    variants={fadeUp} initial="hidden" animate="show">
                    <div>
                        <h1 className="text-4xl font-extrabold font-['Outfit'] gradient-text mb-1">
                            Your Projects
                        </h1>
                        <p className="text-gray-500 text-sm">Manage workspaces, track issues, ship features.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text" placeholder="Search projects..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-900/80 border border-gray-700/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-600 transition-all"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowModal(true)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg whitespace-nowrap"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">New Project</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stat cards */}
                {!loading && projects.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                        {STATS.map((s, i) => (
                            <div key={i}
                                className="glass-card p-6 rounded-2xl border border-gray-700/50 relative overflow-hidden cursor-default">
                                <motion.div
                                    className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl"
                                    style={{ backgroundColor: s.glow }}
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                                    transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{s.label}</p>
                                <p className="text-4xl font-extrabold font-['Outfit']">
                                    <AnimatedNumber value={s.value} />
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div variants={scaleIn} initial="hidden" animate="show" exit="exit"
                            className="flex items-center space-x-2 bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl mb-6">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading skeletons */}
                {loading ? (
                    <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={staggerContainer(0.1)} initial="hidden" animate="show">
                        {[1, 2, 3].map(i => <CardSkeleton key={i} i={i} />)}
                    </motion.div>

                ) : filteredProjects.length === 0 ? (
                    <motion.div variants={scaleIn} initial="hidden" animate="show"
                        className="text-center py-28 glass-card rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5 pointer-events-none"
                        >
                            <div className="w-full h-full border-4 border-dashed border-indigo-500 rounded-full" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                            <Folder className="h-20 w-20 mx-auto text-indigo-400/50 mb-6 drop-shadow-[0_0_15px_#6366f14d]" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3 font-['Outfit']">
                            {searchQuery ? 'No matching projects' : 'No projects yet'}
                        </h3>
                        <p className="text-gray-400 max-w-sm mx-auto text-base mb-8">
                            {searchQuery ? `No projects found for "${searchQuery}"` : 'Create a workspace to start tracking tasks and commits.'}
                        </p>
                        {!searchQuery && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-7 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25">
                                <Sparkles className="h-5 w-5" /><span>Create First Project</span>
                            </motion.button>
                        )}
                    </motion.div>

                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <motion.div key={project.id} variants={fadeUp}
                                whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(99,102,241,0.2)' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                                <Link to={`/project/${project.id}`} className="block group h-full">
                                    <div className="glass-card rounded-2xl p-6 border border-white/5 h-full flex flex-col relative overflow-hidden transition-colors duration-300 group-hover:border-indigo-500/30">

                                        {/* Glow on hover */}
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
                                            style={{ background: 'radial-gradient(circle at 70% 20%, rgba(99,102,241,0.08), transparent 70%)' }}
                                            whileHover={{ opacity: 1 }}
                                        />

                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 font-['Outfit']">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center space-x-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                                    onClick={e => handleDeleteProject(e, project.id)}
                                                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                                    <TrashIcon className="h-4 w-4" />
                                                </motion.button>
                                                <div className="p-2 bg-gray-800/60 rounded-lg">
                                                    <Folder className="h-5 w-5 text-indigo-400/70 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed relative z-10">
                                            {project.description || 'No description provided.'}
                                        </p>

                                        {/* Duration / GitHub footer */}
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                                            <ProjectDuration createdAt={project.created_at} />
                                            {project.github_repo && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-400 truncate max-w-[55%]">
                                                    <Github className="h-4 w-4 flex-shrink-0 text-white" />
                                                    <span className="truncate font-medium text-xs">{getCleanRepo(project.github_repo)}</span>
                                                </div>
                                            )}
                                            {(project.githubStats?.issues > 0 || project.githubStats?.prs > 0) && (
                                                <div className="flex items-center space-x-2 text-xs bg-gray-900/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                    {project.githubStats?.issues > 0 && <span className="text-amber-400 font-bold">{project.githubStats.issues} Issues</span>}
                                                    {project.githubStats?.prs > 0 && <span className="text-emerald-400 font-bold pl-2 border-l border-gray-700">{project.githubStats.prs} PRs</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div
                            className="glass-card rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden"
                            variants={scaleIn} initial="hidden" animate="show" exit="exit">
                            <div className="p-8">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                        <Zap className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold font-['Outfit']">Create Project</h2>
                                </div>
                                <p className="text-gray-400 mb-8 ml-1">Define your new workspace.</p>

                                <form onSubmit={handleCreateProject} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Project Name</label>
                                        <input type="text" required value={newProjectName}
                                            onChange={e => setNewProjectName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
                                            placeholder="E.g., Quantum Algorithm Redesign" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                                        <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600 resize-none"
                                            placeholder="Outline the goals and scope…" rows={3} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                                            <Github className="w-4 h-4" /><span>GitHub Repo <span className="text-gray-500 font-normal">(Optional)</span></span>
                                        </label>
                                        <div className="flex rounded-xl overflow-hidden border border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-gray-900/50 transition-all">
                                            <span className="inline-flex items-center px-4 bg-gray-800/50 text-gray-500 text-sm border-r border-gray-700 font-medium">github.com/</span>
                                            <input type="text" value={newProjectRepo} onChange={e => setNewProjectRepo(e.target.value)}
                                                className="flex-1 px-4 py-3 bg-transparent text-white border-0 outline-none placeholder-gray-600"
                                                placeholder="owner/repo" />
                                        </div>
                                    </div>
                                    <div className="flex space-x-4 pt-4">
                                        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold border border-gray-700 transition-colors">
                                            Cancel
                                        </motion.button>
                                        <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.97 }}
                                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg">
                                            Create Workspace
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
