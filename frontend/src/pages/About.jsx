import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import {
    Target, Github, Kanban, BarChart2, Bell, Clock, Tag, Paperclip,
    Calendar, Flag, Users, Zap, ArrowLeft,
    MessageSquare, FileText, Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { fadeUp, staggerContainer } from '../animations';

/* ── Data ─────────────────────────────────────────────── */
const FEATURES = [
    {
        icon: Kanban,
        color: 'indigo',
        title: 'Kanban Board',
        desc: 'Drag-and-drop task management with three columns (To Do, In Progress, Done). Cards show colored label badges, due-date warnings, priority levels, and assignee avatars. Bulk-select mode for mass status updates.',
    },
    {
        icon: Github,
        color: 'gray',
        title: 'GitHub Integration',
        desc: 'Link any GitHub repository to a project. Live commit feed, open issues, and pull requests sync directly into your dashboard so the team never loses context.',
    },
    {
        icon: Flag,
        color: 'pink',
        title: 'Sprints & Iterations',
        desc: 'Create named sprints with start/end dates and a status (Planned → Active → Completed). Task progress is tracked per sprint with a done/total indicator.',
    },
    {
        icon: BarChart2,
        color: 'emerald',
        title: 'Analytics Dashboard',
        desc: 'KPI cards for total tasks, completion rate, overdue count, and open PRs. Area charts for week-over-week velocity, donut charts for status distribution, and bar charts for priority breakdown.',
    },
    {
        icon: MessageSquare,
        color: 'blue',
        title: 'Task Comments',
        desc: 'Threaded comments on every task. Press Enter to send, Shift+Enter for a new line. Each user can delete their own messages in real time.',
    },
    {
        icon: Tag,
        color: 'purple',
        title: 'Labels & Tags',
        desc: 'Create color-coded labels per project and apply them to tasks. Labels render as vivid badges on every kanban card for instant visual categorisation.',
    },
    {
        icon: Clock,
        color: 'amber',
        title: 'Time Tracker',
        desc: 'Start/stop a live timer per task, or log hours manually. All entries are listed with timestamps and a running total so estimates vs actuals are always visible.',
    },
    {
        icon: Paperclip,
        color: 'teal',
        title: 'File Attachments',
        desc: 'Drag-and-drop or click to upload files of any type to a task. Download or delete attachments inline, with icons auto-picked by file extension.',
    },
    {
        icon: Calendar,
        color: 'rose',
        title: 'iCal Export',
        desc: 'Export the full project calendar as a standard .ics file. Every task (with or without a due date) and every sprint appear as calendar events, importable into Google Calendar, Apple Calendar, or Outlook.',
    },
    {
        icon: Bell,
        color: 'orange',
        title: 'Notifications',
        desc: 'In-app notification bell shows task assignments, project invitations, and system events. Mark all as read with one click.',
    },
    {
        icon: Users,
        color: 'cyan',
        title: 'Team & Roles',
        desc: 'Invite team members with a shareable link, or add them by username. Manage roles (Owner / Member) and remove members from the Team Settings page.',
    },
    {
        icon: FileText,
        color: 'lime',
        title: 'Task Templates',
        desc: 'Save any task structure as a reusable template. Apply a template to instantly pre-fill title, description, priority, and labels — perfect for recurring work.',
    },
];



const COLOUR = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    gray: 'text-gray-300 bg-gray-500/10 border-gray-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    lime: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
};

/* ── Component ─────────────────────────────────────────── */
const About = () => (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
        <Navbar />

        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] bg-indigo-600/6 rounded-full blur-[140px] animate-blob" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/6 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        </div>

        <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24">

            {/* ── Hero ───────────────────────────────── */}
            <motion.div className="pt-16 pb-12 text-center"
                variants={fadeUp} initial="hidden" animate="show">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" /><span>Collaborative Project Management</span>
                </div>
                <h1 className="text-6xl font-extrabold font-['Outfit'] gradient-text mb-5 leading-tight">
                    GitManager
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    A full-stack project management platform built for software teams — combining <span className="text-white font-semibold">GitHub-native workflows</span>, sprint planning, real-time analytics, and rich task collaboration in one unified workspace.
                </p>
                <div className="mt-8 flex items-center justify-center space-x-4">
                    <Link to="/"
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                        <Target className="w-4 h-4" /><span>Open Dashboard</span>
                    </Link>
                    <a href="https://github.com/Shreemohanpalthya359/Collabarative-Project-Management-Tool-"
                        target="_blank" rel="noreferrer"
                        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-xl font-bold transition-all border border-gray-700">
                        <Github className="w-4 h-4" /><span>View Source</span>
                    </a>
                </div>
            </motion.div>

            {/* ── Divider ────────────────────────────── */}
            <motion.div className="border-t border-white/5 mb-16" variants={fadeUp} initial="hidden" animate="show" />

            {/* ── Features Grid ─────────────────────── */}
            <motion.section variants={fadeUp} initial="hidden" animate="show">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold font-['Outfit']">Features</h2>
                </div>

                <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    variants={staggerContainer(0.05, 0.02)} initial="hidden" animate="show">
                    {/* eslint-disable-next-line no-unused-vars */}
                    {FEATURES.map(({ icon: IconComp, color, title, desc }) => (
                        <motion.div key={title} variants={fadeUp}
                            whileHover={{ y: -5, boxShadow: '0 20px 50px rgba(99,102,241,0.12)' }}
                            className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${COLOUR[color]}`}>
                                <IconComp className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white text-lg mb-2 font-['Outfit']">{title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

            {/* ── Back link ─────────────────────────── */}
            <motion.div className="mt-16 text-center" variants={fadeUp} initial="hidden" animate="show">
                <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
                </Link>
            </motion.div>
        </main>
    </div>
);

export default About;
