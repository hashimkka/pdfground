import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const ChoosePlan: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPlan] = React.useState<'free' | 'paid'>('free'); // Always free, paid is disabled

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-dark-lighter to-background flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -50, 0],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl w-full relative z-10"
            >
                <h2 className="text-4xl font-bold mb-4 text-center">
                    <span className="gradient-text">Choose your </span>
                    <span className="gradient-text-primary">plan</span>
                </h2>
                <p className="text-center text-white/60 mb-12">Select the perfect plan for your needs</p>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        className="relative group"
                    >
                        <div className="glass-strong border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 cursor-default h-full hover:shadow-glow-lg transition-all duration-300">
                            {/* Popular Badge */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-dark text-background text-sm font-bold px-6 py-2 rounded-full shadow-glow">
                                ⭐ Recommended
                            </div>

                            <div className="flex items-center gap-3 mb-4 mt-4">
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'free' ? 'border-primary bg-primary/20' : 'border-stroke'
                                        }`}
                                >
                                    <div className="w-3 h-3 rounded-full bg-primary shadow-glow"></div>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Free</h3>
                            </div>

                            <div className="mb-4">
                                <div className="text-4xl font-bold text-primary mb-1">$0</div>
                                <div className="text-white/60 text-sm">Forever free</div>
                            </div>

                            <ul className="space-y-2 text-white/80 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-lg">✓</span>
                                    <span>All Core PDF Tools</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-lg">✓</span>
                                    <span>Up to 10 operations/day</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-lg">✓</span>
                                    <span>Last 10 files in history</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-lg">✓</span>
                                    <span>Basic batch processing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-lg">✓</span>
                                    <span className="font-semibold">100% offline & private</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.25 }}
                        className="relative group"
                    >
                        <div className="glass border-2 border-stroke/30 rounded-2xl p-6 cursor-not-allowed opacity-60 relative h-full">
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                                Coming Soon
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'paid' ? 'border-primary' : 'border-stroke'
                                        }`}
                                >
                                </div>
                                <h3 className="text-2xl font-bold text-white/50">Pro</h3>
                            </div>

                            <div className="mb-4">
                                <div className="text-4xl font-bold text-white/40 mb-1">$2.9</div>
                                <div className="text-white/30 text-sm">per month</div>
                            </div>

                            <ul className="space-y-2 text-white/40 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-stroke mt-0.5 text-lg">✓</span>
                                    <span><strong>Unlimited</strong> daily operations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-stroke mt-0.5 text-lg">✓</span>
                                    <span><strong>Full history</strong> access</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-stroke mt-0.5 text-lg">✓</span>
                                    <span><strong>Cloud storage</strong> & sync</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-stroke mt-0.5 text-lg">✓</span>
                                    <span><strong>Unlimited</strong> batch processing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-stroke mt-0.5 text-lg">✓</span>
                                    <span>Priority support</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex justify-between items-center"
                >
                    <Button variant="secondary" onClick={() => navigate('/how-it-works')}>
                        ← Back
                    </Button>
                    <Button onClick={() => navigate('/pro-access')}>
                        Next →
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};
