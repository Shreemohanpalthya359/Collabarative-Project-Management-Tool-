import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, AlertTriangle, Folder, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import api from '../services/api';
import Navbar from '../components/Navbar';

const RecycleBin = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmId, setConfirmId] = useState(null); // permanent delete confirmation
    const [msg, setMsg] = useState('');

    const fetchTrash = async () => {
        try {
            const res = await api.get('/projects/trash');
            setProjects(res.data);
        } catch (_e) { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTrash(); }, []);

    const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

    const restore = async (id) => {
        try {
            await api.post(`/projects/${id}/restore`);
            setProjects(prev => prev.filter(p => p.id !== id));
            flash('✅ Project restored to dashboard!');
        } catch (_e) { flash('❌ Failed to restore project.'); }
    };

    const permanentDelete = async (id) => {
        try {
            await api.delete(`/projects/${id}/permanent`);
            setProjects(prev => prev.filter(p => p.id !== id));
            setConfirmId(null);
            flash('🗑️ Project permanently deleted.');
        } catch (_e) { flash('❌ Failed to permanently delete.'); }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <Navbar />

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-red-600/4 rounded-full blur-[140px]" />
            </div>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold font-['Outfit']">Recycle Bin</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Restore deleted projects or remove them permanently</p>
                        </div>
                    </div>
                    <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Flash message */}
                <AnimatePresence>
                    {msg && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-6 px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-sm text-gray-200 flex items-center justify-between">
                            <span>{msg}</span>
                            <button onClick={() => setMsg('')}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info banner */}
                <div className="flex items-start space-x-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-8">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200/80">
                        Projects in the bin are hidden from your dashboard but all their tasks, sprints, and comments are preserved.
                        Restore a project to get it back, or permanently delete it to free up space.
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading…</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-3xl border border-white/5">
                        <Trash2 className="w-14 h-14 mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 font-['Outfit']">Recycle bin is empty</h3>
                        <p className="text-gray-600 text-sm mt-2">Deleted projects will appear here.</p>
                        <Link to="/" className="inline-block mt-6 text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                            ← Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map(project => (
                            <motion.div key={project.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div className="p-2.5 bg-gray-800 rounded-xl border border-white/5 flex-shrink-0">
                                        <Folder className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-base font-['Outfit'] truncate">{project.name}</h3>
                                        <p className="text-gray-500 text-sm truncate">{project.description || 'No description'}</p>
                                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-600">
                                            <Clock className="w-3 h-3" />
                                            <span>Deleted {formatDistanceToNow(new Date(project.deleted_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => restore(project.id)}
                                        className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95">
                                        <RotateCcw className="w-4 h-4" /><span>Restore</span>
                                    </button>
                                    {confirmId === project.id ? (
                                        <div className="flex items-center space-x-1.5">
                                            <span className="text-xs text-red-400 font-semibold">Sure?</span>
                                            <button onClick={() => permanentDelete(project.id)}
                                                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors">Yes</button>
                                            <button onClick={() => setConfirmId(null)}
                                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs font-medium transition-colors">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmId(project.id)}
                                            className="flex items-center space-x-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95">
                                            <Trash2 className="w-4 h-4" /><span>Delete Forever</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RecycleBin;
