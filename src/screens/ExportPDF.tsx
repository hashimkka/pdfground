import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

type ExportType = 'text' | 'image';
type ImageFormat = 'png' | 'jpg';

export const ExportPDF: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [exportType, setExportType] = React.useState<ExportType>('text');
    const [imageFormat, setImageFormat] = React.useState<ImageFormat>('png');
    const [exporting, setExporting] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const exportHistory = allHistory.filter(item => item.operation === 'compress' && item.details && (item.details.includes('Exported') || item.details.includes('export'))).slice(0, 5);
            setHistory(exportHistory);
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

    const exportAsText = async () => {
        if (!file) return;

        setExporting(true);
        setProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                setProgress(Math.round((i / pdf.numPages) * 100));

                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
            }

            // Download as text file
            const blob = new Blob([fullText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name.replace('.pdf', '')}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            // Add to history (no file storage for text)
            await addToHistoryWithFile(
                'compress',
                `${file.name.replace('.pdf', '')}.txt`,
                `Exported to text (${pdf.numPages} pages)`,
                new Uint8Array(),
                'text/plain'
            );

            // Reload history
            const allHistory = await getHistory();
            const exportHistory = allHistory.filter(item => item.operation === 'compress' && item.details && (item.details.includes('Exported') || item.details.includes('export'))).slice(0, 5);
            setHistory(exportHistory);

            setProgress(100);
            alert('Text export complete!');
        } catch (error) {
            console.error('Error exporting to text:', error);
            alert('Error exporting to text. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const exportAsImage = async () => {
        if (!file) return;

        setExporting(true);
        setProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                setProgress(Math.round((i / pdf.numPages) * 100));

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                // Convert to blob and download
                await new Promise<void>((resolve) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `page_${i}.${imageFormat}`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }
                        resolve();
                    }, `image/${imageFormat}`);
                });
            }

            // Add to history
            await addToHistoryWithFile(
                'compress',
                file.name,
                `Exported to ${imageFormat.toUpperCase()} (${pdf.numPages} pages)`,
                new Uint8Array(),
                'application/pdf'
            );

            // Reload history
            const allHistory = await getHistory();
            const exportHistory = allHistory.filter(item => item.operation === 'compress' && item.details && (item.details.includes('Exported') || item.details.includes('export'))).slice(0, 5);
            setHistory(exportHistory);

            setProgress(100);
            alert(`Image export complete! ${pdf.numPages} images downloaded.`);
        } catch (error) {
            console.error('Error exporting to image:', error);
            alert('Error exporting to image. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExport = () => {
        if (exportType === 'text') {
            exportAsText();
        } else {
            exportAsImage();
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

                    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🧾</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Export PDF</h2>
                                <p className="text-white/60 text-xs">To text or images</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Exports</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent exports</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">🧾 Export PDF</h2>
                        <p className="text-white/60">Export PDF pages as text or images</p>
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

                    {/* Export Options */}
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
                                        disabled={exporting}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Export Type Selection */}
                                <div className="mb-6">
                                    <label className="text-white/60 text-sm mb-3 block">Export As</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setExportType('text')}
                                            disabled={exporting}
                                            className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${exportType === 'text'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-background border-stroke text-white/60'
                                                }`}
                                        >
                                            <div className="font-medium mb-1">📝 Text File</div>
                                            <div className="text-xs opacity-60">.txt format</div>
                                        </button>
                                        <button
                                            onClick={() => setExportType('image')}
                                            disabled={exporting}
                                            className={`py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${exportType === 'image'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-background border-stroke text-white/60'
                                                }`}
                                        >
                                            <div className="font-medium mb-1">🖼️ Images</div>
                                            <div className="text-xs opacity-60">One per page</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Image Format Selection */}
                                {exportType === 'image' && (
                                    <div>
                                        <label className="text-white/60 text-sm mb-3 block">Image Format</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setImageFormat('png')}
                                                disabled={exporting}
                                                className={`py-2 px-4 rounded-lg border transition-colors disabled:opacity-50 ${imageFormat === 'png'
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background border-stroke text-white/60'
                                                    }`}
                                            >
                                                PNG (Best Quality)
                                            </button>
                                            <button
                                                onClick={() => setImageFormat('jpg')}
                                                disabled={exporting}
                                                className={`py-2 px-4 rounded-lg border transition-colors disabled:opacity-50 ${imageFormat === 'jpg'
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background border-stroke text-white/60'
                                                    }`}
                                            >
                                                JPG (Smaller Size)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {exporting && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Exporting...</span>
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

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? `Exporting... ${progress}%` : `Export as ${exportType === 'text' ? 'Text' : imageFormat.toUpperCase()}`}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
