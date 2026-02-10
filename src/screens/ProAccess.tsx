import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const ProAccess: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        // Load Tally embeds
        const script = document.createElement('script');
        script.src = 'https://tally.so/widgets/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleGoToDashboard = () => {
        // Mark onboarding as complete
        localStorage.setItem('onboarding_complete', 'true');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-dark-lighter to-background flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-1/4 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.3, 1, 1.3],
                        opacity: [0.4, 0.2, 0.4],
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180],
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-3xl w-full relative z-10"
            >
                <motion.h2
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl font-bold mb-4 text-center"
                >
                    <span className="gradient-text">Want </span>
                    <span className="gradient-text-primary">Pro features</span>
                    <span className="gradient-text">?</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05, duration: 0.2 }}
                    className="text-white/70 text-center mb-6 text-lg"
                >
                    Coming soon: Unlimited operations, full history, cloud storage, unlimited batch processing, Windows & Linux apps & more — from just <span className="text-primary font-semibold">$3.99/month</span>.
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="text-white/80 text-center mb-6 font-medium"
                >
                    🎉 Get early access:
                </motion.p>

                {/* Tally Form Embed */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.25 }}
                    className="mb-8 glass-strong rounded-2xl p-6 border border-primary/20 shadow-glow"
                >
                    <iframe
                        data-tally-src="https://tally.so/embed/jaP0KJ?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                        loading="lazy"
                        width="100%"
                        height="170"
                        frameBorder="0"
                        marginHeight={0}
                        marginWidth={0}
                        title="Waiting list"
                        className="rounded-xl"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    className="flex items-center justify-center gap-2 mb-8 text-sm text-white/60"
                >
                    <span className="text-primary">✨</span>
                    <span>We'll notify you when it's ready</span>
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.2 }}
                    className="flex justify-between items-center"
                >
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/choose-plan')}
                    >
                        ← Back
                    </Button>
                    <Button type="button" onClick={handleGoToDashboard}>
                        Go to Dashboard →
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};
