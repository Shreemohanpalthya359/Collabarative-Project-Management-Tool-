import React, { useState, useEffect } from 'react';
import { GitPullRequest, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

const PullRequestsWidget = ({ repoUrl }) => {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!repoUrl) {
            setLoading(false);
            return;
        }

        const fetchPRs = async () => {
            try {
                // The endpoint is /api/github/issues/<repo_path>
                // Need to clean repo first before appending to URL, or just pass full repoUrl to backend
                // Backend cleans it, but we need to encode it
                const encodedRepo = encodeURIComponent(repoUrl);
                const res = await api.get(`/github/issues/${encodedRepo}`);
                setPrs(res.data.pull_requests || []);
            } catch (err) {
                console.error("Failed to fetch PRs", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPRs();
    }, [repoUrl]);

    if (!repoUrl) return null;

    return (
        <div className="glass-card rounded-2xl border border-white/10 shadow-2xl flex flex-col min-h-0 h-64 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="p-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 relative z-10 bg-black/20 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2 font-['Outfit']">
                    <div className="w-8 h-8 rounded-lg bg-gray-800/80 border border-white/10 flex items-center justify-center">
                        <GitPullRequest className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span>Open Pull Requests</span>
                </h2>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {prs.length}
                </span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar relative z-10">
                {loading ? (
                    <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-8 h-8 bg-gray-800 rounded-full mb-3"></div>
                            <p className="text-sm">Fetching PRs...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                        <AlertCircle className="h-8 w-8 mb-3 text-red-500/50" />
                        <p className="text-sm">Failed to load PRs.</p>
                    </div>
                ) : prs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-full italic text-sm">
                        No open pull requests found.
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {prs.map(pr => (
                            <li key={pr.id} className="p-4 hover:bg-white/5 transition-colors group">
                                <a href={pr.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors leading-snug mb-1">
                                        {pr.title}
                                    </h3>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                        <div className="flex items-center">
                                            <span className="font-mono text-emerald-500/70 mr-2">#{pr.number}</span>
                                            <span>by <span className="text-gray-400 font-medium">{pr.user}</span></span>
                                        </div>
                                        <span>{formatDistanceToNow(new Date(pr.created_at))} ago</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PullRequestsWidget;
