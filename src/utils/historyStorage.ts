// History storage wrapper - now uses SQLite database
// Maintains backward compatibility with existing code

import {
    initDatabase,
    addHistoryWithFile,
    getHistory as getHistoryFromDb,
    deleteHistory as deleteHistoryFromDb,
    clearAllHistory,
    downloadFileFromHistory,
    getStorageStats
} from './database';

export interface HistoryItem {
    id: string;
    operation: 'merge' | 'split' | 'compress' | 'convert' | 'ocr' | 'reorder' | 'delete';
    fileName: string;
    timestamp: number;
    details?: string;
    fileId?: string | null;
    fileSize?: number | null;
}

// Initialize database on module load
initDatabase().catch(console.error);

// Get all history entries
export const getHistory = async (): Promise<HistoryItem[]> => {
    try {
        const history = await getHistoryFromDb();
        return history as HistoryItem[];
    } catch (error) {
        console.error('Error reading history:', error);
        return [];
    }
};

// Add history entry (without file - for backward compatibility)
export const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> => {
    try {
        await addHistoryWithFile(
            item.operation,
            item.fileName,
            item.details || '',
            undefined,
            undefined
        );
    } catch (error) {
        console.error('Error adding to history:', error);
    }
};

// Add history entry with file data
export const addToHistoryWithFile = async (
    operation: HistoryItem['operation'],
    fileName: string,
    details: string,
    fileData: Uint8Array,
    mimeType: string = 'application/pdf'
): Promise<void> => {
    try {
        await addHistoryWithFile(operation, fileName, details, fileData, mimeType);
    } catch (error) {
        console.error('Error adding to history with file:', error);
    }
};

// Download file from history
export const downloadFromHistory = async (historyId: string): Promise<void> => {
    try {
        await downloadFileFromHistory(historyId);
    } catch (error) {
        console.error('Error downloading from history:', error);
    }
};

// Delete history item
export const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
        await deleteHistoryFromDb(id);
    } catch (error) {
        console.error('Error deleting history item:', error);
    }
};

// Clear all history
export const clearHistory = async (): Promise<void> => {
    try {
        await clearAllHistory();
    } catch (error) {
        console.error('Error clearing history:', error);
    }
};

// Get storage statistics
export const getStats = async (): Promise<{ totalFiles: number; totalSize: number; historyCount: number }> => {
    try {
        return await getStorageStats();
    } catch (error) {
        console.error('Error getting storage stats:', error);
        return { totalFiles: 0, totalSize: 0, historyCount: 0 };
    }
};

// Helper functions
export const getOperationIcon = (operation: HistoryItem['operation']): string => {
    const icons = {
        merge: '📑',
        split: '✂️',
        compress: '📉',
        convert: '🔄',
        ocr: '🔍',
        reorder: '🔀',
        delete: '🗑️',
    };
    return icons[operation] || '📄';
};

export const getOperationLabel = (operation: HistoryItem['operation']): string => {
    const labels = {
        merge: 'Merge PDFs',
        split: 'Split PDF',
        compress: 'Compress PDF',
        convert: 'Convert File',
        ocr: 'OCR Extraction',
        reorder: 'Reorder/Rotate Pages',
        delete: 'Delete Pages',
    };
    return labels[operation] || 'PDF Operation';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
