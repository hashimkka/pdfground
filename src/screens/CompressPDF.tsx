import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import imageCompression from 'browser-image-compression';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';
import { trackPDFOperation } from '../utils/posthog';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const CompressPDF: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [compressing, setCompressing] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [result, setResult] = React.useState<{ original: number; compressed: number; reduction: number } | null>(null);
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const compressHistory = allHistory.filter(item => item.operation === 'compress' && !item.details?.includes('export') && !item.details?.includes('password')).slice(0, 5);
            setHistory(compressHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0]);
        setResult(null);
        setProgress(0);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    const compressPDF = async () => {
        if (!file) return;

        setCompressing(true);
        setResult(null);
        setProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await loadingTask.promise;
            const numPages = pdfDoc.numPages;

            // Create new PDF document
            const newPdf = await PDFDocument.create();

            // Use low compression (85% quality) for best quality
            const quality = 0.85;

            // Process each page
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                setProgress(Math.round((pageNum / numPages) * 100));

                // Get page
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render PDF page to canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Convert canvas to blob
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((blob) => {
                        resolve(blob!);
                    }, 'image/jpeg', quality);
                });

                // Compress the image blob
                const compressedBlob = await imageCompression(blob as File, {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 2000,
                    useWebWorker: true,
                    fileType: 'image/jpeg'
                });

                // Convert blob to array buffer
                const imageBytes = await compressedBlob.arrayBuffer();

                // Embed image in new PDF
                const image = await newPdf.embedJpg(imageBytes);
                const pdfPage = newPdf.addPage([viewport.width, viewport.height]);

                pdfPage.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: viewport.height,
                });
            }

            // Save compressed PDF
            const pdfBytes = await newPdf.save({
                useObjectStreams: true,
                addDefaultPage: false,
            });

            // Calculate compression results
            const originalSize = file.size;
            const compressedSize = pdfBytes.length;
            const reduction = ((originalSize - compressedSize) / originalSize) * 100;

            setResult({
                original: originalSize,
                compressed: compressedSize,
                reduction: reduction
            });

            // Download compressed PDF
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed_${file.name}`;
            a.click();
            URL.revokeObjectURL(url);

            // Add to history with file
            await addToHistoryWithFile(
                'compress',
                `compressed_${file.name}`,
                `${reduction.toFixed(1)}% reduction`,
                pdfBytes,
                'application/pdf'
            );

            setProgress(100);

            // Track successful compression
            trackPDFOperation('compressed', true, {
                original_size_mb: (originalSize / 1024 / 1024).toFixed(2),
                compressed_size_mb: (compressedSize / 1024 / 1024).toFixed(2),
                reduction_percent: reduction.toFixed(1),
                page_count: numPages,
            });
        } catch (error) {
            console.error('Error compressing PDF:', error);

            // Track failed compression
            trackPDFOperation('compressed', false, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            alert('Error compressing PDF. Please try again.');
        } finally {
            setCompressing(false);
        }
    };

    const formatSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
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

                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🗜️</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Compress PDF</h2>
                                <p className="text-white/60 text-xs">Reduce file size</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Compressions</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent compressions</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">📉 Compress PDF</h2>
                        <p className="text-white/60">Reduce PDF file size while maintaining quality</p>
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

                    {/* File Info */}
                    {file && (
                        <>
                            <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-primary text-xl">📄</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{file.name}</p>
                                            <p className="text-white/40 text-sm">{formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setResult(null); setProgress(0); }}
                                        className="text-stroke hover:text-primary"
                                        disabled={compressing}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {compressing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Compressing...</span>
                                        <span className="text-primary font-medium">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            className="bg-primary h-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Compression Result */}
                            {result && !compressing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-dark-lighter border border-primary/50 rounded-2xl p-6 mb-6"
                                >
                                    <h3 className="text-white font-semibold mb-4">✅ Compression Complete!</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-white/60 text-sm mb-1">Original Size</div>
                                            <div className="text-white font-medium">{formatSize(result.original)}</div>
                                        </div>
                                        <div>
                                            <div className="text-white/60 text-sm mb-1">Compressed Size</div>
                                            <div className="text-primary font-medium">{formatSize(result.compressed)}</div>
                                        </div>
                                        <div>
                                            <div className="text-white/60 text-sm mb-1">Reduction</div>
                                            <div className="text-primary font-medium text-xl">
                                                {result.reduction.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-sm mt-4">
                                        💾 Saved {formatSize(result.original - result.compressed)} • File downloaded successfully!
                                    </p>
                                </motion.div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={compressPDF}
                                disabled={compressing}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {compressing ? `Compressing... ${progress}%` : 'Compress PDF'}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
