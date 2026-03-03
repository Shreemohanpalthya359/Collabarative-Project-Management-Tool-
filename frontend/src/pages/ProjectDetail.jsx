import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Github, Clock, Plus, AlertCircle, GripHorizontal, DownloadCloud, Users, Activity, X, Flag, Search, Filter, Download } from 'lucide-react';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TaskDetailModal from '../components/TaskDetailModal';
import PullRequestsWidget from '../components/PullRequestsWidget';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts.jsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = {
    todo: { name: 'To Do', border: 'border-blue-500/30', bg: 'bg-blue-500/5', header: 'from-blue-500/10 to-transparent', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    in_progress: { name: 'In Progress', border: 'border-amber-500/30', bg: 'bg-amber-500/5', header: 'from-amber-500/10 to-transparent', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    done: { name: 'Done', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', header: 'from-emerald-500/10 to-transparent', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' }
};

const PRIORITIES = {
    low: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Low ' },
    medium: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Medium' },
    high: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'High' }
};

const DueDateBadge = ({ dueDate, status }) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const overdue = isPast(date) && !isToday(date) && status !== 'done';
    const dueToday = isToday(date) && status !== 'done';
    if (overdue) {
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                <span>⚠</span> Overdue · {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
        );
    }
    if (dueToday) {
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span>🕐</span> Due Today
            </span>
        );
    }
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
    );
};

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [allTasks, setAllTasks] = useState([]);
    const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [project, setProject] = useState(null);
    const [importingIssues, setImportingIssues] = useState(false);

    // Modal & Sidebar State
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [activities, setActivities] = useState([]);

    const getCleanRepo = (repo) => {
        if (!repo) return '';
        let clean = repo.replace('https://github.com/', '').replace('http://github.com/', '');
        if (clean.endsWith('.git')) clean = clean.slice(0, -4);
        return clean;
    };

    // New task form state
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');

    const fetchData = useCallback(async () => {
        try {
            const projRes = await api.get('/projects');
            const currentProject = projRes.data.find(p => p.id === parseInt(id));
            setProject(currentProject);

            if (!currentProject) {
                setError('Project not found');
                setLoading(false);
                return;
            }

            const tasksRes = await api.get(`/tasks/project/${id}`);

            setAllTasks(tasksRes.data);

            // Fetch activities
            try {
                const actRes = await api.get(`/analytics/project/${id}/activities`);
                setActivities(actRes.data);
            } catch (_err) {
                console.error("Could not fetch activities", _err);
            }

            if (currentProject.github_repo) {
                try {
                    const commitsRes = await api.get(`/github/commits/${currentProject.github_repo}`);
                    setCommits(commitsRes.data);
                } catch (commitErr) {
                    console.error("Failed to fetch commits:", commitErr);
                }
            }
        } catch (_err) {
            setError('Failed to load project data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [id, fetchData]);

    useEffect(() => {
        // Apply filters
        const filtered = allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
            return matchesSearch && matchesPriority;
        });

        // Group tasks
        const grouped = { todo: [], in_progress: [], done: [] };
        filtered.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            } else {
                grouped.todo.push(task);
            }
        });
        setTasks(grouped);
    }, [allTasks, searchQuery, filterPriority]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            await api.post(`/tasks/project/${id}`, {
                title: newTaskTitle,
                status: 'todo',
                priority: newTaskPriority
            });
            setNewTaskTitle('');
            setNewTaskPriority('medium');
            fetchData();
        } catch (_err) {
            console.error('Failed to create task');
        }
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Estimate (pts)'];
        const rows = allTasks.map(t => [
            t.id,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            t.status,
            t.priority,
            t.assignee_username || 'Unassigned',
            t.due_date ? t.due_date.substring(0, 10) : '',
            t.estimate ?? ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'tasks'}-export.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistically update UI
        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;

        const newAllTasks = allTasks.map(t => {
            if (t.id.toString() === draggableId) {
                return { ...t, status: destCol };
            }
            return t;
        });

        setAllTasks(newAllTasks);

        // Persist to backend
        if (sourceCol !== destCol) {
            try {
                await api.put(`/tasks/${draggableId}`, { status: destCol });
            } catch (error) {
                console.error('Failed to update task status:', error);
                fetchData(); // Revert on failure
            }
        }
    };

    const updateTaskPriority = async (taskId, currentPriority) => {
        const nextPriority = currentPriority === 'low' ? 'medium' : currentPriority === 'medium' ? 'high' : 'low';
        try {
            // Optimistic update
            const newAllTasks = allTasks.map(t =>
                t.id === taskId ? { ...t, priority: nextPriority } : t
            );
            setAllTasks(newAllTasks);

            await api.put(`/tasks/${taskId}`, { priority: nextPriority });
        } catch (error) {
            console.error('Failed to update priority', error);
            fetchData();
        }
    };

    const updateTaskStatus = async (taskId, currentStatus, newStatus) => {
        if (currentStatus === newStatus) return;

        try {
            // Optimistic update
            const newAllTasks = allTasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setAllTasks(newAllTasks);

            await api.put(`/tasks/${taskId}`, { status: newStatus });
        } catch (error) {
            console.error('Failed to update status', error);
            fetchData();
        }
    };

    const handleImportIssues = async () => {
        if (!project || !project.github_repo) return;
        setImportingIssues(true);
        try {
            await api.post(`/github/import_issues/${project.id}`);
            fetchData(); // Refresh board to show new tasks
        } catch (error) {
            console.error('Failed to import issues', error);
        } finally {
            setImportingIssues(false);
        }
    };

    // Keyboard shortcuts
    const { ShortcutsOverlay } = useKeyboardShortcuts({
        onNewTask: () => document.querySelector('input[placeholder="Add a task..."]')?.focus(),
        onSearch: () => document.getElementById('kanban-search')?.focus(),
        onDashboard: () => navigate('/'),
        onAnalytics: () => navigate(`/project/${id}/analytics`)
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="flex justify-center items-center h-full pt-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="text-center py-20 text-red-500">{error || 'Project not found'}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <ShortcutsOverlay />
            <Navbar />

            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-73px)]">
                <header className="mb-8 border-b border-white/10 pb-6 flex-shrink-0 relative overflow-hidden rounded-2xl glass-card p-6">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white mb-2 font-['Outfit'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{project.name}</h1>
                            <p className="text-gray-400 text-lg max-w-3xl">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate(`/project/${id}/analytics`)}
                                className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg font-semibold border border-emerald-500/20 transition-colors"
                            >
                                <AlertCircle className="h-5 w-5" />
                                <span>Analytics</span>
                            </button>
                            <button
                                onClick={() => setShowActivityLog(true)}
                                className="flex items-center space-x-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg font-semibold border border-purple-500/20 transition-colors"
                            >
                                <Activity className="h-5 w-5" />
                                <span>Activity</span>
                            </button>
                            <button
                                onClick={() => navigate(`/project/${id}/sprints`)}
                                className="flex items-center space-x-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-4 py-2 rounded-lg font-semibold border border-pink-500/20 transition-colors"
                            >
                                <Flag className="h-5 w-5" />
                                <span>Sprints</span>
                            </button>
                            <button
                                onClick={() => navigate(`/project/${id}/team`)}
                                className="flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg font-semibold border border-indigo-500/20 transition-colors"
                            >
                                <Users className="h-5 w-5" />
                                <span>Team</span>
                            </button>
                            {project.github_repo && (
                                <button
                                    onClick={handleImportIssues}
                                    disabled={importingIssues}
                                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold border border-gray-600 transition-colors disabled:opacity-50"
                                >
                                    <DownloadCloud className={`h-5 w-5 ${importingIssues ? 'animate-bounce' : ''}`} />
                                    <span>{importingIssues ? 'Syncing...' : 'Sync GitHub Issues'}</span>
                                </button>
                            )}
                            {/* CSV Export */}
                            <button
                                onClick={handleExportCSV}
                                title="Export tasks to CSV"
                                className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg font-semibold border border-emerald-500/20 transition-colors"
                            >
                                <Download className="h-5 w-5" />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-0">

                    {/* Kanban Board - Takes up 3 columns on large screens */}
                    <div className="xl:col-span-3 flex flex-col min-h-0 bg-gray-800/50 p-4 rounded-xl border border-gray-700">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <form onSubmit={handleCreateTask} className="flex-1 flex space-x-3 flex-shrink-0 glass-card p-3 rounded-xl border border-white/5 shadow-lg">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-500"
                                />
                                <div className="relative">
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value)}
                                        className="h-full bg-gray-900/50 border border-gray-700/50 text-white font-semibold rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-gray-800/80 transition-colors"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-lg font-bold transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center space-x-2"
                                >
                                    <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Add</span>
                                </button>
                            </form>

                            <div className="flex space-x-3 items-center class-card p-3 rounded-xl border border-white/5 bg-gray-800/40">
                                <div className="relative flex-1 sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <select
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value)}
                                        className="pl-10 pr-8 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Priorities</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex-1 overflow-x-auto flex space-x-6 min-h-0 pb-4 custom-scrollbar">
                                {Object.entries(COLUMNS).map(([columnId, config]) => (
                                    <div key={columnId} className={`flex flex-col flex-1 min-w-[320px] max-w-sm glass-card rounded-2xl border ${config.border} overflow-hidden shadow-xl`}>
                                        <div className={`p-5 border-b ${config.border} bg-gradient-to-b ${config.header} flex justify-between items-center backdrop-blur-md`}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                                                    <div className={`w-3 h-3 rounded-full ${config.iconColor} bg-current blur-[2px]`}></div>
                                                </div>
                                                <h3 className="font-bold text-white text-lg font-['Outfit'] tracking-wide">{config.name}</h3>
                                            </div>
                                            <span className="bg-black/40 text-gray-300 text-sm font-bold px-3 py-1 rounded-full border border-white/10 shadow-inner">
                                                {tasks[columnId]?.length || 0}
                                            </span>
                                        </div>

                                        <Droppable droppableId={columnId}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 overflow-y-auto p-4 transition-all duration-300 custom-scrollbar ${snapshot.isDraggingOver ? config.bg + ' shadow-inner scale-[0.99] rounded-b-2xl' : 'bg-transparent flex flex-col'}`}
                                                >
                                                    {(!tasks[columnId] || tasks[columnId].length === 0) && !snapshot.isDraggingOver && (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500/50 italic p-6 text-center border-2 border-dashed border-gray-700/30 rounded-xl my-4">
                                                            <Activity className="w-8 h-8 mb-2 opacity-20" />
                                                            <p className="text-sm">Drop tasks here</p>
                                                        </div>
                                                    )}
                                                    {tasks[columnId]?.map((task, index) => (
                                                        <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`mb-4 bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 border transition-all duration-200 group relative overflow-hidden cursor-pointer ${snapshot.isDragging
                                                                        ? 'border-indigo-500 shadow-[0_10px_30px_#6366f14d] rotate-3 scale-105 z-50'
                                                                        : task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done'
                                                                            ? 'border-red-500/40 hover:border-red-400/60 shadow-[0_0_12px_#ef444420] hover:shadow-lg'
                                                                            : 'border-white/10 hover:border-gray-500/50 hover:shadow-lg shadow-md'
                                                                        }`}
                                                                    onClick={() => setSelectedTaskId(task.id)}
                                                                >
                                                                    {snapshot.isDragging && <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 z-0 pointer-events-none"></div>}
                                                                    <div className="flex flex-col mb-4 relative z-10 pointer-events-none">
                                                                        <div className="flex justify-between items-start">
                                                                            <p className={`text-base font-medium leading-relaxed pr-6 ${columnId === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                                                                                {task.title}
                                                                            </p>
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className="absolute top-0 right-0 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-2 -mt-2 -mr-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-700/50 pointer-events-auto"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <GripHorizontal className="h-5 w-5" />
                                                                            </div>
                                                                        </div>

                                                                        {/* Labels on Card */}
                                                                        {task.labels && task.labels.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {task.labels.map(label => (
                                                                                    <span key={label.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}40` }}>
                                                                                        {label.name}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Due Date badge */}
                                                                        {task.due_date && (
                                                                            <div className="mt-2 flex">
                                                                                <DueDateBadge dueDate={task.due_date} status={task.status} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 relative z-10" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex items-center space-x-2">
                                                                            <button
                                                                                title="Click to toggle priority"
                                                                                onClick={() => updateTaskPriority(task.id, task.priority || 'medium')}
                                                                                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border cursor-pointer transition-all ${PRIORITIES[task.priority || 'medium'].color} hover:shadow-lg transform hover:-translate-y-0.5`}
                                                                            >
                                                                                {PRIORITIES[task.priority || 'medium'].label}
                                                                            </button>

                                                                            {task.assignee_username && (
                                                                                <div
                                                                                    title={`Assigned to ${task.assignee_username}`}
                                                                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold shadow-md text-white border border-white/10"
                                                                                >
                                                                                    {task.assignee_username.charAt(0).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center space-x-2 ml-auto">
                                                                            {columnId === 'todo' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'todo', 'in_progress')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">Start</button>
                                                                            )}
                                                                            {columnId === 'in_progress' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'in_progress', 'done')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">Finish</button>
                                                                            )}
                                                                            {columnId === 'done' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'done', 'todo')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-gray-500/30 text-gray-400 bg-gray-500/10 hover:bg-gray-500/20 transition-colors">Reopen</button>
                                                                            )}
                                                                            <span className="text-sm font-mono text-gray-500 bg-black/20 px-2 py-1 rounded flex-shrink-0">#{task.id}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                ))}
                            </div>
                        </DragDropContext>
                    </div>

                    {/* Sidebar - GitHub Integration */}
                    <div className="xl:col-span-1 space-y-6 flex flex-col min-h-0">
                        <div className="glass-card rounded-2xl border border-white/10 shadow-2xl flex flex-col min-h-0 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="p-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 relative z-10 bg-black/20 backdrop-blur-sm">
                                <h2 className="text-lg font-bold text-white flex items-center space-x-2 font-['Outfit']">
                                    <div className="w-8 h-8 rounded-lg bg-gray-800/80 border border-white/10 flex items-center justify-center">
                                        <Github className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <span>Recent Commits</span>
                                </h2>
                                {project.github_repo && (
                                    <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg shadow-inner truncate max-w-[120px]">
                                        {getCleanRepo(project.github_repo).split('/')[1] || getCleanRepo(project.github_repo)}
                                    </span>
                                )}
                            </div>

                            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar relative z-10">
                                {!project.github_repo ? (
                                    <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                        <AlertCircle className="h-12 w-12 mb-4 text-gray-600/50" />
                                        <p className="text-lg font-medium mb-2">No Repository Linked</p>
                                        <span className="text-sm">Link a GitHub repo to see live commit history here.</span>
                                    </div>
                                ) : commits.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full mb-4"></div>
                                            <p>Loading commits or repo is private...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-white/5 p-2">
                                        {commits.map(commit => (
                                            <li key={commit.sha} className="p-4 hover:bg-white/5 rounded-xl transition-all duration-200 group mb-1 border border-transparent hover:border-white/5">
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium text-gray-300 line-clamp-2 mb-3 group-hover:text-white transition-colors leading-snug" title={commit.message}>
                                                        {commit.message}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center text-gray-500">
                                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center mr-2 shadow-inner">
                                                                <span className="text-[10px] font-bold text-white">{commit.author.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <span className="font-semibold text-gray-400 truncate max-w-[90px]">{commit.author}</span>
                                                            <span className="mx-2 text-gray-700">•</span>
                                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                                            <span>{new Date(commit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                        <a
                                                            href={`https://github.com/${getCleanRepo(project.github_repo)}/commit/${commit.sha}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-mono font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 px-2 py-1 rounded-md transition-all border border-indigo-500/20 group-hover:shadow-[0_0_10px_#6366f133]"
                                                        >
                                                            {commit.sha.substring(0, 7)}
                                                        </a>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Pull Requests Widget */}
                        {project.github_repo && (
                            <PullRequestsWidget repoUrl={getCleanRepo(project.github_repo)} />
                        )}
                    </div>

                </div >
            </main >

            {/* Activity Log Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${showActivityLog ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gray-900/80 backdrop-blur-sm relative">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-purple-400" /> Activity Log
                    </h2>
                    <button onClick={() => setShowActivityLog(false)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-gray-500 italic text-center text-sm py-4">No activity recorded yet.</p>
                    ) : (
                        activities.map(act => (
                            <div key={act.id} className="relative pl-6 pb-4 border-l border-indigo-500/30 last:border-0 last:pb-0">
                                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-white/5 shadow-sm">
                                    <p className="text-sm text-gray-200 mb-1">{act.description}</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-indigo-400">{act.user.username}</span>
                                        <span className="text-gray-500">{formatDistanceToNow(new Date(act.created_at))} ago</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Overlay for Sidebar */}
            {showActivityLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowActivityLog(false)}></div>
            )}

            {/* Task Detail Modal */}
            {
                selectedTaskId && (
                    <TaskDetailModal
                        taskId={selectedTaskId}
                        onClose={() => setSelectedTaskId(null)}
                        onUpdate={fetchData}
                    />
                )
            }
        </div >
    );
};

export default ProjectDetail;
