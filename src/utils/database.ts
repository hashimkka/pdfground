// SQLite Database utility for PDFGround
// Provides persistent storage for history and PDF files

import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;
let isInitialized = false;

const DB_NAME = 'pdfground.db';
const MAX_FILES = 50; // Keep last 50 files

// Initialize the database
export const initDatabase = async (): Promise<void> => {
    if (isInitialized) return;

    try {
        const SQL = await initSqlJs({
            locateFile: (file) => `https://sql.js.org/dist/${file}`
        });

        // Try to load existing database from IndexedDB
        const savedDb = await loadDatabaseFromIndexedDB();

        if (savedDb) {
            db = new SQL.Database(savedDb);
        } else {
            db = new SQL.Database();
            createTables();
        }

        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};

// Create database tables
const createTables = (): void => {
    if (!db) return;

    // History table
    db.run(`
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            operation TEXT NOT NULL,
            fileName TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            details TEXT,
            fileId TEXT,
            FOREIGN KEY (fileId) REFERENCES files(id)
        )
    `);

    // Files table
    db.run(`
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            fileName TEXT NOT NULL,
            fileData BLOB NOT NULL,
            mimeType TEXT NOT NULL,
            size INTEGER NOT NULL,
            createdAt INTEGER NOT NULL
        )
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_files_created ON files(createdAt DESC)');
};

// Save database to IndexedDB
const saveDatabaseToIndexedDB = async (): Promise<void> => {
    if (!db) return;

    try {
        const data = db.export();
        const request = indexedDB.open('PDFGround', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('database')) {
                db.createObjectStore('database');
            }
        };

        request.onsuccess = (event) => {
            const idb = (event.target as IDBOpenDBRequest).result;
            const transaction = idb.transaction(['database'], 'readwrite');
            const store = transaction.objectStore('database');
            store.put(data, DB_NAME);
        };
    } catch (error) {
        console.error('Failed to save database:', error);
    }
};

// Load database from IndexedDB
const loadDatabaseFromIndexedDB = (): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
        const request = indexedDB.open('LocaledPDF', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('database')) {
                db.createObjectStore('database');
            }
        };

        request.onsuccess = (event) => {
            const idb = (event.target as IDBOpenDBRequest).result;
            const transaction = idb.transaction(['database'], 'readonly');
            const store = transaction.objectStore('database');
            const getRequest = store.get(DB_NAME);

            getRequest.onsuccess = () => {
                resolve(getRequest.result || null);
            };

            getRequest.onerror = () => {
                resolve(null);
            };
        };

        request.onerror = () => {
            resolve(null);
        };
    });
};

// Add history entry with optional file
export const addHistoryWithFile = async (
    operation: string,
    fileName: string,
    details: string,
    fileData?: Uint8Array,
    mimeType?: string
): Promise<void> => {
    await initDatabase();
    if (!db) return;

    const historyId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    let fileId: string | null = null;

    // Store file if provided
    if (fileData && mimeType) {
        fileId = `file_${historyId}`;
        db.run(
            'INSERT INTO files (id, fileName, fileData, mimeType, size, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [fileId, fileName, fileData, mimeType, fileData.length, timestamp]
        );
    }

    // Store history entry
    db.run(
        'INSERT INTO history (id, operation, fileName, timestamp, details, fileId) VALUES (?, ?, ?, ?, ?, ?)',
        [historyId, operation, fileName, timestamp, details, fileId]
    );

    // Cleanup old files if needed
    await cleanupOldFiles();

    // Save to IndexedDB
    await saveDatabaseToIndexedDB();
};

// Get all history entries
export const getHistory = async (): Promise<any[]> => {
    await initDatabase();
    if (!db) return [];

    const result = db.exec(`
        SELECT h.*, f.size as fileSize
        FROM history h
        LEFT JOIN files f ON h.fileId = f.id
        ORDER BY h.timestamp DESC
    `);

    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
            obj[col] = row[index];
        });
        return obj;
    });
};

// Get file data for download
export const getFileData = async (fileId: string): Promise<{ data: Uint8Array; fileName: string; mimeType: string } | null> => {
    await initDatabase();
    if (!db) return null;

    const result = db.exec('SELECT fileName, fileData, mimeType FROM files WHERE id = ?', [fileId]);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
        fileName: row[0] as string,
        data: row[1] as Uint8Array,
        mimeType: row[2] as string
    };
};

// Download file from history
export const downloadFileFromHistory = async (historyId: string): Promise<void> => {
    await initDatabase();
    if (!db) return;

    const result = db.exec('SELECT fileId FROM history WHERE id = ?', [historyId]);

    if (result.length === 0 || result[0].values.length === 0 || !result[0].values[0][0]) {
        console.error('No file associated with this history entry');
        return;
    }

    const fileId = result[0].values[0][0] as string;
    const fileData = await getFileData(fileId);

    if (!fileData) {
        console.error('File not found');
        return;
    }

    // Create download
    const blob = new Blob([fileData.data as BlobPart], { type: fileData.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.fileName;
    a.click();
    URL.revokeObjectURL(url);
};

// Delete history entry and associated file
export const deleteHistory = async (historyId: string): Promise<void> => {
    await initDatabase();
    if (!db) return;

    // Get fileId
    const result = db.exec('SELECT fileId FROM history WHERE id = ?', [historyId]);
    const fileId = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : null;

    // Delete file if exists
    if (fileId) {
        db.run('DELETE FROM files WHERE id = ?', [fileId]);
    }

    // Delete history entry
    db.run('DELETE FROM history WHERE id = ?', [historyId]);

    await saveDatabaseToIndexedDB();
};

// Clear all history and files
export const clearAllHistory = async (): Promise<void> => {
    await initDatabase();
    if (!db) return;

    db.run('DELETE FROM files');
    db.run('DELETE FROM history');

    await saveDatabaseToIndexedDB();
};

// Cleanup old files (keep last MAX_FILES)
const cleanupOldFiles = async (): Promise<void> => {
    if (!db) return;

    const result = db.exec('SELECT COUNT(*) FROM files');
    const count = result[0].values[0][0] as number;

    if (count > MAX_FILES) {
        // Delete oldest files
        db.run(`
            DELETE FROM files
            WHERE id IN (
                SELECT id FROM files
                ORDER BY createdAt ASC
                LIMIT ${count - MAX_FILES}
            )
        `);
    }
};

// Get storage statistics
export const getStorageStats = async (): Promise<{ totalFiles: number; totalSize: number; historyCount: number }> => {
    await initDatabase();
    if (!db) return { totalFiles: 0, totalSize: 0, historyCount: 0 };

    const filesResult = db.exec('SELECT COUNT(*), SUM(size) FROM files');
    const historyResult = db.exec('SELECT COUNT(*) FROM history');

    return {
        totalFiles: (filesResult[0]?.values[0]?.[0] as number) || 0,
        totalSize: (filesResult[0]?.values[0]?.[1] as number) || 0,
        historyCount: (historyResult[0]?.values[0]?.[0] as number) || 0
    };
};
