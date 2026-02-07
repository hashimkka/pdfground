import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory, deleteHistoryItem, getOperationIcon, getOperationLabel, downloadFromHistory, formatFileSize, type HistoryItem } from '../utils/historyStorage';

export const History: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = React.useState<HistoryItem[]>([]);
    const [filter, setFilter] = React.useState<string>('all');

    React.useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await getHistory();
        setHistory(data);
    };

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            await clearHistory();
            loadHistory();
        }
    };

    const handleDeleteItem = async (id: string) => {
        await deleteHistoryItem(id);
        loadHistory();
    };

    const handleDownload = async (id: string) => {
        await downloadFromHistory(id);
    };

    const filteredHistory = filter === 'all'
        ? history
        : history.filter(item => item.operation === filter);

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
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-dark-lighter border-r border-stroke p-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mb-8 text-white/60 hover:text-primary transition-colors">
                    <span>←</span>
                    <div>
                        <h1 className="text-2xl font-bold text-white">PDFGround</h1>
                        <p className="text-white/40 text-sm">Offline PDF Toolkit</p>
                    </div>
                </button>
            </div>

            {/* Main Content */}
            <div className="ml-64 flex-1 p-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">📜 History</h2>
                            <p className="text-white/60">Track all your PDF operations</p>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="px-4 py-2 bg-stroke/20 text-white/60 rounded-lg hover:bg-stroke/30 hover:text-white transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div className="bg-dark-lighter border border-stroke rounded-2xl p-4 mb-6">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'merge', 'split', 'compress', 'convert', 'ocr', 'reorder', 'delete'].map((op) => (
                                <button
                                    key={op}
                                    onClick={() => setFilter(op)}
                                    className={`px-4 py-2 rounded-lg border transition-colors ${filter === op
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background border-stroke text-white/60 hover:border-primary/50'
                                        }`}
                                >
                                    {op === 'all' ? 'All' : getOperationLabel(op as HistoryItem['operation'])}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* History List */}
                    {filteredHistory.length === 0 ? (
                        <div className="bg-dark-lighter border border-stroke rounded-2xl p-12 text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No history yet</h3>
                            <p className="text-white/40">
                                {filter === 'all'
                                    ? 'Start using PDF tools to see your operation history here'
                                    : `No ${getOperationLabel(filter as HistoryItem['operation'])} operations found`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02, duration: 0.2 }}
                                    className="bg-dark-lighter border border-stroke rounded-xl p-4 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                                                {getOperationIcon(item.operation)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-white font-medium">{item.fileName}</h3>
                                                    <span className="text-xs text-white/40 bg-background px-2 py-1 rounded">
                                                        {getOperationLabel(item.operation)}
                                                    </span>
                                                    {item.fileSize && (
                                                        <span className="text-xs text-white/40 bg-background px-2 py-1 rounded">
                                                            {formatFileSize(item.fileSize)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-white/40">
                                                    <span>{formatDate(item.timestamp)}</span>
                                                    {item.details && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{item.details}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.fileId && (
                                                <button
                                                    onClick={() => handleDownload(item.id)}
                                                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                                    title="Download file"
                                                >
                                                    ⬇️
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="px-3 py-2 text-stroke hover:text-primary transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    {history.length > 0 && (
                        <div className="mt-8 bg-dark-lighter border border-stroke rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-4">Statistics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{history.length}</div>
                                    <div className="text-sm text-white/60">Total Operations</div>
                                </div>
                                {['merge', 'split', 'compress'].map((op) => {
                                    const count = history.filter(item => item.operation === op).length;
                                    return count > 0 ? (
                                        <div key={op} className="text-center">
                                            <div className="text-2xl font-bold text-primary">{count}</div>
                                            <div className="text-sm text-white/60">{getOperationLabel(op as HistoryItem['operation'])}</div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
