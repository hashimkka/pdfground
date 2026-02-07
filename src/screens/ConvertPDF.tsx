import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { addToHistoryWithFile, getHistory, downloadFromHistory } from '../utils/historyStorage';
import { trackPDFOperation } from '../utils/posthog';

// Configure PDF.js worker - use local worker to avoid Vite dynamic import issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const ConvertPDF: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = React.useState<File | null>(null);
    const [converting, setConverting] = React.useState(false);
    const [conversionType, setConversionType] = React.useState<'pdf-to-image' | 'image-to-pdf'>('pdf-to-image');
    const [imageFormat, setImageFormat] = React.useState<'png' | 'jpg'>('png');
    const [history, setHistory] = React.useState<any[]>([]);

    // Load history on mount
    React.useEffect(() => {
        const loadHistory = async () => {
            const allHistory = await getHistory();
            const convertHistory = allHistory.filter(item => item.operation === 'convert').slice(0, 5);
            setHistory(convertHistory);
        };
        loadHistory();
    }, []);

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        const droppedFile = acceptedFiles[0];
        setFile(droppedFile);

        // Auto-detect conversion type
        if (droppedFile.type === 'application/pdf') {
            setConversionType('pdf-to-image');
        } else {
            setConversionType('image-to-pdf');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
    });


    const convertPDFToImage = async () => {
        if (!file) return;

        setConverting(true);
        try {
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

                // Convert canvas to blob with Promise wrapper
                await new Promise<void>((resolve) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve();
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `page_${i}.${imageFormat}`;
                        a.click();
                        URL.revokeObjectURL(url);
                        resolve();
                    }, `image/${imageFormat}`);
                });
            }

            // Add to history (no file storage for image exports)
            await addToHistoryWithFile(
                'convert',
                file.name,
                `PDF to ${imageFormat.toUpperCase()} (${pdf.numPages} pages)`,
                new Uint8Array(),
                'application/pdf'
            );

            // Reload history
            const allHistory = await getHistory();
            const convertHistory = allHistory.filter(item => item.operation === 'convert').slice(0, 5);
            setHistory(convertHistory);
        } catch (error) {
            console.error('Error converting PDF to image:', error);
        } finally {
            setConverting(false);
        }

    };

    const convertImageToPDF = async () => {
        if (!file) return;

        setConverting(true);
        try {
            console.log('Converting image to PDF:', file.name, file.type);
            const pdfDoc = await PDFDocument.create();

            // Create an image element to load the file
            const img = new Image();
            const imageUrl = URL.createObjectURL(file);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            console.log('Image loaded:', img.width, 'x', img.height);

            // Convert to canvas to ensure compatibility
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(imageUrl);

            // Convert canvas to PNG blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, 'image/png');
            });

            const imageBytes = await blob.arrayBuffer();
            console.log('Image converted to PNG, bytes:', imageBytes.byteLength);

            // Embed as PNG (most reliable)
            const image = await pdfDoc.embedPng(imageBytes);
            console.log('Image embedded successfully:', image.width, 'x', image.height);

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name.split('.')[0]}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            // Add to history with file
            await addToHistoryWithFile(
                'convert',
                `${file.name.split('.')[0]}.pdf`,
                'Image to PDF',
                pdfBytes,
                'application/pdf'
            );

            // Reload history
            const allHistory = await getHistory();
            const convertHistory = allHistory.filter(item => item.operation === 'convert').slice(0, 5);
            setHistory(convertHistory);
        } catch (error) {
            console.error('Error converting image to PDF:', error);
        } finally {
            setConverting(false);
        }
    };

    const handleConvert = () => {
        if (conversionType === 'pdf-to-image') {
            convertPDFToImage();
        } else {
            convertImageToPDF();
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

                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🔄</div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Convert Files</h2>
                                <p className="text-white/60 text-xs">PDF ↔ Image</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/80 font-medium text-sm">Recent Conversions</h3>
                        {history.length > 0 && (
                            <span className="text-primary text-xs">{history.length} items</span>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-20">📋</div>
                            <p className="text-white/40 text-sm">No recent conversions</p>
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
                        <h2 className="text-3xl font-bold text-white mb-2">🔄 Convert Files</h2>
                        <p className="text-white/60">Convert between PDF and image formats</p>
                    </div>

                    {/* Conversion Type Selector */}
                    <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                        <label className="text-white/60 text-sm mb-3 block">Conversion Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConversionType('pdf-to-image')}
                                className={`py-3 px-4 rounded-lg border transition-colors ${conversionType === 'pdf-to-image'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-background border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">PDF → Image</div>
                                <div className="text-xs opacity-60">Convert PDF to PNG/JPG</div>
                            </button>
                            <button
                                onClick={() => setConversionType('image-to-pdf')}
                                className={`py-3 px-4 rounded-lg border transition-colors ${conversionType === 'image-to-pdf'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-background border-stroke text-white/60'
                                    }`}
                            >
                                <div className="font-medium mb-1">Image → PDF</div>
                                <div className="text-xs opacity-60">Convert images to PDF</div>
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
                            <div className="text-4xl mb-4">{conversionType === 'pdf-to-image' ? '📄' : '🖼️'}</div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {isDragActive ? 'Drop file here' : `Add ${conversionType === 'pdf-to-image' ? 'PDF' : 'Image'} file`}
                            </h3>
                            <p className="text-white/40">Drag & drop or click to browse</p>
                        </div>
                    )}

                    {/* File Info & Options */}
                    {file && (
                        <>
                            <div className="bg-dark-lighter border border-stroke rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-primary text-xl">{file.type === 'application/pdf' ? '📄' : '🖼️'}</span>
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

                                {/* Image Format (for PDF to Image) */}
                                {conversionType === 'pdf-to-image' && (
                                    <div>
                                        <label className="text-white/60 text-sm mb-3 block">Output Format</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setImageFormat('png')}
                                                className={`py-2 px-4 rounded-lg border transition-colors ${imageFormat === 'png'
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background border-stroke text-white/60'
                                                    }`}
                                            >
                                                PNG
                                            </button>
                                            <button
                                                onClick={() => setImageFormat('jpg')}
                                                className={`py-2 px-4 rounded-lg border transition-colors ${imageFormat === 'jpg'
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-background border-stroke text-white/60'
                                                    }`}
                                            >
                                                JPG
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleConvert}
                                disabled={converting}
                                className="w-full bg-primary text-background py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {converting ? 'Converting...' : `Convert to ${conversionType === 'pdf-to-image' ? imageFormat.toUpperCase() : 'PDF'}`}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
