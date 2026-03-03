import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
            setUnread(res.data.filter(n => !n.is_read).length);
        } catch (_err) {
            // silently ignore if user logs out
        }
    }, []);

    useEffect(() => {
        // Slight delay on mount to avoid synchronous setState in effect
        const timer = setTimeout(fetchNotifications, 0);
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => { clearTimeout(timer); clearInterval(interval); };
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnread(0);
        } catch (_err) {
            console.error('Failed to mark notifications read');
        }
    };

    const handleClickNotif = async (notif) => {
        if (!notif.is_read) {
            try {
                await api.post(`/notifications/${notif.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setUnread(prev => Math.max(0, prev - 1));
            } catch (_err) {/* ignore */ }
        }
        setOpen(false);
        if (notif.link) navigate(notif.link);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center text-white border-2 border-gray-900 shadow-lg shadow-red-500/30 animate-pulse">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        <div className="flex items-center space-x-2">
                            {unread > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors">
                                    <CheckCheck className="w-3 h-3" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => handleClickNotif(n)}
                                    className={`w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-white/5 transition-colors border-b border-white/5 ${!n.is_read ? 'bg-indigo-500/5' : ''}`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-700' : 'bg-indigo-500'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-400' : 'text-gray-100'}`}>{n.message}</p>
                                        <p className="text-xs text-gray-600 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="px-4 py-2 border-t border-white/10 text-center">
                        <span className="text-xs text-gray-600">Updates every 30 seconds</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
