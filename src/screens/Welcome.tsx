import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-dark-lighter to-background flex flex-col items-center justify-center px-16 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.4, 0.3],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.1, 1, 1.1],
                        opacity: [0.4, 0.3, 0.4],
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl text-center relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="mb-8 flex justify-center"
                >
                    <motion.div
                        className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow-lg"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 2L2 7L12 12L22 7L12 2Z"
                                fill="#1d1d1d"
                                stroke="#1d1d1d"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 17L12 22L22 17"
                                stroke="#1d1d1d"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 12L12 17L22 12"
                                stroke="#1d1d1d"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="text-6xl font-bold mb-4"
                >
                    <span className="gradient-text">Welcome to </span>
                    <span className="gradient-text-primary">PDFGround</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.25 }}
                    className="glass rounded-2xl p-6 mb-12 border border-primary/20"
                >
                    <p className="text-xl text-white/90 leading-relaxed">
                        Your <span className="text-primary font-semibold">offline PDF toolkit</span> for complete privacy.<br />
                        Merge, split, compress, convert, and OCR PDFs<br />
                        without ever uploading your files to the cloud.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                        <span className="text-green-400">🔒</span>
                        <span>100% Offline & Private</span>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex justify-center"
                >
                    <Button onClick={() => navigate('/how-it-works')}>
                        Let's Start →
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};
