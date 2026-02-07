import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

// Configure PDF.js worker - use local worker to avoid Vite dynamic import issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const OCRTool: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [processing, setProcessing] = React.useState(false);
    const [extractedText, setExtractedText] = React.useState('');
    const [progress, setProgress] = React.useState(0);
    const [language, setLanguage] = React.useState('eng');
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const ocrHistory = allHistory.filter(item => item.operation === 'ocr').slice(0, 5);
            setHistory(ocrHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0]);
        setExtractedText('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
    });

    const performOCR = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const worker = await createWorker(language, 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            let fullText = '';

            if (file.type === 'application/pdf') {
                // Process PDF
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    if (!context) continue;

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({ canvasContext: context, viewport }).promise;

                    const imageData = canvas.toDataURL('image/png');
                    const { data } = await worker.recognize(imageData);
                    fullText += `\n--- Page ${i} ---\n${data.text}\n`;
                }
            } else {
                // Process image
                const { data } = await worker.recognize(file);
                fullText = data.text;
            }

            setExtractedText(fullText);
            await worker.terminate();

            // Add to history
            await addToHistoryWithFile(
                'ocr',
                file.name,
                `Extracted text (${language})`,
                new TextEncoder().encode(fullText),
                'text/plain'
            );

            // Reload history
            const allHistory = await getHistory();
            const ocrHistory = allHistory.filter(item => item.operation === 'ocr').slice(0, 5);
            setHistory(ocrHistory);
        } catch (error) {
            console.error('Error performing OCR:', error);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
    };

    const downloadAsText = () => {
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocr_${file?.name.split('.')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTime = (timestamp: number) => {
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

                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🔍</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">OCR Tool</h2>
                                <p className="text-white/60 text-xs">Extract text from files</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Extractions</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent extractions</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">🔍 OCR Tool</h2>
                        <p className="text-white/60">Extract text from scanned PDFs and images</p>
                    </div>

                    {/* Language Selector */}
                    <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                        <label className="text-white/60 text-sm mb-3 block">OCR Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-background border border-stroke rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                        >
                            <option value="eng">English</option>
                            <option value="spa">Spanish</option>
                            <option value="fra">French</option>
                            <option value="deu">German</option>
                            <option value="chi_sim">Chinese (Simplified)</option>
                            <option value="jpn">Japanese</option>
                            <option value="ara">Arabic</option>
                        </select>
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
                                {isDragActive ? 'Drop file here' : 'Add PDF or Image'}
                            </h3>
                            <p className="text-white/40">Drag & drop or click to browse</p>
                        </div>
                    )}

                    {/* File Info */}
                    {file && !extractedText && (
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
                                <button onClick={() => setFile(null)} className="text-stroke hover:text-primary">
                                    ✕
                                </button>
                            </div>

                            {processing && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-white/60 mb-2">
                                        <span>Processing...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-stroke/30 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={performOCR}
                                disabled={processing}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Extracting Text...' : 'Extract Text'}
                            </button>
                        </div>
                    )}

                    {/* Extracted Text */}
                    {extractedText && (
                        <div className="bg-dark-lighter border border-stroke rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-lg font-semibold">Extracted Text</h3>
                                <button onClick={() => { setFile(null); setExtractedText(''); }} className="text-white/60 hover:text-primary text-sm">
                                    Process Another File
                                </button>
                            </div>

                            <div className="bg-background rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                                <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono">{extractedText}</pre>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 bg-primary/10 text-primary border border-primary rounded-lg py-3 hover:bg-primary/20 transition-colors"
                                >
                                    Copy to Clipboard
                                </button>
                                <button
                                    onClick={downloadAsText}
                                    className="flex-1 bg-stroke/10 text-stroke border border-stroke rounded-lg py-3 hover:bg-stroke/20 transition-colors"
                                >
                                    Download as .txt
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
