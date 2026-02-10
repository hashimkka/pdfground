import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

const steps = [
    {
        number: '1',
        title: 'Upload your files',
        description: 'Drag and drop PDFs or images into the app.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        number: '2',
        title: 'Choose a tool',
        description: 'Select Merge, Split, Compress, Convert, or OCR.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        number: '3',
        title: 'Process & download',
        description: 'Get your processed file instantly, 100% offline.',
        gradient: 'from-green-500 to-emerald-500',
    },
];

export const HowItWorks: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-dark-lighter to-background flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 9, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.3, 1, 1.3],
                        opacity: [0.4, 0.2, 0.4],
                    }}
                    transition={{ duration: 11, repeat: Infinity }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-5xl w-full relative z-10"
            >
                <h2 className="text-4xl font-bold text-center mb-4">
                    <span className="gradient-text">How to use </span>
                    <span className="gradient-text-primary">PDFGround</span>
                </h2>
                <p className="text-center text-white/60 mb-16">Follow these simple steps to get started</p>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + index * 0.05, duration: 0.25 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="relative group"
                        >
                            <div className="glass-strong rounded-2xl p-8 h-full border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Number Badge */}
                                    <div className="flex justify-center mb-4">
                                        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.gradient} text-white font-bold text-2xl rounded-xl shadow-lg`}>
                                            {step.number}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold text-white mb-3 text-center group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-white/70 text-center leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Connection Line (except for last item) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    className="flex justify-between items-center"
                >
                    <Button variant="secondary" onClick={() => navigate('/')}>
                        ← Back
                    </Button>
                    <Button onClick={() => navigate('/choose-plan')}>
                        Next →
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};
