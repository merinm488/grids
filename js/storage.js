/**
 * ================================================
 * GRIDS - Storage Module
 * ================================================
 * Handles data persistence with environment-aware storage:
 * - Local Storage for testing/development
 * - TextDB (https://textdb.dev/api/data/) for production
 * - Uses user hash as identifier (same as Notes project)
 *
 * Updated to match Notes project approach
 */

// ================================================
// Storage Class
// ================================================

class GridsStorage {
    constructor() {
        // Initialize storage based on environment
        this.isProduction = APP_CONFIG.isProduction;
        this.storageType = this.isProduction ? 'textdb' : 'local';
        this.baseUrl = APP_CONFIG.storage.textDB.baseUrl;
    }

    // ================================================
    // Public Methods
    // ================================================

    /**
     * Save spreadsheet data
     * @param {string} hash - User hash (used as TextDB identifier)
     * @param {object} data - Spreadsheet data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveSpreadsheet(hash, data) {
        return this.isProduction ? this.saveToTextDB(hash, data) : this.saveToLocal(hash, data);
    }

    /**
     * Load spreadsheet data
     * @param {string} hash - User hash
     * @returns {Promise<object>} Spreadsheet data
     */
    async loadSpreadsheet(hash) {
        return (this.isProduction) ? this.loadFromTextDB(hash) : this.loadFromLocal(hash);
    }

    /**
     * Delete spreadsheet data
     * @param {string} hash - User hash
     * @returns {Promise<boolean>} Success status
     */
    async deleteSpreadsheet(hash) {
        return this.isProduction ? this.deleteFromTextDB(hash) : this.deleteFromLocal(hash);
    }

    /**
     * List all spreadsheets (not applicable for user-specific storage)
     * @returns {Promise<Array>} Empty array (user-specific storage)
     */
    async listSpreadsheets() {
        // User-specific storage doesn't support listing other users' data
        return [];
    }

    /**
     * Save user settings
     * @param {object} settings - User settings object
     */
    async saveSettings(settings) {
        const settingsKey = 'grids_user_settings';
        return this.isProduction ? await this.saveToTextDB(settingsKey, settings) : await this.saveToLocal(settingsKey, settings);
    }

    /**
     * Load user settings
     * @returns {Promise<object>} User settings
     */
    async loadSettings() {
        const settingsKey = 'grids_user_settings';
        return this.isProduction ? await this.loadFromTextDB(settingsKey) : this.loadFromLocal(settingsKey);
    }

    // ================================================
    // Local Storage Methods (Development/Testing)
    // ================================================

    /**
     * Save to local storage
     * @param {string} hash - User hash
     * @param {object} data - Data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveToLocal(hash, data) {
        try {
            const storageKey = `grids_data_${hash}`;
            localStorage.setItem(storageKey, this.compressData(data));
            return true;
        } catch {
            console.error('Error saving to local');
            return false;
        }
    }

    /**
     * Load from local storage
     * @param {string} hash - User hash
     * @returns {Promise<object>} Loaded data
     */
    async loadFromLocal(hash) {
        try {
            const loadedData = localStorage.getItem(`grids_data_${hash}`);
            if (loadedData == null) {
                console.error('Key does not exist');
                return null;
            }
            return this.decompressData(loadedData);
        } catch (error) {
            console.error('error loading from local storage:', error);
            return null;
        }
    }

    /**
     * Delete from local storage
     * @param {string} hash - User hash
     * @returns {Promise<boolean>} Success status
     */
    async deleteFromLocal(hash) {
        try {
            localStorage.removeItem(`grids_data_${hash}`);
            return true;
        } catch (e) {
            console.error("Error delete data from local storage: ", e);
            return false;
        }
    }

    /**
     * List all local spreadsheets
     * @returns {Promise<Array>} Array of user hashes
     */
    async listLocal() {
        let hashList = [];
        const prefix = 'grids_data_';
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const localKey = localStorage.key(i);
                if (localKey && localKey.startsWith(prefix)) {
                    hashList.push(localKey.substring(prefix.length));
                }
            }
            return hashList;
        } catch (e) {
            console.error("Error listing local spreadsheets:", e);
            return hashList;
        }
    }

    // ================================================
    // TextDB Methods (Production)
    // ================================================

    /**
     * Save to TextDB (same approach as Notes project)
     * @param {string} hash - User hash (used as TextDB identifier)
     * @param {object} data - Spreadsheet data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveToTextDB(hash, data) {
        try {
            const response = await fetch('/api/storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'action': 'save',
                    'hash': hash,
                    'data': data
                })
            });
            if (response.ok) {
                return true;
            } else {
                console.error("Save Failed");
                return false;
            }
        } catch (e) {
            console.error('Error:', e);
            return false;
        }
    }

    /**
     * Load from TextDB (same approach as Notes project)
     * @param {string} hash - User hash to load
     * @returns {Promise<object|null>} Loaded data or null if not found
     */
    async loadFromTextDB(hash) {
        try {
            const url = `/api/storage?action=load&hash=${hash}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const result = await response.json();
                return result.data;
            } else {
                console.error('Load Failed');
                return null;
            }
        } catch (e) {
            console.error('Error:', e);
            return null;
        }
    }

    /**
     * Delete from TextDB
     * @param {string} hash - User hash to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFromTextDB(hash) {
        try {
            const response = await fetch('/api/storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    hash: hash,
                })
            });
            if (response.ok) {
                return true;
            } else {
                console.error('Delete Failed');
                return false;
            }
        } catch (e) {
            console.error('Error:', e);
            return false;
        }
    }

    // ================================================
    // Utility Methods
    // ================================================

    /**
     * Compress data before storage
     * @param {object} data - Data to compress
     * @returns {string} Compressed data
     */
    compressData(data) {
        return JSON.stringify(data);
    }

    /**
     * Decompress data after loading
     * @param {string} compressed - Compressed data
     * @returns {object} Decompressed data
     */
    decompressData(compressed) {
        return JSON.parse(compressed);
    }

    /**
     * Validate data structure
     * @param {object} data - Data to validate
     * @returns {boolean} Validation result
     */
    validateData(data) {
        return (typeof (data) === 'object') && data != null;
    }
}

// ================================================
// Export
// ================================================

// Initialize global storage instance
const gridsStorage = new GridsStorage();
