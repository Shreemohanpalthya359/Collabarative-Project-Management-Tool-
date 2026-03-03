import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Tag, Plus, X } from 'lucide-react';

const LabelPicker = ({ taskId, projectId }) => {
    const [projectLabels, setProjectLabels] = useState([]);
    const [taskLabels, setTaskLabels] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6366f1');
    const [showCreate, setShowCreate] = useState(false);

    const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'];

    const fetchLabels = useCallback(async () => {
        try {
            const [projRes, taskRes] = await Promise.all([
                api.get(`/labels/project/${projectId}`),
                api.get(`/tasks/${taskId}`)
            ]);
            setProjectLabels(projRes.data);
            setTaskLabels(taskRes.data.labels || []);
        } catch (_e) { /* ignore */ }
    }, [taskId, projectId]);

    useEffect(() => { const t = setTimeout(fetchLabels, 0); return () => clearTimeout(t); }, [fetchLabels]);

    const isAssigned = (labelId) => taskLabels.some(l => l.id === labelId);

    const toggleLabel = async (label) => {
        try {
            if (isAssigned(label.id)) {
                await api.post(`/labels/task/${taskId}/remove`, { label_id: label.id });
                setTaskLabels(prev => prev.filter(l => l.id !== label.id));
            } else {
                await api.post(`/labels/task/${taskId}/assign`, { label_id: label.id });
                setTaskLabels(prev => [...prev, label]);
            }
        } catch (_e) { /* ignore */ }
    };

    const createLabel = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const res = await api.post(`/labels/project/${projectId}`, { name: newName.trim(), color: newColor });
            setProjectLabels(prev => [...prev, res.data]);
            setNewName('');
            setShowCreate(false);
        } catch (_e) { /* ignore */ }
    };

    const deleteLabel = async (labelId) => {
        try {
            await api.delete(`/labels/${labelId}`);
            setProjectLabels(prev => prev.filter(l => l.id !== labelId));
            setTaskLabels(prev => prev.filter(l => l.id !== labelId));
        } catch (_e) { /* ignore */ }
    };

    return (
        <div>
            {/* Current labels on task */}
            <div className="flex flex-wrap gap-1.5 mb-2">
                {taskLabels.map(l => (
                    <span key={l.id} className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: l.color + '33', border: `1px solid ${l.color}66`, color: l.color }}>
                        <span>{l.name}</span>
                        <button onClick={() => toggleLabel(l)} className="hover:opacity-70">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                ))}
                <button onClick={() => setShowPicker(v => !v)}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 border border-gray-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                    <Tag className="w-3 h-3" /><span>Labels</span>
                </button>
            </div>

            {showPicker && (
                <div className="bg-gray-900 border border-white/10 rounded-xl p-3 shadow-2xl">
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar mb-2">
                        {projectLabels.length === 0 && <p className="text-xs text-gray-600">No labels yet.</p>}
                        {projectLabels.map(l => (
                            <div key={l.id} className="flex items-center justify-between group">
                                <button onClick={() => toggleLabel(l)}
                                    className={`flex items-center space-x-2 flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isAssigned(l.id) ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                    <span className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20" style={{ backgroundColor: l.color }}></span>
                                    <span className="text-gray-200">{l.name}</span>
                                    {isAssigned(l.id) && <span className="text-[10px] text-indigo-400 ml-auto">✓</span>}
                                </button>
                                <button onClick={() => deleteLabel(l.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {showCreate ? (
                        <form onSubmit={createLabel} className="border-t border-white/5 pt-2">
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 mb-2" />
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {PRESET_COLORS.map(c => (
                                    <button key={c} type="button" onClick={() => setNewColor(c)}
                                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/50' : ''}`}
                                        style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-colors">Create</button>
                                <button type="button" onClick={() => setShowCreate(false)} className="px-2 py-1 text-gray-500 hover:text-white text-xs transition-colors">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowCreate(true)}
                            className="w-full flex items-center justify-center space-x-1 border-t border-white/5 pt-2 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                            <Plus className="w-3 h-3" /><span>Create label</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default LabelPicker;
