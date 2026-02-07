import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import imageCompression from 'browser-image-compression';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

type BatchMode = 'merge' | 'compress';

export const BatchProcess: React.FC = () => {
    const navigate = useNavigate();
    const [files, setFiles] = React.useState<File[]>([]);
    const [mode, setMode] = React.useState<BatchMode>('merge');
    const [processing, setProcessing] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [currentFile, setCurrentFile] = React.useState('');
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const batchHistory = allHistory.filter(item =>
                item.operation === 'merge' || item.operation === 'compress'
            ).slice(0, 5);
            setHistory(batchHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: true,
    });

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newFiles = [...files];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        setFiles(newFiles);
    };

    const moveDown = (index: number) => {
        if (index === files.length - 1) return;
        const newFiles = [...files];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        setFiles(newFiles);
    };

    const batchMerge = async () => {
        setProcessing(true);
        setProgress(0);

        try {
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < files.length; i++) {
                setCurrentFile(files[i].name);
                setProgress(Math.round(((i + 1) / files.length) * 100));

                const arrayBuffer = await files[i].arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_${files.length}_files.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            await addToHistoryWithFile(
                'merge',
                `merged_${files.length}_files.pdf`,
                `Batch merged ${files.length} PDFs`,
                pdfBytes,
                'application/pdf'
            );

            // Reload history
            const allHistory = await getHistory();
            const batchHistory = allHistory.filter(item =>
                item.operation === 'merge' || item.operation === 'compress'
            ).slice(0, 5);
            setHistory(batchHistory);

            alert(`Successfully merged ${files.length} PDFs!`);
            setFiles([]);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Error merging PDFs. Please try again.');
        } finally {
            setProcessing(false);
            setCurrentFile('');
        }
    };

    const batchCompress = async () => {
        setProcessing(true);
        setProgress(0);

        try {
            for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                const file = files[fileIndex];
                setCurrentFile(file.name);
                setProgress(Math.round(((fileIndex + 1) / files.length) * 100));

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdfDoc = await loadingTask.promise;
                const newPdf = await PDFDocument.create();

                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    if (!context) continue;

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({ canvasContext: context, viewport }).promise;

                    const blob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
                    });

                    const compressedBlob = await imageCompression(blob as File, {
                        maxSizeMB: 2,
                        maxWidthOrHeight: 2000,
                        useWebWorker: true,
                        fileType: 'image/jpeg'
                    });

                    const imageBytes = await compressedBlob.arrayBuffer();
                    const image = await newPdf.embedJpg(imageBytes);
                    const pdfPage = newPdf.addPage([viewport.width, viewport.height]);

                    pdfPage.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: viewport.width,
                        height: viewport.height,
                    });
                }

                const pdfBytes = await newPdf.save({ useObjectStreams: true });
                const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compressed_${file.name}`;
                a.click();

                // Add delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));

                URL.revokeObjectURL(url);

                await addToHistoryWithFile(
                    'compress',
                    `compressed_${file.name}`,
                    `Batch compressed`,
                    pdfBytes,
                    'application/pdf'
                );
            }

            // Reload history
            const allHistory = await getHistory();
            const batchHistory = allHistory.filter(item =>
                item.operation === 'merge' || item.operation === 'compress'
            ).slice(0, 5);
            setHistory(batchHistory);

            alert(`Successfully compressed ${files.length} PDFs!`);
            setFiles([]);
        } catch (error) {
            console.error('Error compressing PDFs:', error);
            alert('Error compressing PDFs. Please try again.');
        } finally {
            setProcessing(false);
            setCurrentFile('');
        }
    };

    const handleProcess = () => {
        if (mode === 'merge') {
            batchMerge();
        } else {
            batchCompress();
        }
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

                    <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🔁</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Batch Process</h2>
                                <p className="text-white/60 text-xs">Process multiple PDFs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Batches</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent batches</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">🔁 Batch Processing</h2>
                        <p className="text-white/60">Process multiple PDFs at once</p>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('merge')}
                                disabled={processing}
                                className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${mode === 'merge'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-dark-lighter border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">📑 Batch Merge</div>
                                <div className="text-xs opacity-60">Combine all PDFs</div>
                            </button>
                            <button
                                onClick={() => setMode('compress')}
                                disabled={processing}
                                className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${mode === 'compress'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-dark-lighter border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">📉 Batch Compress</div>
                                <div className="text-xs opacity-60">Compress each PDF</div>
                            </button>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${isDragActive ? 'border-primary bg-primary/10' : 'border-stroke bg-dark-lighter hover:border-primary/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="text-4xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {isDragActive ? 'Drop PDFs here' : 'Add PDF files'}
                        </h3>
                        <p className="text-white/40">Drag & drop multiple PDFs or click to browse</p>
                        {files.length > 0 && (
                            <p className="text-primary mt-2">{files.length} file{files.length !== 1 ? 's' : ''} added</p>
                        )}
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <>
                            <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                                <h3 className="text-white font-semibold mb-4">Files ({files.length})</h3>
                                <div className="space-y-2">
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-3 p-3 bg-background rounded-lg"
                                        >
                                            <div className="text-primary text-xl">📄</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{file.name}</p>
                                                <p className="text-white/40 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => moveUp(index)}
                                                    disabled={index === 0 || processing}
                                                    className="text-white/40 hover:text-primary disabled:opacity-30"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveDown(index)}
                                                    disabled={index === files.length - 1 || processing}
                                                    className="text-white/40 hover:text-primary disabled:opacity-30"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    disabled={processing}
                                                    className="text-stroke hover:text-red-400 disabled:opacity-30"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress */}
                            {processing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Processing: {currentFile}</span>
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

                            {/* Action Button */}
                            <button
                                onClick={handleProcess}
                                disabled={processing || files.length < 2}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing
                                    ? `Processing... ${progress}%`
                                    : mode === 'merge'
                                        ? `Merge ${files.length} PDFs`
                                        : `Compress ${files.length} PDFs`
                                }
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
