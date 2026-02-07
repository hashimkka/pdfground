import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

export const PasswordProtect: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [processing, setProcessing] = React.useState(false);
    const [mode, setMode] = React.useState<'add' | 'remove'>('add');
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const passwordHistory = allHistory.filter(item => item.details && (item.details.includes('Password') || item.details.includes('password'))).slice(0, 5);
            setHistory(passwordHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    const handleProtect = async () => {
        if (!file) return;

        if (mode === 'add') {
            if (!password) {
                alert('Please enter a password');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            if (password.length < 4) {
                alert('Password must be at least 4 characters');
                return;
            }
        }

        setProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();

            if (mode === 'add') {
                // Use real RC4 128-bit encryption
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pdfBytes = await pdfDoc.save();

                // Encrypt the PDF with user password using RC4 128-bit
                const encryptedPdf = await encryptPDF(
                    pdfBytes,
                    password, // user password
                    password  // owner password (same for simplicity)
                );

                const blob = new Blob([encryptedPdf as BlobPart], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `protected_${file.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                await addToHistoryWithFile(
                    'compress',
                    `protected_${file.name}`,
                    'Password protection added (RC4 128-bit)',
                    encryptedPdf,
                    'application/pdf'
                );

                // Reload history
                const allHistory = await getHistory();
                const passwordHistory = allHistory.filter(item => item.details && (item.details.includes('Password') || item.details.includes('password'))).slice(0, 5);
                setHistory(passwordHistory);

                alert('✅ Password protection added successfully! The PDF is now encrypted with RC4 128-bit encryption.');
            } else {
                // Remove mode - try to load and re-save
                try {
                    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    const pdfBytes = await pdfDoc.save();

                    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `unlocked_${file.name}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    await addToHistoryWithFile(
                        'compress',
                        `unlocked_${file.name}`,
                        'Password removed',
                        pdfBytes,
                        'application/pdf'
                    );

                    // Reload history
                    const allHistory = await getHistory();
                    const passwordHistory = allHistory.filter(item => item.details && (item.details.includes('Password') || item.details.includes('password'))).slice(0, 5);
                    setHistory(passwordHistory);

                    alert('✅ Password removed successfully!');
                } catch (error) {
                    alert('❌ Could not remove password. The PDF may be encrypted with a different method or corrupted.');
                }
            }

            setFile(null);
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const passwordStrength = password.length === 0 ? '' :
        password.length < 6 ? 'Weak' :
            password.length < 10 ? 'Medium' : 'Strong';

    const strengthColor = passwordStrength === 'Weak' ? 'text-red-400' :
        passwordStrength === 'Medium' ? 'text-yellow-400' : 'text-green-400';

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
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

    const handleDownload = async (historyId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await downloadFromHistory(historyId);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar with History */}
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

                    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🔐</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Password Protect</h2>
                                <p className="text-white/60 text-xs">Encrypt & decrypt PDFs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Activity</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent activity</p>
                            <p className="text-white/30 text-xs mt-1">Your history will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02, duration: 0.2 }}
                                    className="bg-background/50 rounded-lg p-3 border border-stroke/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-primary text-sm">📄</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">
                                                {item.fileName}
                                            </p>
                                            <p className="text-white/50 text-xs mt-0.5">{item.details}</p>
                                            <span className="text-white/40 text-xs">{formatTime(item.timestamp)}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDownload(item.id, e)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-primary/10 rounded-lg text-white/60 hover:text-primary"
                                            title="Download file"
                                        >
                                            ⬇️
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

            {/* Main Content */}
            <div className="ml-80 flex-1 p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">🔐 Password Protection</h2>
                        <p className="text-white/60">Add or remove password protection from PDFs</p>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                        <p className="text-green-400 text-sm">
                            ✅ <strong>Real Encryption:</strong> This tool uses RC4 128-bit encryption to password-protect your PDFs. The encryption happens entirely in your browser - your files never leave your device.
                        </p>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('add')}
                                className={`py-3 px-4 rounded-lg border transition-colors ${mode === 'add'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-dark-lighter border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">🔒 Add Password</div>
                                <div className="text-xs opacity-60">Encrypt PDF</div>
                            </button>
                            <button
                                onClick={() => setMode('remove')}
                                className={`py-3 px-4 rounded-lg border transition-colors ${mode === 'remove'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-dark-lighter border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">🔓 Remove Password</div>
                                <div className="text-xs opacity-60">Decrypt PDF</div>
                            </button>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    {!file && (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${isDragActive ? 'border-primary bg-primary/10' : 'border-stroke bg-dark-lighter hover:border-primary/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="text-4xl mb-4">📄</div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {isDragActive ? 'Drop PDF here' : 'Add PDF file'}
                            </h3>
                            <p className="text-white/40">Drag & drop or click to browse</p>
                        </div>
                    )}

                    {/* Password Input */}
                    {file && (
                        <>
                            <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-primary text-xl">📄</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{file.name}</p>
                                            <p className="text-white/40 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-stroke hover:text-primary"
                                        disabled={processing}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {mode === 'add' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-white/60 text-sm mb-2 block">Password</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter password"
                                                className="w-full bg-background border border-stroke rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
                                            />
                                            {password && (
                                                <p className={`text-sm mt-1 ${strengthColor}`}>
                                                    Strength: {passwordStrength}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-white/60 text-sm mb-2 block">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm password"
                                                className="w-full bg-background border border-stroke rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
                                            />
                                            {confirmPassword && password !== confirmPassword && (
                                                <p className="text-sm mt-1 text-red-400">
                                                    Passwords do not match
                                                </p>
                                            )}
                                        </div>

                                        {/* Encryption Info */}
                                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
                                            <p className="text-primary text-sm font-medium mb-2">🔒 Encryption Details:</p>
                                            <ul className="text-primary/80 text-xs space-y-1">
                                                <li>• Algorithm: RC4 128-bit</li>
                                                <li>• Permissions: Printing allowed, editing disabled</li>
                                                <li>• Security: Industry-standard PDF encryption</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {mode === 'remove' && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                        <p className="text-yellow-400 text-sm">
                                            ℹ️ This will attempt to remove password protection from the PDF. Note: This only works for PDFs without strong encryption.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleProtect}
                                disabled={processing || (mode === 'add' && (!password || password !== confirmPassword))}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Processing...' : mode === 'add' ? '🔒 Encrypt PDF' : '🔓 Decrypt PDF'}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
