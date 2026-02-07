import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const Tutorial: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 py-16">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-3xl w-full"
            >
                <h2 className="text-3xl font-semibold text-white mb-8 text-center">
                    PDFGround tutorial:
                </h2>

                {/* Video Placeholder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="bg-gray-300 rounded-xl w-full aspect-video flex items-center justify-center mb-6"
                >
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="white"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Video</p>
                    </div>
                </motion.div>

                {/* Instruction Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="text-center text-white/70 mb-12"
                >
                    Drag & drop your files → Choose a tool (Merge, Split, Compress, Convert, OCR) → Get instant results, 100% offline.
                </motion.p>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex justify-between items-center"
                >
                    <Button variant="secondary" onClick={() => navigate('/pro-access')}>
                        Back
                    </Button>
                    <Button onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};
