import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

export const SplitPDF: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [pageCount, setPageCount] = React.useState(0);
    const [splitMode, setSplitMode] = React.useState<'range' | 'individual'>('range');
    const [startPage, setStartPage] = React.useState(1);
    const [endPage, setEndPage] = React.useState(1);
    const [splitting, setSplitting] = React.useState(false);
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const splitHistory = allHistory.filter(item => item.operation === 'split').slice(0, 5);
            setHistory(splitHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles[0];
        setFile(pdfFile);

        // Get page count
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const count = pdf.getPageCount();
        setPageCount(count);
        setEndPage(count);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    const splitPDF = async () => {
        if (!file) return;

        setSplitting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            if (splitMode === 'range') {
                const newPdf = await PDFDocument.create();
                const pages = await newPdf.copyPages(
                    pdf,
                    Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i)
                );
                pages.forEach((page) => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `split_pages_${startPage}-${endPage}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Add to history with file
                await addToHistoryWithFile(
                    'split',
                    `split_pages_${startPage}-${endPage}.pdf`,
                    `Pages ${startPage}-${endPage} extracted`,
                    pdfBytes,
                    'application/pdf'
                );
            } else {
                // Split into individual pages
                for (let i = 0; i < pdf.getPageCount(); i++) {
                    const newPdf = await PDFDocument.create();
                    const [page] = await newPdf.copyPages(pdf, [i]);
                    newPdf.addPage(page);

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `page_${i + 1}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    // Add delay to prevent browser blocking multiple downloads
                    await new Promise(resolve => setTimeout(resolve, 500));

                    URL.revokeObjectURL(url);

                    // Add to history with file
                    await addToHistoryWithFile(
                        'split',
                        `page_${i + 1}.pdf`,
                        `Page ${i + 1} extracted`,
                        pdfBytes,
                        'application/pdf'
                    );
                }
            }

            // Reload history
            const allHistory = await getHistory();
            const splitHistory = allHistory.filter(item => item.operation === 'split').slice(0, 5);
            setHistory(splitHistory);

            setFile(null);
            setPageCount(0);
            alert('✅ PDF split successfully!');
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('❌ Error splitting PDF. Please try again.');
        } finally {
            setSplitting(false);
        }
    };

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

                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">✂️</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Split PDF</h2>
                                <p className="text-white/60 text-xs">Extract page ranges</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Splits</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent splits</p>
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
                                            <p className="text-white/50 text-xs mt-0.5">{item.description}</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">Split PDF</h2>
                        <p className="text-white/60">Extract specific pages or split into individual files</p>
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

                    {/* Split Options */}
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
                                            <p className="text-white/40 text-sm">{pageCount} pages</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-stroke hover:text-primary"
                                        disabled={splitting}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Mode Selection */}
                                <div className="mb-6">
                                    <label className="text-white/60 text-sm mb-3 block">Split Mode</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSplitMode('range')}
                                            disabled={splitting}
                                            className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${splitMode === 'range'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-background border-stroke text-white/60'
                                                }`}
                                        >
                                            <div className="font-medium mb-1">Page Range</div>
                                            <div className="text-xs opacity-60">Extract specific pages</div>
                                        </button>
                                        <button
                                            onClick={() => setSplitMode('individual')}
                                            disabled={splitting}
                                            className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${splitMode === 'individual'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-background border-stroke text-white/60'
                                                }`}
                                        >
                                            <div className="font-medium mb-1">Individual Pages</div>
                                            <div className="text-xs opacity-60">One file per page</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Page Range Selection */}
                                {splitMode === 'range' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/60 text-sm mb-2 block">Start Page</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={pageCount}
                                                value={startPage}
                                                onChange={(e) => setStartPage(Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1)))}
                                                className="w-full bg-background border border-stroke rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white/60 text-sm mb-2 block">End Page</label>
                                            <input
                                                type="number"
                                                min={startPage}
                                                max={pageCount}
                                                value={endPage}
                                                onChange={(e) => setEndPage(Math.max(startPage, Math.min(pageCount, parseInt(e.target.value) || pageCount)))}
                                                className="w-full bg-background border border-stroke rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Split Button */}
                            <button
                                onClick={splitPDF}
                                disabled={splitting}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {splitting
                                    ? 'Splitting...'
                                    : splitMode === 'range'
                                        ? `Extract Pages ${startPage}-${endPage}`
                                        : `Split into ${pageCount} Files`
                                }
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
