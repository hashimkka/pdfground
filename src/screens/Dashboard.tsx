import pdfgroundLogo from '../assets/pdfground.svg';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getHistory, type HistoryItem, getOperationIcon } from '../utils/historyStorage';


interface PDFTool {
    id: string;
    name: string;
    description: string;
    icon: string;
    route: string;
    category: 'basic' | 'optimization' | 'utility';
    gradient: string;
}

const tools: PDFTool[] = [
    { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDFs', icon: '📑', route: '/merge', category: 'basic', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'split', name: 'Split PDF', description: 'Split by page range', icon: '✂️', route: '/split', category: 'basic', gradient: 'from-purple-500 to-pink-500' },
    { id: 'compress', name: 'Compress', description: 'Reduce file size', icon: '📉', route: '/compress', category: 'optimization', gradient: 'from-green-500 to-emerald-500' },
    { id: 'extract', name: 'Extract Pages', description: 'Extract to new PDF', icon: '📄', route: '/extract', category: 'basic', gradient: 'from-teal-500 to-cyan-500' },
    { id: 'export', name: 'Export PDF', description: 'To text/PNG/JPG', icon: '🧾', route: '/export', category: 'optimization', gradient: 'from-violet-500 to-purple-500' },
    { id: 'convert', name: 'Image to PDF', description: 'Convert images', icon: '🔄', route: '/convert', category: 'optimization', gradient: 'from-orange-500 to-red-500' },
    { id: 'password', name: 'Password Protect', description: 'Add/remove password', icon: '🔐', route: '/password', category: 'utility', gradient: 'from-red-500 to-orange-500' },
    { id: 'batch', name: 'Batch Process', description: 'Merge/compress many', icon: '🔁', route: '/batch', category: 'utility', gradient: 'from-fuchsia-500 to-pink-500' },
    { id: 'ocr', name: 'OCR', description: 'Extract text', icon: '🔍', route: '/ocr', category: 'utility', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'reorder', name: 'Reorder/Rotate', description: 'Reorder & rotate', icon: '🔀', route: '/reorder', category: 'basic', gradient: 'from-indigo-500 to-blue-500' },
    { id: 'delete', name: 'Delete Pages', description: 'Remove pages', icon: '🗑️', route: '/delete', category: 'basic', gradient: 'from-red-500 to-rose-500' },
    { id: 'history', name: 'History', description: 'View operations', icon: '📜', route: '/history', category: 'utility', gradient: 'from-slate-500 to-gray-500' },
];

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [history, setHistory] = React.useState<HistoryItem[]>([]);

    React.useEffect(() => {
        const loadHistory = async () => {
            const data = await getHistory();
            setHistory(data);
        };
        loadHistory();
    }, []);

    // Load Tally feedback form script
    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://tally.so/widgets/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Filter tools based on search
    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get recent works (last 5)
    const recentWorks = history.slice(0, 5);

    // Calculate metrics
    const totalOperations = history.length;
    const mostUsedTool = history.length > 0
        ? history.reduce((acc, item) => {
            acc[item.operation] = (acc[item.operation] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
        : {};
    const mostUsed = Object.entries(mostUsedTool).sort((a, b) => b[1] - a[1])[0];

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-dark-lighter to-background">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-dark-lighter/80 backdrop-blur-xl border-r border-stroke/50 p-6 z-10">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src={pdfgroundLogo} alt="PDFGround Logo" className="w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">PDFGround</h1>
                            <p className="text-white/40 text-xs">Offline PDF Toolkit</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3 mb-6">
                    <div
                        className="bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-4"
                    >
                        <div className="text-primary/60 text-xs mb-1">Total Operations</div>
                        <div className="text-2xl font-bold text-white">{totalOperations}</div>
                    </div>

                    <div
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
                    >
                        <div className="text-green-400/60 text-xs mb-1">Tools Available</div>
                        <div className="text-2xl font-bold text-white">{tools.length}</div>
                    </div>

                    {mostUsed && (
                        <div
                            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4"
                        >
                            <div className="text-purple-400/60 text-xs mb-1">Most Used</div>
                            <div className="text-sm font-semibold text-white capitalize">{mostUsed[0]}</div>
                        </div>
                    )}
                </div>

                {/* Privacy Badge */}
                <div
                    className="mt-auto pt-6 border-t border-stroke/30"
                >
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="text-green-400">🔒</span>
                        <span>100% Offline & Private</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                        <p
                            className="text-white/60"
                        >
                            Choose a tool to get started with your PDF operations
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div
                        className="mb-8"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="🔍 Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-dark-lighter/80 backdrop-blur-xl border border-stroke/50 rounded-2xl px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Tools Grid */}
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold text-white mb-4">PDF Tools</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredTools.map((tool) => (
                                <div
                                    key={tool.id}
                                    onClick={() => {

                                        navigate(tool.route);
                                    }}
                                    className="group cursor-pointer transition-transform hover:scale-105"
                                >
                                    <div className="relative bg-dark-lighter/80 backdrop-blur-xl border border-stroke/50 rounded-2xl p-6 overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                                        {/* Gradient Background */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                        {/* Icon */}
                                        <div className="relative mb-4">
                                            <div className={`w-14 h-14 bg-gradient-to-br ${tool.gradient} rounded-xl flex items-center justify-center text-3xl shadow-lg`}>
                                                {tool.icon}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative">
                                            <h3 className="text-white font-semibold mb-1 group-hover:text-primary transition-colors">
                                                {tool.name}
                                            </h3>
                                            <p className="text-white/40 text-sm">
                                                {tool.description}
                                            </p>
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className="absolute top-4 right-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                            →
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Works */}
                    {recentWorks.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">Recent Works</h3>
                            <div className="bg-dark-lighter/80 backdrop-blur-xl border border-stroke/50 rounded-2xl p-6">
                                <div className="space-y-3">
                                    {recentWorks.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-background/50 transition-colors group cursor-pointer"
                                        >
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                {getOperationIcon(item.operation)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{item.fileName}</p>
                                                <p className="text-white/40 text-sm">{item.details}</p>
                                            </div>
                                            <div className="text-white/40 text-sm whitespace-nowrap">
                                                {formatDate(item.timestamp)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Pro Access Button */}
            <button
                onClick={() => navigate('/pro-access')}
                className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-glow hover:shadow-glow-lg transition-all hover:scale-105 flex items-center gap-2 z-50"
            >
                <span className="text-xl">⭐</span>
                <span className="font-semibold">Upgrade to Pro</span>
            </button>

            {/* Floating Feedback Button */}
            <button
                data-tally-open="XxWxaO"
                data-tally-emoji-text="👋"
                data-tally-emoji-animation="wave"
                className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-full shadow-glow hover:shadow-glow-lg transition-all hover:scale-105 flex items-center gap-2 z-50"
            >
                <span className="text-xl">💬</span>
                <span className="font-semibold">Feedback</span>
            </button>
        </div>
    );
};
