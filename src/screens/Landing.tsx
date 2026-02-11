import { useNavigate } from 'react-router-dom';
import pdfgroundLogo from '../assets/pdfground.svg';

export const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#1d1d1d] text-white font-['Outfit',sans-serif] overflow-x-hidden">
            {/* Background Blobs */}
            <div className="fixed top-[10%] left-[10%] w-96 h-96 bg-[#16ffc1] rounded-full blur-[80px] opacity-30 pointer-events-none animate-float" />
            <div className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#00d4aa] rounded-full blur-[80px] opacity-30 pointer-events-none" style={{ animation: 'float 8s ease-in-out infinite reverse' }} />
            <div className="fixed top-1/2 left-1/2 w-[600px] h-[600px] bg-[#7c3aed] rounded-full blur-[80px] opacity-30 pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ animation: 'float 10s ease-in-out infinite' }} />

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden text-center">
                <div className="relative z-10 max-w-[900px] px-6">
                    {/* Logo */}
                    <div className="flex justify-center items-center mb-4">
                        <div className="w-20 h-20 animate-float">
                            <img src={pdfgroundLogo} alt="PDFGround Logo" className="w-full h-full" />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-[rgba(22,255,193,0.1)] border border-[rgba(22,255,193,0.3)] px-6 py-2 rounded-full text-sm font-medium mb-8">
                        <span>🔒</span>
                        <span>100% Free • Open Source • Works Offline</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                        <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">PDFGround</span>
                        <br />
                        <span className="bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] bg-clip-text text-transparent">Your Offline PDF Toolkit</span>
                    </h1>

                    {/* Description */}
                    <p className="text-xl max-w-[700px] mx-auto mb-10 text-white/90">
                        An all-in-one, privacy-friendly PDF editor that works completely offline.
                        Merge, split, compress, convert, and OCR PDFs without ever uploading your files.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex justify-center items-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] text-[#1d1d1d] px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(22,255,193,0.4)]"
                            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                        >
                            Get Started for Free
                        </button>
                        <a
                            href="https://github.com/hashimkka/pdfground"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-white/15 hover:border-[#16ffc1]"
                        >
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* Why PDFGround Section */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12">
                        <span className="bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] bg-clip-text text-transparent">Why PDFGround?</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: '✓', title: 'Fully Free & Open Source', desc: 'MIT licensed forever. No hidden costs, no premium tiers for basic features.' },
                            { icon: '🔒', title: '100% Offline', desc: 'Works completely offline — no file uploads, no internet required. Your data stays on your device.' },
                            { icon: '⚡', title: 'Fast & Lightweight', desc: 'Built with speed, privacy, and usability in mind. Runs on any PC or laptop.' },
                            { icon: '🚫', title: 'No Ads or Tracking', desc: 'Zero advertisements, no analytics, no telemetry. Pure functionality.' },
                            { icon: '🎯', title: 'No Limitations', desc: 'Unlimited file size, unlimited conversions, unlimited everything.' },
                            { icon: '🌍', title: 'Privacy-First', desc: 'No server uploads, no cloud storage. Complete control over your documents.' },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-[rgba(42,42,42,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(22,255,193,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:bg-[rgba(42,42,42,0.8)]"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-[0_8px_24px_rgba(22,255,193,0.25)] transition-all group-hover:scale-110">
                                    {feature.icon}
                                </div>
                                <h3 className="text-white font-semibold text-xl mb-3">{feature.title}</h3>
                                <p className="text-white/80 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contribute & Support Section */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12">
                        <span className="bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] bg-clip-text text-transparent">Contribute & Support</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[rgba(42,42,42,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(22,255,193,0.4)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-[0_8px_24px_rgba(22,255,193,0.25)]">
                                📂
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-3">View on GitHub</h3>
                            <p className="text-white/80 mb-6">Explore the source code, star the repo, and contribute to the project.</p>
                            <a
                                href="https://github.com/hashimkka/pdfground"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/15 hover:border-[#16ffc1]"
                            >
                                GitHub Repo
                            </a>
                        </div>

                        <div className="bg-[rgba(42,42,42,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(22,255,193,0.4)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-[0_8px_24px_rgba(22,255,193,0.25)]">
                                🐛
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-3">Report Issues</h3>
                            <p className="text-white/80 mb-6">Found a bug or have a feature request? Let us know on GitHub.</p>
                            <a
                                href="https://github.com/hashimkka/pdfground/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/15 hover:border-[#16ffc1]"
                            >
                                Report Issue
                            </a>
                        </div>

                        <div className="bg-[rgba(42,42,42,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(22,255,193,0.4)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-[0_8px_24px_rgba(22,255,193,0.25)]">
                                💬
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-3">Join Waitlist</h3>
                            <p className="text-white/80 mb-6">Get notified about new features and updates.</p>
                            <a
                                href="https://tally.so/r/jaP0KJ"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/15 hover:border-[#16ffc1]"
                            >
                                Join Waitlist
                            </a>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-lg text-white/80">
                            🔧 <strong>Developers welcome!</strong> Built with React + Vite
                        </p>
                    </div>
                </div>
            </section>

            {/* Desktop App Section */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-[rgba(42,42,42,0.95)] backdrop-blur-3xl border-2 border-[rgba(22,255,193,0.15)] rounded-3xl p-14 text-center">
                        <div className="inline-flex items-center gap-2 bg-[rgba(22,255,193,0.1)] border border-[rgba(22,255,193,0.3)] px-6 py-2 rounded-full text-sm font-medium mb-6">
                            <span>🚀</span>
                            <span>Coming Soon</span>
                        </div>

                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] bg-clip-text text-transparent">Desktop App</span>
                        </h2>

                        <p className="text-lg text-white/80 mb-8">
                            Desktop app support will be available soon for Windows, macOS, and Linux.
                        </p>

                        <div className="flex justify-center items-center gap-6 flex-wrap mb-8">
                            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-2xl">🪟</span>
                                <span className="font-medium">Windows</span>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-2xl">🍎</span>
                                <span className="font-medium">macOS</span>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-2xl">🐧</span>
                                <span className="font-medium">Linux</span>
                            </div>
                        </div>

                        <a
                            href="https://tally.so/r/jaP0KJ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] text-[#1d1d1d] px-8 py-4 rounded-xl font-semibold mb-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(22,255,193,0.4)]"
                        >
                            Get Notified When Ready
                        </a>

                        <p className="text-sm text-white/50 mt-4">
                            Meanwhile, use PDFGround as a web app • 100% Free • No Installation Required
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-[rgba(20,20,20,0.95)] border-t border-white/10 py-12 px-6 mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold bg-gradient-to-br from-[#16ffc1] to-[#00d4aa] bg-clip-text text-transparent mb-2">PDFGround</h3>
                        <p className="text-white/60">Open Source PDF Toolkit</p>
                    </div>

                    <div className="flex justify-center items-center gap-6 flex-wrap mb-8 text-sm">
                        <a href="https://github.com/hashimkka/pdfground/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-[#16ffc1] hover:text-[#00d4aa] hover:underline transition-colors">MIT License</a>
                        <span className="text-white/30">•</span>
                        <a href="https://github.com/hashimkka/pdfground" target="_blank" rel="noopener noreferrer" className="text-[#16ffc1] hover:text-[#00d4aa] hover:underline transition-colors">GitHub</a>
                        <span className="text-white/30">•</span>
                        <a href="https://github.com/hashimkka/pdfground/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-[#16ffc1] hover:text-[#00d4aa] hover:underline transition-colors">Contributing</a>
                        <span className="text-white/30">•</span>
                        <a href="https://tally.so/r/jaP0KJ" target="_blank" rel="noopener noreferrer" className="text-[#16ffc1] hover:text-[#00d4aa] hover:underline transition-colors">Contact</a>
                    </div>

                    <div className="text-center pt-8 border-t border-white/10 text-white/50 text-sm">
                        <p>PDFGround © 2026 — Made with ❤️ for privacy and freedom</p>
                        <p className="mt-2">Built with React + Vite • 100% Open Source</p>
                    </div>
                </div>
            </footer>

            {/* Keyframes for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(22, 255, 193, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(22, 255, 193, 0.6); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
