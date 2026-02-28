import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Github, Clock, Plus, AlertCircle, GripHorizontal } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
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

const ProjectDetail = () => {
    const { id } = useParams();
    const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [project, setProject] = useState(null);

    // New task form state
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    const fetchData = async () => {
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

            // Group tasks by status
            const grouped = { todo: [], in_progress: [], done: [] };
            tasksRes.data.forEach(task => {
                if (grouped[task.status]) {
                    grouped[task.status].push(task);
                } else {
                    grouped.todo.push(task); // Fallback
                }
            });

            setTasks(grouped);

            if (currentProject.github_repo) {
                try {
                    const commitsRes = await api.get(`/github/commits/${currentProject.github_repo}`);
                    setCommits(commitsRes.data);
                } catch (commitErr) {
                    console.error("Failed to fetch commits:", commitErr);
                }
            }
        } catch (err) {
            setError('Failed to load project data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

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
        } catch (err) {
            console.error('Failed to create task');
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistically update UI
        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;

        const startTasks = Array.from(tasks[sourceCol]);
        const endTasks = sourceCol === destCol ? startTasks : Array.from(tasks[destCol]);

        const [movedTask] = startTasks.splice(source.index, 1);

        // Update task status visually
        movedTask.status = destCol;
        endTasks.splice(destination.index, 0, movedTask);

        const newTasks = {
            ...tasks,
            [sourceCol]: startTasks,
            ...(sourceCol !== destCol ? { [destCol]: endTasks } : {})
        };

        setTasks(newTasks);

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
            const newTasks = { ...tasks };
            for (const col in newTasks) {
                const taskIdx = newTasks[col].findIndex(t => t.id === taskId);
                if (taskIdx > -1) {
                    newTasks[col][taskIdx] = { ...newTasks[col][taskIdx], priority: nextPriority };
                    break;
                }
            }
            setTasks(newTasks);

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
            const newTasks = { ...tasks };
            const taskIdx = newTasks[currentStatus].findIndex(t => t.id === taskId);

            if (taskIdx > -1) {
                const [task] = newTasks[currentStatus].splice(taskIdx, 1);
                task.status = newStatus;
                newTasks[newStatus].push(task);
                setTasks(newTasks);
            }

            await api.put(`/tasks/${taskId}`, { status: newStatus });
        } catch (error) {
            console.error('Failed to update status', error);
            fetchData();
        }
    };

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
            <Navbar />

            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-73px)]">
                <header className="mb-8 border-b border-white/10 pb-6 flex-shrink-0 relative overflow-hidden rounded-2xl glass-card p-6">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-extrabold text-white mb-2 font-['Outfit'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{project.name}</h1>
                        <p className="text-gray-400 text-lg max-w-3xl">{project.description}</p>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-0">

                    {/* Kanban Board - Takes up 3 columns on large screens */}
                    <div className="xl:col-span-3 flex flex-col min-h-0 bg-gray-800/50 p-4 rounded-xl border border-gray-700">

                        <form onSubmit={handleCreateTask} className="flex space-x-3 mb-8 flex-shrink-0 glass-card p-4 rounded-xl border border-white/5 shadow-lg">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="flex-1 px-5 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-500"
                            />
                            <div className="relative">
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value)}
                                    className="h-full bg-gray-900/50 border border-gray-700/50 text-white font-semibold rounded-lg px-5 py-3 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-gray-800/80 transition-colors"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/25 flex items-center space-x-2"
                            >
                                <Plus className="h-5 w-5" /> <span>Add Task</span>
                            </button>
                        </form>

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
                                                    className={`flex-1 overflow-y-auto p-4 transition-all duration-300 custom-scrollbar ${snapshot.isDraggingOver ? config.bg + ' shadow-inner scale-[0.99] rounded-b-2xl' : 'bg-transparent'}`}
                                                >
                                                    {tasks[columnId]?.map((task, index) => (
                                                        <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`mb-4 bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 border transition-all duration-200 group relative overflow-hidden ${snapshot.isDragging
                                                                        ? 'border-indigo-500 shadow-[0_10px_30px_#6366f14d] rotate-3 scale-105 z-50'
                                                                        : 'border-white/10 hover:border-gray-500/50 hover:shadow-lg shadow-md'
                                                                        }`}
                                                                >
                                                                    {snapshot.isDragging && <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 z-0"></div>}
                                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                                        <p className={`text-base font-medium leading-relaxed pr-6 ${columnId === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                                                                            {task.title}
                                                                        </p>
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="absolute top-0 right-0 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-2 -mt-2 -mr-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-700/50"
                                                                        >
                                                                            <GripHorizontal className="h-5 w-5" />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 relative z-10">
                                                                        <div className="flex items-center space-x-2">
                                                                            <button
                                                                                title="Click to toggle priority"
                                                                                onClick={() => updateTaskPriority(task.id, task.priority || 'medium')}
                                                                                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border cursor-pointer transition-all ${PRIORITIES[task.priority || 'medium'].color} hover:shadow-lg transform hover:-translate-y-0.5`}
                                                                            >
                                                                                {PRIORITIES[task.priority || 'medium'].label}
                                                                            </button>
                                                                            {columnId === 'todo' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'todo', 'in_progress')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">Start</button>
                                                                            )}
                                                                            {columnId === 'in_progress' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'in_progress', 'done')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">Finish</button>
                                                                            )}
                                                                            {columnId === 'done' && (
                                                                                <button onClick={() => updateTaskStatus(task.id, 'done', 'todo')} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-gray-500/30 text-gray-400 bg-gray-500/10 hover:bg-gray-500/20 transition-colors">Reopen</button>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-sm font-mono text-gray-500 bg-black/20 px-2 py-1 rounded flex-shrink-0">#{task.id}</span>
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
                                        {project.github_repo.split('/')[1]}
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
                                                            href={`https://github.com/${project.github_repo}/commit/${commit.sha}`}
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
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ProjectDetail;
