import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HistoryItem {
    id: string;
    fileName: string;
    action: string;
    timestamp: Date;
    size?: string;
}

interface FeatureSidebarProps {
    featureName: string;
    featureIcon: string;
    featureDescription: string;
    historyItems?: HistoryItem[];
    onDownload?: (item: HistoryItem) => void;
}

export const FeatureSidebar: React.FC<FeatureSidebarProps> = ({
    featureName,
    featureIcon,
    featureDescription,
    historyItems = [],
    onDownload,
}) => {
    const navigate = useNavigate();

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="fixed left-0 top-0 h-full w-80 bg-dark-lighter border-r border-stroke flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-stroke">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 mb-4 text-white/60 hover:text-primary transition-colors group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <div>
                        <h1 className="text-xl font-bold text-white">PDFGround</h1>
                        <p className="text-white/40 text-xs">Offline PDF Toolkit</p>
                    </div>
                </button>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{featureIcon}</div>
                        <div>
                            <h2 className="text-white font-semibold text-lg">{featureName}</h2>
                            <p className="text-white/60 text-xs">{featureDescription}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 font-medium text-sm">Recent Activity</h3>
                    {historyItems.length > 0 && (
                        <span className="text-primary text-xs">{historyItems.length} items</span>
                    )}
                </div>

                {historyItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3 opacity-20">📋</div>
                        <p className="text-white/40 text-sm">No recent activity</p>
                        <p className="text-white/30 text-xs mt-1">Your history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {historyItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-background/50 rounded-lg p-3 border border-stroke/50 hover:border-primary/30 transition-all group cursor-pointer"
                                onClick={() => onDownload?.(item)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <span className="text-primary text-sm">📄</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate group-hover:text-primary transition-colors">
                                            {item.fileName}
                                        </p>
                                        <p className="text-white/50 text-xs mt-0.5">{item.action}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-white/40 text-xs">{formatTime(item.timestamp)}</span>
                                            {item.size && (
                                                <>
                                                    <span className="text-white/20">•</span>
                                                    <span className="text-white/40 text-xs">{item.size}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80 transition-all text-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDownload?.(item);
                                        }}
                                    >
                                        ↓
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stroke">
                <button
                    onClick={() => navigate('/history')}
                    className="w-full py-2 px-4 bg-stroke/20 hover:bg-stroke/30 text-white/60 hover:text-white rounded-lg text-sm transition-colors"
                >
                    View All History →
                </button>
            </div>
        </div>
    );
};
