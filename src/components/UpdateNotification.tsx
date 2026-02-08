import { useEffect, useState, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export const UpdateNotification = () => {
    const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
    const [version, setVersion] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);

    const checkForUpdates = useCallback(async () => {
        try {
            const update = await check();
            if (update?.available) {
                setVersion(update.version);
                setUpdateAvailable(true);
            }
        } catch (err) {
            console.error('Failed to check for updates:', err);
            // Silent error for auto-checks
        }
    }, []);

    useEffect(() => {
        checkForUpdates();

        // Check every hour
        const interval = setInterval(checkForUpdates, 3600000);
        return () => clearInterval(interval);
    }, [checkForUpdates]);

    const handleUpdate = async () => {
        try {
            setStatus('downloading');
            setError(null);
            setProgress(0);

            const update = await check();
            if (update?.available) {
                let downloaded = 0;
                let contentLength = 0;

                await update.downloadAndInstall((event) => {
                    switch (event.event) {
                        case 'Started':
                            contentLength = event.data.contentLength || 0;
                            console.log('Download started', contentLength);
                            break;
                        case 'Progress':
                            downloaded += event.data.chunkLength;
                            if (contentLength > 0) {
                                setProgress(Math.round((downloaded / contentLength) * 100));
                            }
                            console.log(`Download progress: ${downloaded}/${contentLength}`);
                            break;
                        case 'Finished':
                            console.log('Download finished');
                            setProgress(100);
                            break;
                    }
                });

                setStatus('ready');
            } else {
                setError('Update no longer available.');
                setStatus('idle');
            }
        } catch (err) {
            console.error('Failed to install update:', err);
            setStatus('idle');
            setError('Failed to update. Please try again later.');
        }
    };

    const handleRelaunch = async () => {
        try {
            await relaunch();
        } catch (err) {
            console.error('Failed to relaunch:', err);
            setError('Failed to restart. Please restart manually.');
        }
    };

    if (!updateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50 p-6 bg-gray-900 border border-primary/20 rounded-xl shadow-2xl max-w-sm w-full backdrop-blur-sm"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-white text-lg">Update Available</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Version <span className="text-primary font-mono">{version}</span> is available.
                                {status === 'ready' && " Ready to install!"}
                            </p>
                        </div>
                        <button
                            onClick={() => setUpdateAvailable(false)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {error && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</p>}

                    {status === 'downloading' && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {status === 'idle' && (
                            <Button onClick={handleUpdate} size="sm" className="w-full">
                                Update Now
                            </Button>
                        )}
                        {status === 'downloading' && (
                            <Button disabled size="sm" className="w-full opacity-70">
                                {progress > 0 ? `Downloading ${progress}%` : 'Starting Download...'}
                            </Button>
                        )}
                        {status === 'ready' && (
                            <Button onClick={handleRelaunch} size="sm" variant="secondary" className="w-full">
                                Restart to Update
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
