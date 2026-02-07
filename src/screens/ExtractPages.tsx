import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface PageInfo {
    index: number;
    thumbnail: string;
    selected: boolean;
}

export const ExtractPages: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [pages, setPages] = React.useState<PageInfo[]>([]);
    const [processing, setProcessing] = React.useState(false);
    const [extracting, setExtracting] = React.useState(false);
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const extractHistory = allHistory.filter(item => item.operation === 'split' && item.details?.includes('Extracted')).slice(0, 5);
            setHistory(extractHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0]);
        loadPDFPages(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    const loadPDFPages = async (pdfFile: File) => {
        setProcessing(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageInfos: PageInfo[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                pageInfos.push({
                    index: i - 1,
                    thumbnail: canvas.toDataURL(),
                    selected: false,
                });
            }

            setPages(pageInfos);
        } catch (error) {
            console.error('Error loading PDF pages:', error);
            alert('Error loading PDF. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const togglePage = (index: number) => {
        setPages(pages.map((page, i) =>
            i === index ? { ...page, selected: !page.selected } : page
        ));
    };

    const selectAll = () => {
        setPages(pages.map(page => ({ ...page, selected: true })));
    };

    const deselectAll = () => {
        setPages(pages.map(page => ({ ...page, selected: false })));
    };

    const extractPages = async () => {
        if (!file) return;

        const selectedPages = pages.filter(p => p.selected);
        if (selectedPages.length === 0) {
            alert('Please select at least one page to extract.');
            return;
        }

        setExtracting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            // Copy selected pages
            const pageIndices = selectedPages.map(p => p.index);
            const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extracted_${selectedPages.length}_pages.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Add to history
            await addToHistoryWithFile(
                'split',
                `extracted_${selectedPages.length}_pages.pdf`,
                `Extracted ${selectedPages.length} pages`,
                pdfBytes,
                'application/pdf'
            );

            // Reload history
            const allHistory = await getHistory();
            const extractHistory = allHistory.filter(item => item.operation === 'split' && item.details?.includes('Extracted')).slice(0, 5);
            setHistory(extractHistory);

            // Reset
            setFile(null);
            setPages([]);
            alert(`✅ Successfully extracted ${selectedPages.length} pages!`);
        } catch (error) {
            console.error('Error extracting pages:', error);
            alert('❌ Error extracting pages. Please try again.');
        } finally {
            setExtracting(false);
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

    const selectedCount = pages.filter(p => p.selected).length;

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

                    <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">📄</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Extract Pages</h2>
                                <p className="text-white/60 text-xs">Select & extract pages</p>
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
                    className="max-w-6xl mx-auto"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">📄 Extract Pages</h2>
                        <p className="text-white/60">Select and extract specific pages to a new PDF</p>
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

                    {/* Page Grid */}
                    {pages.length > 0 && (
                        <>
                            <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-white font-semibold">{pages.length} Pages</h3>
                                        <p className="text-white/40 text-sm">{selectedCount} selected</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={selectAll}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={deselectAll}
                                            className="px-4 py-2 bg-stroke/20 text-white/60 rounded-lg hover:bg-stroke/30 transition-colors text-sm"
                                        >
                                            Deselect All
                                        </button>
                                        <button
                                            onClick={() => { setFile(null); setPages([]); }}
                                            className="px-4 py-2 text-stroke hover:text-primary transition-colors text-sm"
                                        >
                                            ✕ Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {pages.map((page, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => togglePage(index)}
                                            className={`relative bg-background border-2 rounded-lg p-3 cursor-pointer transition-all ${page.selected
                                                ? 'border-primary shadow-lg shadow-primary/20'
                                                : 'border-stroke hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="relative mb-2">
                                                <img
                                                    src={page.thumbnail}
                                                    alt={`Page ${index + 1}`}
                                                    className="w-full rounded"
                                                />
                                                {page.selected && (
                                                    <div className="absolute inset-0 bg-primary/20 rounded flex items-center justify-center">
                                                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                                            ✓
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center text-white text-sm">
                                                Page {index + 1}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Extract Button */}
                            <button
                                onClick={extractPages}
                                disabled={extracting || selectedCount === 0}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {extracting ? 'Extracting...' : `Extract ${selectedCount} Page${selectedCount !== 1 ? 's' : ''}`}
                            </button>
                        </>
                    )}

                    {processing && (
                        <div className="text-center text-white/60 py-12">
                            <div className="text-4xl mb-4">⏳</div>
                            <p>Loading PDF pages...</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
