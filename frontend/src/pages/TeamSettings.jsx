import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, UserPlus, Shield, ArrowLeft, AlertCircle, CheckCircle2, Link as LinkIcon, Copy } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

const TeamSettings = () => {
    const { id } = useParams();
    const [members, setMembers] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Add Member State
    const [newMemberUsername, setNewMemberUsername] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('member');
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [adding, setAdding] = useState(false);

    // Invite Link State
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [projRes, membersRes] = await Promise.all([
                api.get('/projects'),
                api.get(`/projects/${id}/members`)
            ]);

            const currentProject = projRes.data.find(p => p.id === parseInt(id));
            setProject(currentProject);
            setMembers(membersRes.data);
        } catch (_err) {
            setError('Failed to fetch team data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [id, fetchData]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddSuccess('');
        setAdding(true);

        try {
            await api.post(`/projects/${id}/members`, {
                username: newMemberUsername,
                role: newMemberRole
            });
            setAddSuccess(`Successfully added ${newMemberUsername} to the team!`);
            setNewMemberUsername('');
            fetchData();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to add member. Please check the username.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (member) => {
        if (!window.confirm(`Remove ${member.user.username} from the project?`)) return;
        try {
            await api.delete(`/projects/${id}/members/${member.id}`);
            setMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to remove member.');
        }
    };

    const handleCopyLink = () => {
        const inviteUrl = `${window.location.origin}/register?invite=${id}`;
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-73px)]">
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

            <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">

                <div className="mb-8">
                    <Link to={`/project/${id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Board
                    </Link>
                    <header className="border-b border-white/10 pb-6 relative overflow-hidden rounded-2xl glass-card p-6">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <Users className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">Team Settings</h1>
                                <p className="text-gray-400 text-lg">Manage members for {project.name}</p>
                            </div>
                        </div>
                    </header>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Add Member Form */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                                <UserPlus className="h-5 w-5 mr-2 text-emerald-400" /> Invite Member
                            </h2>

                            {addSuccess && (
                                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start space-x-2 text-emerald-400 text-sm">
                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    <span>{addSuccess}</span>
                                </div>
                            )}

                            {addError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2 text-red-400 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{addError}</span>
                                </div>
                            )}

                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={newMemberUsername}
                                        onChange={(e) => setNewMemberUsername(e.target.value)}
                                        placeholder="Enter exact username"
                                        className="w-full bg-gray-900 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Role</label>
                                    <div className="relative">
                                        <select
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                                        >
                                            <option value="member">Member (Can edit tasks)</option>
                                            <option value="admin">Admin (Can manage settings)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                            <Shield className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={adding || !newMemberUsername.trim()}
                                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                >
                                    {adding ? 'Inviting...' : 'Send Invite'}
                                </button>
                            </form>

                            <hr className="my-6 border-white/10" />

                            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
                                <LinkIcon className="h-4 w-4 mr-2 text-blue-400" /> Shareable Invite Link
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Share this link with unregistered users. When they sign up using this link, they will be automatically added to the project as a Member.
                            </p>

                            <button
                                onClick={handleCopyLink}
                                className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'}`}
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Copied to Clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span>Copy Invite Link</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="md:col-span-2">
                        <div className="glass-card rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-white/5 bg-gray-900/50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-indigo-400" /> Current Team
                                </h2>
                                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-gray-300">
                                    {members.length} member{members.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="flex-1 p-2">
                                <ul className="divide-y divide-white/5">
                                    {members.map(member => (
                                        <li key={member.id} className="p-4 hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold shadow-md text-white border border-white/10">
                                                    {member.user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-200">{member.user.username}</p>
                                                    <p className="text-xs text-gray-500 capitalize flex items-center mt-0.5">
                                                        {member.role === 'admin' || member.role === 'owner' ? <Shield className="h-3 w-3 mr-1 text-amber-400" /> : null}
                                                        {member.role}
                                                    </p>
                                                </div>
                                            </div>

                                            {member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TeamSettings;
