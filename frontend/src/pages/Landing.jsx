import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
    GitBranch, BarChart2, Bell, Users, Clock, Paperclip,
    Zap, Shield, ArrowRight, Star, CheckCircle, Github,
    Target, Layers, Activity
} from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

/* ── helpers ──────────────────────────────── */
const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }
});

/* ── Animated mesh grid canvas ────────────── */
const MeshGrid = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let frame;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        const dots = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        }));
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
                if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
                dots.forEach(d2 => {
                    const dist = Math.hypot(d.x - d2.x, d.y - d2.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(d.x, d.y); ctx.lineTo(d2.x, d2.y); ctx.stroke();
                    }
                });
                ctx.beginPath();
                ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(139,92,246,0.35)'; ctx.fill();
            });
            frame = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ── Feature card ─────────────────────────── */
// eslint-disable-next-line no-unused-vars
const FeatureCard = ({ icon: IconComp, color, title, desc, delay }) => (
    <motion.div {...fade(delay)}
        className="group relative p-6 rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm hover:border-indigo-500/30 hover:bg-gray-900/60 transition-all duration-300 cursor-default">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <IconComp className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-white text-base mb-2 font-['Outfit']">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/3 to-purple-500/3 pointer-events-none" />
    </motion.div>
);

/* ── Stat pill ────────────────────────────── */
const StatPill = ({ val, label }) => (
    <div className="text-center px-8 py-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm">
        <div className="text-3xl font-extrabold font-['Outfit'] gradient-text">{val}</div>
        <div className="text-gray-500 text-xs uppercase tracking-widest mt-1">{label}</div>
    </div>
);

/* ── Fake dashboard screenshot ────────────── */
const DashboardMockup = () => (
    <div className="relative rounded-2xl border border-white/8 bg-gray-900/80 backdrop-blur-xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        {/* Title bar */}
        <div className="flex items-center space-x-2 px-4 py-3 bg-gray-950/80 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="flex-1 mx-4 h-5 bg-gray-800 rounded-full flex items-center px-3">
                <span className="text-gray-600 text-xs">app.gitmanager.io/dashboard</span>
            </div>
        </div>
        {/* Fake nav */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-gray-900/60">
            <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg" />
                <span className="text-xs font-bold text-white">GitManager</span>
            </div>
            <div className="flex space-x-4">
                {['Projects', 'Analytics', 'Sprints'].map(t => (
                    <div key={t} className="text-xs text-gray-500">{t}</div>
                ))}
            </div>
            <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-500/50" />
        </div>
        {/* Content */}
        <div className="p-5 space-y-4">
            <div className="text-lg font-bold font-['Outfit'] gradient-text">Your Projects</div>
            {/* Stat row */}
            <div className="grid grid-cols-4 gap-3">
                {[['2', 'Projects'], ['1', 'Active Repos'], ['4', 'Open Issues'], ['2', 'PRs']].map(([v, l]) => (
                    <div key={l} className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{l}</div>
                        <div className="text-2xl font-bold">{v}</div>
                    </div>
                ))}
            </div>
            {/* Project cards */}
            <div className="grid grid-cols-2 gap-3">
                {[{ n: 'GitManager', r: 'Shreemohanpalthya359/...', i: 3, p: 1 },
                { n: 'API Gateway', r: 'No repo linked', i: 0, p: 0 }].map(({ n, r, i, p }) => (
                    <div key={n} className="bg-gray-800/40 rounded-xl p-4 border border-white/5 hover:border-indigo-500/20 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-sm text-white font-['Outfit']">{n}</div>
                            <div className="w-7 h-7 bg-gray-700/60 rounded-lg flex items-center justify-center">
                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3 truncate">{r}</div>
                        <div className="flex items-center space-x-2 text-xs">
                            {i > 0 && <span className="text-amber-400 font-bold">{i} Issues</span>}
                            {p > 0 && <span className="text-emerald-400 font-bold">{p} PR</span>}
                            {i === 0 && p === 0 && <span className="text-gray-600">No GitHub data</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* ── Main Landing page ────────────────────── */
const Landing = () => {
    const FEATURES = [
        { icon: GitBranch, color: 'bg-indigo-600', title: 'GitHub Sync', desc: 'Live issues, pull requests, and commits pulled directly from your repos.', delay: 0 },
        { icon: BarChart2, color: 'bg-violet-600', title: 'Analytics', desc: 'Sprint velocity, burndown charts, and cumulative flow diagrams.', delay: 0.05 },
        { icon: Bell, color: 'bg-fuchsia-600', title: 'Notifications', desc: 'Real-time in-app alerts for mentions, assignments, and status changes.', delay: 0.1 },
        { icon: Users, color: 'bg-blue-600', title: 'Team Collaboration', desc: 'Invite members via shareable links and assign granular roles.', delay: 0.15 },
        { icon: Clock, color: 'bg-emerald-600', title: 'Time Tracker & Stopwatch', desc: 'Live stopwatch per task, manual log entries, and total tracked hours.', delay: 0.2 },
        { icon: Paperclip, color: 'bg-amber-600', title: 'File Attachments', desc: 'Drag-and-drop uploads per task with inline preview and download.', delay: 0.25 },
        { icon: Zap, color: 'bg-rose-600', title: 'Sprint Management', desc: 'Kanban board, sprint planning, and backlog management in one view.', delay: 0.3 },
        { icon: Shield, color: 'bg-teal-600', title: 'Recycle Bin', desc: 'Accidentally deleted a project? Restore it from the bin in one click.', delay: 0.35 },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

            {/* ── Ambient background ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[160px]" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-[120px]" />
            </div>

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-extrabold text-white text-lg font-['Outfit']">GitManager</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <Link to="/about" className="hover:text-white transition-colors">About</Link>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">Sign In</Link>
                        <Link to="/register"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
                <MeshGrid />

                {/* Badge */}
                <motion.div {...fade(0)} className="mb-6 inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Open-source collaborative project manager</span>
                </motion.div>

                {/* Headline */}
                <motion.h1 {...fade(0.08)} className="text-5xl sm:text-6xl md:text-7xl font-extrabold font-['Outfit'] leading-tight mb-6 max-w-4xl">
                    <span className="gradient-text">Ship faster</span>
                    <br />
                    <span className="text-white">with GitHub-native</span>
                    <br />
                    <span className="text-white">project management</span>
                </motion.h1>

                {/* Sub */}
                <motion.p {...fade(0.15)} className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
                    GitManager integrates directly with your GitHub repositories — sync issues, track pull requests,
                    manage sprints, and monitor team velocity all in one place.
                </motion.p>

                {/* CTAs */}
                <motion.div {...fade(0.22)} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                    <Link to="/register"
                        className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-base shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                        <span>Start for free</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/login"
                        className="flex items-center space-x-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-semibold text-base transition-all hover:scale-105 active:scale-95">
                        <Github className="w-5 h-5" />
                        <span>Sign in</span>
                    </Link>
                </motion.div>

                {/* Stats */}
                <motion.div {...fade(0.3)} className="flex flex-wrap justify-center gap-4 mb-16">
                    <StatPill val="100%" label="Open Source" />
                    <StatPill val="8+" label="Core Features" />
                    <StatPill val="∞" label="Projects" />
                </motion.div>

                {/* Dashboard mockup */}
                <motion.div {...fade(0.38)} className="w-full max-w-4xl mx-auto relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl blur opacity-20 animate-pulse" />
                    <DashboardMockup />
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="relative py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div {...fade(0)} className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Everything you need</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold font-['Outfit'] text-white mb-4">
                            Built for teams that <span className="gradient-text">ship</span>
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto text-lg">
                            From GitHub integration to time tracking — every tool your team needs to move fast.
                        </p>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fade(0)} className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold font-['Outfit'] text-white mb-3">
                            Get started in <span className="gradient-text">minutes</span>
                        </h2>
                        <p className="text-gray-500 text-lg">No complex setup. Just create an account and go.</p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { n: '01', title: 'Create your workspace', desc: 'Sign up free and create your first project in under 60 seconds.' },
                            { n: '02', title: 'Connect your repo', desc: 'Add your GitHub repo URL to instantly sync issues and pull requests.' },
                            { n: '03', title: 'Invite your team', desc: 'Share an invite link. Your team can join even without an existing account.' },
                        ].map(({ n, title, desc }, i) => (
                            <motion.div key={n} {...fade(i * 0.1)} className="relative pl-6 border-l border-indigo-500/30">
                                <div className="text-5xl font-extrabold text-indigo-500/20 font-['Outfit'] mb-3">{n}</div>
                                <h3 className="font-bold text-white text-base mb-2 font-['Outfit']">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div {...fade(0)} className="relative rounded-3xl overflow-hidden p-12 text-center border border-indigo-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-fuchsia-600/10 pointer-events-none" />
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl font-extrabold font-['Outfit'] mb-4 text-white">
                                Ready to ship <span className="gradient-text">faster?</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                                Join teams that use GitManager to stay in sync, move faster, and never lose track of what matters.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/register"
                                    className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-500/25 transition-all hover:scale-105">
                                    <span>Create free account</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-gray-500">
                                {['No credit card required', 'Free forever', 'Open source'].map(t => (
                                    <div key={t} className="flex items-center space-x-1.5">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg" />
                        <span className="font-bold text-white font-['Outfit']">GitManager</span>
                    </div>
                    <p className="text-gray-600 text-sm">© 2026 GitManager. Built with ❤️ for developers.</p>
                    <div className="flex space-x-6 text-sm text-gray-500">
                        <Link to="/about" className="hover:text-white transition-colors">About</Link>
                        <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                        <Link to="/register" className="hover:text-white transition-colors">Register</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
