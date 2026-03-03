import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckSquare, MessageSquare, Tag, Clock, Send, Plus, Trash2, User, Flag, Calendar, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import TimeTracker from './TimeTracker';
import FileAttachments from './FileAttachments';

const TaskDetailModal = ({ taskId, onClose, onUpdate }) => {
    const [task, setTask] = useState(null);
    const [members, setMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Project Labels
    const [projectLabels, setProjectLabels] = useState([]);
    const [showLabelSelector, setShowLabelSelector] = useState(false);

    // Edit Description
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editDesc, setEditDesc] = useState('');

    // New Comment
    const [newComment, setNewComment] = useState('');

    // New Checklist Item
    const [newChecklistItem, setNewChecklistItem] = useState('');

    // New Subtask
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');


    const fetchTaskDetails = useCallback(async () => {
        try {
            const res = await api.get(`/tasks/${taskId}/details`);
            const taskData = res.data;
            setTask(taskData);
            setEditDesc(taskData.description || '');

            // Fetch project members, sprints, and labels for assignment
            if (taskData.project_id) {
                const [membersRes, sprintsRes, labelsRes] = await Promise.all([
                    api.get(`/projects/${taskData.project_id}/members`),
                    api.get(`/sprints/project/${taskData.project_id}`),
                    api.get(`/projects/${taskData.project_id}/labels`)
                ]);
                setMembers(membersRes.data);
                setSprints(sprintsRes.data);
                setProjectLabels(labelsRes.data);
            }
        } catch (_err) {
            setError('Failed to load task details');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchTaskDetails();
    }, [taskId, fetchTaskDetails]);

    const handleSaveDescription = async () => {
        try {
            await api.put(`/tasks/${taskId}`, { description: editDesc });
            setTask({ ...task, description: editDesc });
            setIsEditingDesc(false);
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to update description');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/tasks/${taskId}/comments`, { content: newComment });
            setTask({ ...task, comments: [...task.comments, res.data] });
            setNewComment('');
        } catch (_err) {
            console.error('Failed to add comment');
        }
    };

    const handleAddChecklist = async (e) => {
        e.preventDefault();
        if (!newChecklistItem.trim()) return;
        try {
            const res = await api.post(`/tasks/${taskId}/checklists`, { content: newChecklistItem });
            setTask({ ...task, checklists: [...task.checklists, res.data] });
            setNewChecklistItem('');
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to add checklist item');
        }
    };

    const handleToggleChecklist = async (itemId, currentStatus) => {
        try {
            // Optimistic
            const newChecklists = task.checklists.map(c => c.id === itemId ? { ...c, is_completed: !currentStatus } : c);
            setTask({ ...task, checklists: newChecklists });

            await api.put(`/tasks/checklists/${itemId}`, { is_completed: !currentStatus });
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to toggle checklist');
            fetchTaskDetails(); // Revert
        }
    };

    const handleDeleteChecklist = async (itemId) => {
        try {
            await api.delete(`/tasks/checklists/${itemId}`);
            setTask({ ...task, checklists: task.checklists.filter(c => c.id !== itemId) });
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to delete checklist item');
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || !task.project_id) return;
        try {
            // Create a new task and link it via parent_id
            const res = await api.post(`/tasks/project/${task.project_id}`, {
                title: newSubtaskTitle,
                parent_id: taskId
            });

            // Add to local state (partially matching backend subtask model)
            const newSt = {
                id: res.data.id,
                title: newSubtaskTitle,
                status: 'todo',
                priority: res.data.priority,
                assignee_username: null
            };
            setTask({ ...task, subtasks: [...(task.subtasks || []), newSt] });
            setNewSubtaskTitle('');
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to add subtask');
        }
    };

    const handleAssigneeChange = async (newAssigneeId) => {
        try {
            const val = newAssigneeId === '' ? null : parseInt(newAssigneeId);
            await api.put(`/tasks/${taskId}`, { assignee_id: val });
            setTask({ ...task, assignee_id: val });
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to update assignee');
        }
    };

    const handleSprintChange = async (newSprintId) => {
        try {
            const val = newSprintId === '' ? null : parseInt(newSprintId);
            await api.put(`/tasks/${taskId}`, { sprint_id: val });
            setTask({ ...task, sprint_id: val });
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to update sprint');
        }
    };

    const handleToggleLabel = async (label) => {
        try {
            const hasLabel = task.labels.some(l => l.id === label.id);
            if (hasLabel) {
                await api.delete(`/tasks/${taskId}/labels/${label.id}`);
                setTask({ ...task, labels: task.labels.filter(l => l.id !== label.id) });
            } else {
                await api.post(`/tasks/${taskId}/labels`, { label_id: label.id });
                setTask({ ...task, labels: [...task.labels, label] });
            }
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to toggle label');
        }
    };

    const handleDueDateChange = async (newDate) => {
        try {
            await api.put(`/tasks/${taskId}`, { due_date: newDate || null });
            setTask({ ...task, due_date: newDate || null });
            if (onUpdate) onUpdate();
        } catch (_err) {
            console.error('Failed to update due date');
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm('Delete this task? This cannot be undone.')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            if (onUpdate) onUpdate();
            onClose();
        } catch (_err) {
            console.error('Failed to delete task');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
                <div className="glass-card p-8 rounded-xl text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded-lg">Close</button>
                </div>
            </div>
        );
    }

    const completedChecklists = task.checklists.filter(c => c.is_completed).length;
    const progressText = task.checklists.length > 0
        ? `${Math.round((completedChecklists / task.checklists.length) * 100)}%`
        : '0%';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4 md:p-6 lg:p-8 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
            <div className="glass-card rounded-2xl w-full max-w-4xl max-h-full flex flex-col border border-white/10 shadow-2xl relative bg-gray-900/95 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between flex-shrink-0 relative z-10 bg-gray-900/50 backdrop-blur-xl">
                    <div className="flex-1 pr-8">
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">TASK-{task.id}</span>
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 hidden border-red-500/20' :
                                task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                {task.priority} Priority
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white font-['Outfit'] leading-tight">{task.title}</h2>
                    </div>

                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors absolute top-6 right-6">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* Main Column */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-r border-white/5 space-y-8">

                        {/* Description Section */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                                    <span>Description</span>
                                </h3>
                                {!isEditingDesc && (
                                    <button
                                        onClick={() => setIsEditingDesc(true)}
                                        className="text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 rounded-md transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full h-48 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm resize-none"
                                        placeholder="Add a more detailed description... (Markdown supported)"
                                    />
                                    <div className="flex space-x-3">
                                        <button onClick={handleSaveDescription} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors">
                                            Save
                                        </button>
                                        <button onClick={() => setIsEditingDesc(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-indigo max-w-none bg-gray-800/30 p-5 rounded-xl border border-white/5 min-h-[100px]" onDoubleClick={() => setIsEditingDesc(true)}>
                                    {task.description ? (
                                        <ReactMarkdown>{task.description}</ReactMarkdown>
                                    ) : (
                                        <p className="text-gray-500 italic">No description provided. Click 'Edit' or double click here to add one.</p>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Checklist Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <CheckSquare className="h-5 w-5 text-emerald-400" />
                                    <span>Checklist</span>
                                </h3>
                                {task.checklists.length > 0 && (
                                    <span className="text-sm font-medium text-gray-400">{completedChecklists}/{task.checklists.length} ({progressText})</span>
                                )}
                            </div>

                            {task.checklists.length > 0 && (
                                <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden border border-white/5">
                                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: progressText }}></div>
                                </div>
                            )}

                            <div className="space-y-2 mb-4">
                                {task.checklists.map(item => (
                                    <div key={item.id} className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg transition-colors">
                                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_completed}
                                                    onChange={() => handleToggleChecklist(item.id, item.is_completed)}
                                                    className="w-5 h-5 appearance-none border-2 border-gray-600 rounded checked:border-emerald-500 checked:bg-emerald-500 transition-colors cursor-pointer peer"
                                                />
                                                <CheckSquare className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 pointer-events-none opacity-0 peer-checked:opacity-100" />
                                            </div>
                                            <span className={`text-sm md:text-base transition-colors ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                {item.content}
                                            </span>
                                        </label>
                                        <button
                                            onClick={() => handleDeleteChecklist(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddChecklist} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    placeholder="Add an item..."
                                    className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder-gray-500"
                                />
                                <button type="submit" disabled={!newChecklistItem.trim()} className="bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center space-x-1">
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </button>
                            </form>
                        </section>

                        {/* Subtasks Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4 mt-6">
                                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                                        <div className="bg-blue-400 h-1 w-full rounded"></div>
                                        <div className="bg-blue-400 h-1 w-3/4 rounded ml-auto"></div>
                                    </div>
                                    <span>Subtasks</span>
                                </h3>
                                {(task.subtasks && task.subtasks.length > 0) && (
                                    <span className="text-sm font-medium text-gray-400">{task.subtasks.length} items</span>
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                {task.subtasks && task.subtasks.map(st => (
                                    <div key={st.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-gray-800/30 hover:bg-gray-800/60 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${st.status === 'done' ? 'bg-emerald-500' :
                                                st.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}></span>
                                            <span className={`text-sm font-medium ${st.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                {st.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-mono text-gray-500">TASK-{st.id}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!task.subtasks || task.subtasks.length === 0) && (
                                    <p className="text-gray-500 text-sm italic py-2">No subtasks found.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddSubtask} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Create a subtask..."
                                    className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-500"
                                />
                                <button type="submit" disabled={!newSubtaskTitle.trim()} className="bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center space-x-1">
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </button>
                            </form>
                        </section>

                        {/* Comments Section */}
                        <section>
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
                                <MessageSquare className="h-5 w-5 text-purple-400" />
                                <span>Activity</span>
                            </h3>

                            <div className="space-y-4 mb-4">
                                {task.comments.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic py-4">No comments yet.</p>
                                ) : (
                                    task.comments.map(comment => (
                                        <div key={comment.id} className="flex space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md">
                                                {comment.user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 bg-gray-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-bold text-gray-200 text-sm">{comment.user.username}</span>
                                                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                                                </div>
                                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex items-start space-x-3 mt-4">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-gray-600">
                                    ?
                                </div>
                                <div className="flex-1 flex flex-col items-end">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none placeholder-gray-500 resize-none min-h-[80px] mb-2"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center shadow-lg shadow-purple-500/20"
                                    >
                                        <Send className="h-4 w-4 mr-2" /> Comment
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* ── Time Tracking ───────────────────── */}
                        <section className="border border-white/5 rounded-2xl p-4 bg-gray-900/40">
                            <TimeTracker taskId={taskId} />
                        </section>

                        {/* ── File Attachments ─────────────────── */}
                        <section className="border border-white/5 rounded-2xl p-4 bg-gray-900/40">
                            <FileAttachments taskId={taskId} />
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="w-full md:w-64 bg-gray-900/80 p-6 flex flex-col space-y-6">

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h4>
                            <select
                                value={task.status}
                                onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    setTask({ ...task, status: newStatus });
                                    try {
                                        await api.put(`/tasks/${taskId}`, { status: newStatus });
                                        if (onUpdate) onUpdate();
                                    } catch (_err) {
                                        console.error('Failed to update status');
                                    }
                                }}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Assignee</span>
                            </h4>
                            <select
                                value={task.assignee_id || ''}
                                onChange={(e) => handleAssigneeChange(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            >
                                <option value="">Unassigned</option>
                                {members.map(member => (
                                    <option key={member.user.id} value={member.user.id}>
                                        {member.user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                                <Flag className="w-4 h-4" />
                                <span>Sprint</span>
                            </h4>
                            <select
                                value={task.sprint_id || ''}
                                onChange={(e) => handleSprintChange(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            >
                                <option value="">Backlog</option>
                                {sprints.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                                <Tag className="w-4 h-4" />
                                <span>Labels</span>
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {task.labels.length === 0 && <span className="text-gray-500 text-sm">None</span>}
                                {task.labels.map(label => (
                                    <span key={label.id} className="text-xs font-bold px-2 py-1 flex items-center rounded border group" style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}40` }}>
                                        {label.name}
                                        <button onClick={() => handleToggleLabel(label)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <button onClick={() => setShowLabelSelector(!showLabelSelector)} className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700 hover:border-gray-600">
                                {showLabelSelector ? 'Done' : 'Add Label'}
                            </button>

                            {showLabelSelector && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 z-20 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                    <h5 className="text-xs font-semibold text-gray-400 mb-2 px-1">Select Labels</h5>
                                    {projectLabels.length === 0 ? (
                                        <p className="text-xs text-gray-500 px-1 py-1">No labels created for this project yet.</p>
                                    ) : (
                                        projectLabels.map(label => {
                                            const isSelected = task.labels.some(l => l.id === label.id);
                                            return (
                                                <button
                                                    key={label.id}
                                                    onClick={() => handleToggleLabel(label)}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 flex items-center justify-between transition-colors ${isSelected ? 'bg-gray-700/50' : 'hover:bg-gray-700'}`}
                                                >
                                                    <span className="flex items-center">
                                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: label.color }}></span>
                                                        <span className={isSelected ? 'text-white' : 'text-gray-300'}>{label.name}</span>
                                                    </span>
                                                    {isSelected && <CheckSquare className="w-4 h-4 text-emerald-400" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>Due Date</span>
                            </h4>
                            <input
                                type="date"
                                value={task.due_date ? task.due_date.substring(0, 10) : ''}
                                onChange={(e) => handleDueDateChange(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                            {task.due_date && (
                                <button
                                    onClick={() => handleDueDateChange('')}
                                    className="mt-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    Clear due date
                                </button>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <p className="text-xs text-gray-500 mb-1">Created</p>
                            <p className="text-sm text-gray-300">Just now</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-red-900/30">
                            <button
                                onClick={handleDeleteTask}
                                className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold transition-colors border border-red-500/20 flex items-center justify-center space-x-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Task</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
