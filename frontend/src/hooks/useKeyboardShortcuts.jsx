import { useEffect, useState } from 'react';

const SHORTCUTS = [
    { key: 'N', description: 'New task (on kanban board)' },
    { key: '/', description: 'Focus search bar' },
    { key: 'Esc', description: 'Close any modal / dismiss' },
    { key: '?', description: 'Show / hide this shortcuts panel' },
    { key: 'G D', description: 'Go to Dashboard' },
    { key: 'G A', description: 'Go to Analytics (inside a project)' },
];

let gBuffer = '';

/**
 * useKeyboardShortcuts – global keyboard shortcut hook.
 * @param {Object} handlers – map of shortcut name to callback
 *   Supported keys: onNewTask, onSearch, onDashboard, onAnalytics (receives navigate+id)
 */
const useKeyboardShortcuts = ({ onNewTask, onSearch, onDashboard, onAnalytics } = {}) => {
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Ignore when typing in inputs/textareas/contenteditable
            const tag = e.target.tagName;
            const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
            if (isEditing && e.key !== 'Escape') return;

            if (e.key === 'Escape') {
                setShowHelp(false);
                // Let other components handle Esc via their own listeners
                return;
            }

            if (e.key === '?') {
                e.preventDefault();
                setShowHelp(v => !v);
                return;
            }

            if (e.key === '/' && !isEditing) {
                e.preventDefault();
                if (onSearch) onSearch();
                return;
            }

            if (e.key.toLowerCase() === 'n' && !isEditing) {
                if (onNewTask) onNewTask();
                return;
            }

            // Multi-key: G+D, G+A
            if (e.key.toLowerCase() === 'g') {
                gBuffer = 'g';
                setTimeout(() => { gBuffer = ''; }, 1500);
                return;
            }
            if (gBuffer === 'g') {
                if (e.key.toLowerCase() === 'd' && onDashboard) {
                    gBuffer = '';
                    onDashboard();
                }
                if (e.key.toLowerCase() === 'a' && onAnalytics) {
                    gBuffer = '';
                    onAnalytics();
                }
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onNewTask, onSearch, onDashboard, onAnalytics]);

    const ShortcutsOverlay = () => showHelp ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4"
            onClick={() => setShowHelp(false)}>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">⌨️</span> Keyboard Shortcuts
                </h2>
                <ul className="space-y-3">
                    {SHORTCUTS.map(s => (
                        <li key={s.key} className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">{s.description}</span>
                            <kbd className="bg-gray-800 text-indigo-300 border border-gray-700 rounded px-2 py-0.5 text-xs font-mono font-bold">{s.key}</kbd>
                        </li>
                    ))}
                </ul>
                <button onClick={() => setShowHelp(false)}
                    className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium border border-gray-700 transition-colors">
                    Close
                </button>
            </div>
        </div>
    ) : null;

    return { showHelp, setShowHelp, ShortcutsOverlay };
};

export default useKeyboardShortcuts;
