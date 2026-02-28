import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Github, Folder, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectRepo, setNewProjectRepo] = useState('');

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const projectsData = res.data;

            // Also fetch issue/PR counts for each project
            const projectsWithStats = await Promise.all(projectsData.map(async (project) => {
                let stats = { issues: 0, prs: 0 };
                if (project.github_repo) {
                    try {
                        const issuesRes = await api.get(`/github/issues/${project.github_repo}`);
                        stats.issues = issuesRes.data.issues?.length || 0;
                        stats.prs = issuesRes.data.pull_requests?.length || 0;
                    } catch (e) {
                        // Silently ignore github fetch errors for dashboard cards
                        console.error('Failed fetching github stats for dashboard', e);
                    }
                }
                return { ...project, githubStats: stats };
            }));

            setProjects(projectsWithStats);
        } catch (err) {
            setError('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', {
                name: newProjectName,
                description: newProjectDesc,
                github_repo: newProjectRepo
            });
            setShowModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
            setNewProjectRepo('');
            setLoading(true);
            fetchProjects();
        } catch (err) {
            setError('Failed to create project');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Your Projects
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/30"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">New Project</span>
                    </button>
                </div>

                {/* Dashboard Stats */}
                {!loading && projects.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="glass-card p-6 rounded-2xl border border-gray-700/50 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                            <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Total Projects</p>
                            <p className="text-4xl font-extrabold text-white font-['Outfit']">{projects.length}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
                            <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Active Repos</p>
                            <p className="text-4xl font-extrabold text-white font-['Outfit']">
                                {projects.filter(p => p.github_repo).length}
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-amber-500/20 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500"></div>
                            <p className="text-sm font-bold text-amber-400 mb-2 uppercase tracking-wider">Total Open Issues</p>
                            <p className="text-4xl font-extrabold text-white font-['Outfit']">
                                {projects.reduce((acc, p) => acc + (p.githubStats?.issues || 0), 0)}
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
                            <p className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">Total PRs</p>
                            <p className="text-4xl font-extrabold text-white font-['Outfit']">
                                {projects.reduce((acc, p) => acc + (p.githubStats?.prs || 0), 0)}
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card rounded-2xl h-56 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <Folder className="h-20 w-20 mx-auto text-indigo-400/50 mb-6 drop-shadow-[0_0_15px_#6366f14d]" />
                        <h3 className="text-2xl font-bold text-white mb-3 font-['Outfit']">No projects yet</h3>
                        <p className="text-gray-400 max-w-sm mx-auto text-lg mb-8">Create a new workspace to start orchestrating tasks and tracking GitHub commits seamlessly.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Create First Project</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <Link to={`/project/${project.id}`} key={project.id} className="block group h-full">
                                <div className="glass-card rounded-2xl p-6 border border-white/5 glowing-border h-full flex flex-col relative overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 font-['Outfit']">{project.name}</h3>
                                        <div className="p-2 bg-gray-800/50 rounded-lg shrink-0">
                                            <Folder className="h-5 w-5 text-indigo-400/70 group-hover:text-indigo-400" />
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-6 flex-grow line-clamp-2 leading-relaxed relative z-10">
                                        {project.description || 'No description provided.'}
                                    </p>
                                    {project.github_repo && (
                                        <div className="flex items-center justify-between text-sm text-gray-400 mt-auto pt-5 border-t border-white/5 relative z-10">
                                            <div className="flex items-center space-x-2 truncate max-w-[55%]">
                                                <Github className="h-4 w-4 flex-shrink-0 text-white" />
                                                <span className="truncate font-medium">{project.github_repo}</span>
                                            </div>
                                            {(project.githubStats?.issues > 0 || project.githubStats?.prs > 0) && (
                                                <div className="flex items-center space-x-2 text-xs bg-gray-900/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                    {project.githubStats?.issues > 0 && <span className="text-amber-400 font-bold" title="Open Issues">{project.githubStats.issues} Issues</span>}
                                                    {project.githubStats?.prs > 0 && <span className="text-emerald-400 font-bold pl-2 border-l border-gray-700" title="Pull Requests">{project.githubStats.prs} PRs</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="glass-card rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden transform transition-all animate-[slideUp_0.3s_ease-out]">
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-white mb-2 font-['Outfit']">Create Project</h2>
                            <p className="text-gray-400 mb-8">Define your new workspace area.</p>

                            <form onSubmit={handleCreateProject} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600 focus:bg-gray-800/80"
                                        placeholder="E.g., Quantum Algorithm Redesign"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600 focus:bg-gray-800/80 resize-none"
                                        placeholder="Outline the goals and scope of this project..."
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                                        <Github className="w-4 h-4" />
                                        <span>GitHub Repository <span className="text-gray-500 font-normal">(Optional)</span></span>
                                    </label>
                                    <div className="flex rounded-xl overflow-hidden border border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-gray-900/50 transition-all">
                                        <span className="inline-flex items-center px-4 bg-gray-800/50 text-gray-500 text-sm border-r border-gray-700 font-medium">
                                            github.com/
                                        </span>
                                        <input
                                            type="text"
                                            value={newProjectRepo}
                                            onChange={(e) => setNewProjectRepo(e.target.value)}
                                            className="flex-1 px-4 py-3 bg-transparent text-white border-0 outline-none placeholder-gray-600 focus:bg-gray-800/30"
                                            placeholder="owner/repo"
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-400 mt-2 ml-1">Connect this to unlock live issues and commits.</p>
                                </div>
                                <div className="flex space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors border border-gray-700 hover:border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Create Workspace
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
