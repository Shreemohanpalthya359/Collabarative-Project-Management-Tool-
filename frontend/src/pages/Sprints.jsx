import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Flag, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Sprints = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [sprintTasks, setSprintTasks] = useState({}); // sprintId -> {done, total}

    // New sprint form state
    const [showForm, setShowForm] = useState(false);
    const [newSprint, setNewSprint] = useState({ name: '', start_date: '', end_date: '', status: 'planned' });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projRes = await api.get('/projects');
                const currProj = projRes.data.find(p => p.id === parseInt(id));

                if (!currProj) {
                    setError('Project not found');
                    return;
                }

                setProject(currProj);

                const sprintsRes = await api.get(`/sprints/project/${id}`);
                const sprintsData = sprintsRes.data;
                setSprints(sprintsData);

                // Fetch task breakdowns for each sprint
                try {
                    const tasksRes = await api.get(`/tasks/project/${id}`);
                    const taskMap = {};
                    tasksRes.data.forEach(t => {
                        if (t.sprint_id) {
                            if (!taskMap[t.sprint_id]) taskMap[t.sprint_id] = { done: 0, total: 0 };
                            taskMap[t.sprint_id].total++;
                            if (t.status === 'done') taskMap[t.sprint_id].done++;
                        }
                    });
                    setSprintTasks(taskMap);
                } catch (_e) {/* ignore */ }
            } catch (err) {
                console.error("Failed to load sprints:", err);
                setError('Failed to load sprints');
            }
        };
        fetchData();
    }, [id]);

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        setError('');
        if (!newSprint.name.trim()) {
            setError('Sprint name is required');
            return;
        }

        try {
            const payload = { ...newSprint };
            if (!payload.start_date) delete payload.start_date;
            if (!payload.end_date) delete payload.end_date;

            await api.post(`/sprints/project/${id}`, payload);

            // Refresh
            const sprintsRes = await api.get(`/sprints/project/${id}`);
            setSprints(sprintsRes.data);

            setShowForm(false);
            setNewSprint({ name: '', start_date: '', end_date: '', status: 'planned' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create sprint');
        }
    };

    const handleDeleteSprint = async (sprintId) => {
        if (!window.confirm("Are you sure you want to delete this sprint? Tasks linked to it will lose their sprint association.")) return;

        try {
            await api.delete(`/sprints/${sprintId}`);
            setSprints(sprints.filter(s => s.id !== sprintId));
        } catch (err) {
            console.error("Failed to delete sprint", err);
        }
    };

    if (error === 'Project not found' || (!project && error)) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-['Inter']">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <Flag className="w-16 h-16 text-gray-600 mb-6" />
                    <h2 className="text-3xl font-bold text-red-500 mb-4">{error}</h2>
                    <p className="text-gray-400 mb-8 max-w-md text-center text-lg">The project you are looking for does not exist in the database or you do not have access to it.</p>
                    <button onClick={() => navigate('/')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-['Inter']">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-['Inter']">
            <Navbar />

            <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(`/project/${id}`)}
                            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
                                <Flag className="w-7 h-7 mr-3 text-pink-500" />
                                Iterations (Sprints)
                            </h1>
                            <p className="text-gray-400 mt-1">{project.name} &middot; Manage your project milestones</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card border border-white/5 shadow-2xl rounded-2xl p-8 mb-8 relative overflow-hidden bg-gray-900/50">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="text-xl font-bold font-['Outfit']">Project Sprints</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.open(`http://localhost:5001/api/ical/project/${id}?token=${token}`, '_blank');
                                }}
                                title="Download iCal (.ics) for tasks & sprints"
                                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg font-semibold border border-gray-700 transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export iCal</span>
                            </button>
                            {!showForm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-pink-500/20 transition-all font-['Outfit']"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create Sprint</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {showForm && (
                        <form onSubmit={handleCreateSprint} className="bg-gray-800/80 rounded-xl p-6 border border-white/10 mb-8 relative z-10 shadow-inner">
                            <h3 className="font-bold text-white mb-4">New Sprint Details</h3>
                            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Sprint Name</label>
                                    <input
                                        type="text"
                                        value={newSprint.name}
                                        onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                                        placeholder="e.g. Sprint 1 - MVP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                    <select
                                        value={newSprint.status}
                                        onChange={(e) => setNewSprint({ ...newSprint, status: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newSprint.start_date}
                                        onChange={(e) => setNewSprint({ ...newSprint, start_date: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newSprint.end_date}
                                        onChange={(e) => setNewSprint({ ...newSprint, end_date: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold shadow-md transition-colors">Save Sprint</button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4 relative z-10">
                        {sprints.length === 0 && !showForm ? (
                            <div className="text-center py-12 text-gray-500">
                                <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No sprints found. Create one to start organizing tasks!</p>
                            </div>
                        ) : (
                            sprints.map(sprint => (
                                <div key={sprint.id} className="bg-gray-800/60 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center hover:bg-gray-800/80 transition-colors group">
                                    <div className="mb-4 md:mb-0 flex-1">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-100">{sprint.name}</h3>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${sprint.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                sprint.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-gray-600/30 text-gray-400'
                                                }`}>
                                                {sprint.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-400 space-x-4 mb-3">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
                                                <span>
                                                    {sprint.start_date ? format(new Date(sprint.start_date), 'MMM d, yyyy') : 'No Start'}
                                                    {' - '}
                                                    {sprint.end_date ? format(new Date(sprint.end_date), 'MMM d, yyyy') : 'No End'}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full text-xs font-mono">{sprint.task_count} tasks</span>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        {sprintTasks[sprint.id] && sprintTasks[sprint.id].total > 0 ? (() => {
                                            const { done, total } = sprintTasks[sprint.id];
                                            const pct = Math.round((done / total) * 100);
                                            return (
                                                <div className="mt-1">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Progress</span>
                                                        <span className="text-emerald-400 font-bold">{done}/{total} done ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <p className="text-xs text-gray-600 mt-1">No tasks in this sprint yet.</p>
                                        )}
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => handleDeleteSprint(sprint.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete Sprint"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Sprints;
