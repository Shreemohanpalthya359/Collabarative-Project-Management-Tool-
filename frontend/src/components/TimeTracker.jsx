import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Clock, Play, Square, Plus, Trash2, Timer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fmtMins = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtStopwatch = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TimeTracker = ({ taskId }) => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0); // seconds
    const [showManual, setShowManual] = useState(false);
    const [manualMins, setManualMins] = useState('');
    const [manualNote, setManualNote] = useState('');
    const startRef = useRef(null);
    const timerRef = useRef(null);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await api.get(`/time/task/${taskId}`);
            setLogs(res.data.logs);
            setTotal(res.data.total_minutes);
        } catch (_e) { /* ignore */ }
    }, [taskId]);

    useEffect(() => {
        let mounted = true;
        const load = async () => { if (mounted) await fetchLogs(); };
        load();
        return () => {
            mounted = false;
            clearInterval(timerRef.current);
        };
    }, [fetchLogs]);

    const startTimer = () => {
        setRunning(true);
        startRef.current = Date.now() - elapsed * 1000;
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
    };

    const stopTimer = async () => {
        clearInterval(timerRef.current);
        setRunning(false);
        const mins = Math.max(1, Math.round(elapsed / 60));
        const savedElapsed = elapsed;
        setElapsed(0);
        try {
            await api.post(`/time/task/${taskId}`, {
                minutes: mins,
                note: `Stopwatch: ${fmtStopwatch(savedElapsed)}`
            });
            fetchLogs();
        } catch (_e) { /* ignore */ }
    };

    const resetTimer = () => {
        clearInterval(timerRef.current);
        setRunning(false);
        setElapsed(0);
    };

    const logManual = async (e) => {
        e.preventDefault();
        const mins = parseInt(manualMins);
        if (!mins || mins <= 0) return;
        try {
            await api.post(`/time/task/${taskId}`, { minutes: mins, note: manualNote.trim() || null });
            setManualMins(''); setManualNote(''); setShowManual(false);
            fetchLogs();
        } catch (_e) { /* ignore */ }
    };

    const deleteLog = async (id) => {
        try { await api.delete(`/time/${id}`); fetchLogs(); } catch (_e) { /* ignore */ }
    };

    // colour transitions based on time elapsed
    const timerColor = elapsed === 0 ? 'text-gray-300'
        : elapsed < 300 ? 'text-emerald-400'   // < 5 min
            : elapsed < 1800 ? 'text-amber-400'    // < 30 min
                : 'text-rose-400';                      // 30+ min

    const ringColor = elapsed === 0 ? 'border-gray-700'
        : elapsed < 300 ? 'border-emerald-500/60'
            : elapsed < 1800 ? 'border-amber-500/60'
                : 'border-rose-500/60';

    const glowColor = elapsed === 0 ? ''
        : elapsed < 300 ? 'shadow-[0_0_20px_rgba(52,211,153,0.15)]'
            : elapsed < 1800 ? 'shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                : 'shadow-[0_0_20px_rgba(248,113,113,0.15)]';

    return (
        <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span className="flex items-center"><Timer className="w-3.5 h-3.5 mr-1.5" /> Stopwatch</span>
                <span className="text-indigo-300 font-mono">{fmtMins(total)} logged</span>
            </h4>

            {/* ── Main Stopwatch Display ── */}
            <div className={`flex flex-col items-center py-5 mb-4 rounded-2xl border-2 transition-all duration-500 bg-gray-900/60 ${ringColor} ${glowColor}`}>
                <div className={`font-mono text-4xl font-extrabold tracking-widest transition-colors duration-500 ${timerColor} ${running ? 'animate-pulse' : ''}`}>
                    {fmtStopwatch(elapsed)}
                </div>
                {running && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>Recording…</span>
                    </div>
                )}
                <div className="flex items-center space-x-3 mt-4">
                    {!running ? (
                        <button onClick={startTimer}
                            className="flex items-center space-x-2 px-5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95">
                            <Play className="w-4 h-4 fill-current" /><span>Start</span>
                        </button>
                    ) : (
                        <>
                            <button onClick={stopTimer}
                                className="flex items-center space-x-2 px-5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95">
                                <Square className="w-4 h-4 fill-current" /><span>Stop & Log</span>
                            </button>
                            <button onClick={resetTimer}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-xl text-sm transition-all">
                                Reset
                            </button>
                        </>
                    )}
                    {!running && (
                        <button onClick={() => setShowManual(v => !v)}
                            className="flex items-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-xl text-sm transition-all">
                            <Plus className="w-3.5 h-3.5" /><span>Manual</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Manual entry */}
            {showManual && (
                <form onSubmit={logManual} className="mb-3 flex items-center space-x-2">
                    <input type="number" min="1" placeholder="Minutes"
                        value={manualMins} onChange={e => setManualMins(e.target.value)}
                        className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                    <input type="text" placeholder="Note (optional)"
                        value={manualNote} onChange={e => setManualNote(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-colors">Log</button>
                </form>
            )}

            {/* Log list */}
            {logs.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center"><Clock className="w-3 h-3 mr-1" />Session History</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                        {logs.map(l => (
                            <div key={l.id} className="flex items-center justify-between text-xs group bg-gray-800/40 rounded-lg px-2.5 py-1.5 border border-white/5">
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-indigo-300">{fmtMins(l.minutes)}</span>
                                    <span className="text-gray-500">{l.note || 'Manual entry'}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <span>{formatDistanceToNow(new Date(l.logged_at), { addSuffix: true })}</span>
                                    <button onClick={() => deleteLog(l.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTracker;
