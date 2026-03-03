import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentThread = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const currentUsername = localStorage.getItem('username');

    const fetchComments = useCallback(async () => {
        try {
            const res = await api.get(`/comments/task/${taskId}`);
            setComments(res.data);
        } catch (_e) { /* ignore */ }
    }, [taskId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/comments/task/${taskId}`, { content: text.trim() });
            setText('');
            fetchComments();
        } catch (_e) { /* ignore */ } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/comments/${id}`);
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (_e) { /* ignore */ }
    };

    return (
        <div className="mt-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Comments ({comments.length})
            </h4>

            {/* Comment list */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
                {comments.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No comments yet. Be the first!</p>
                )}
                {comments.map(c => (
                    <div key={c.id} className="flex items-start space-x-2.5 group">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {c.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-gray-800/60 rounded-xl px-3 py-2 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-indigo-300">{c.username}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                    {c.username === currentUsername && (
                                        <button onClick={() => handleDelete(c.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    placeholder="Write a comment… (Enter to send, Shift+Enter for newline)"
                    rows={2}
                    className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-600"
                />
                <button type="submit" disabled={submitting || !text.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white disabled:opacity-40 transition-colors flex-shrink-0">
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default CommentThread;
