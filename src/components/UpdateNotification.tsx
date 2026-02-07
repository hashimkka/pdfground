import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export const UpdateNotification = () => {
    const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
    const [version, setVersion] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const update = await check();
                if (update?.available) {
                    setVersion(update.version);
                    setUpdateAvailable(true);
                }
            } catch (err) {
                console.error('Failed to check for updates:', err);
                // Don't show error to user unless manually checking
            }
        };

        checkForUpdates();

        // Check every hour
        const interval = setInterval(checkForUpdates, 3600000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdate = async () => {
        try {
            setStatus('downloading');
            setError(null);

            const update = await check();
            if (update?.available) {
                await update.downloadAndInstall((event) => {
                    switch (event.event) {
                        case 'Started':
                            console.log('Download started');
                            break;
                        case 'Progress':
                            console.log(`Download progress: ${event.data.chunkLength}`);
                            break;
                        case 'Finished':
                            console.log('Download finished');
                            break;
                    }
                });

                setStatus('ready');
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
                className="fixed bottom-6 right-6 z-50 p-4 bg-gray-900 border border-primary/20 rounded-xl shadow-2xl max-w-sm"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-white">Update Available</h3>
                            <p className="text-sm text-gray-400">
                                Version {version} is available.
                                {status === 'ready' && " Ready to install!"}
                            </p>
                        </div>
                        <button
                            onClick={() => setUpdateAvailable(false)}
                            className="text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <div className="flex gap-2 mt-2">
                        {status === 'idle' && (
                            <Button onClick={handleUpdate} size="sm">
                                Update Now
                            </Button>
                        )}
                        {status === 'downloading' && (
                            <Button disabled size="sm" className="opacity-70">
                                Downloading...
                            </Button>
                        )}
                        {status === 'ready' && (
                            <Button onClick={handleRelaunch} size="sm" variant="secondary">
                                Restart to Update
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
