import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    result: string;
    ocrText: string;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
    isOpen,
    onClose,
    result,
    ocrText,
}) => {
    const [selectedAction, setSelectedAction] = React.useState('Explain');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-8 right-8 w-96 bg-dark-lighter border border-stroke rounded-2xl shadow-2xl p-6 z-50"
                >
                    <div className="flex justify-between items-center mb-4">
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="bg-background text-primary border border-stroke rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                        >
                            <option>Explain</option>
                            <option>Fix</option>
                            <option>Summarize</option>
                        </select>
                        <button
                            onClick={onClose}
                            className="text-stroke hover:text-primary transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="bg-background rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        <p className="text-sm text-white/90">{result}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(result)}
                            className="flex-1 bg-primary/10 text-primary border border-primary rounded-lg py-2 text-sm hover:bg-primary/20 transition-colors"
                        >
                            Copy Result
                        </button>
                        <button
                            onClick={() => copyToClipboard(ocrText)}
                            className="flex-1 bg-stroke/10 text-stroke border border-stroke rounded-lg py-2 text-sm hover:bg-stroke/20 transition-colors"
                        >
                            Copy OCR
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
