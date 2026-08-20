/**
 * ================================================
 * GRIDS - Storage Module
 * ================================================
 * Handles data persistence with environment-aware storage:
 * - Local Storage for testing/development
 * - TextDB (https://textdb.dev/api/data/) for production
 *
 * Implement all storage operations
 */

// import { json } from "node:stream/consumers";

// ================================================
// Storage Class
// ================================================

class GridsStorage {
    constructor() {
        // Initialize storage based on environment
        this.isProduction = APP_CONFIG.isProduction;
        this.storageType = this.isProduction ? 'textdb' : 'local';
        this.baseUrl = APP_CONFIG.storage.textDB.baseUrl;
        this.collectionId = APP_CONFIG.storage.textDB.collectionId;
    }

    // ================================================
    // Public Methods
    // ================================================

    /**
     * Save spreadsheet data
     * Implement save logic with environment selection
     * @param {string} id - Spreadsheet ID
     * @param {object} data - Spreadsheet data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveSpreadsheet(id, data) {
        // Check environment and call appropriate save method
        // return this.isProduction ? this.saveToTextDB(id, data) : this.saveToLocal(id, data);
        return this.isProduction ? this.saveToTextDB(id,data) : this.saveToLocal(id,data);
    }

    /**
     * Load spreadsheet data
     * Implement load logic with environment selection
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<object>} Spreadsheet data
     */
    async loadSpreadsheet(id) {
        // Check environment and call appropriate load method
        // return this.isProduction ? this.loadFromTextDB(id) : this.loadFromLocal(id);
        return (this.isProduction) ? this.loadFromTextDB(id) : this.loadFromLocal(id);
    }

    /**
     * Delete spreadsheet data
     * Implement delete logic
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSpreadsheet(id) {
        // Implement delete for both storage types
        return this.isProduction ? this.deleteFromTextDB(id) : this.deleteFromLocal(id);
    }

    /**
     * List all spreadsheets
     * Implement list functionality
     * @returns {Promise<Array>} Array of spreadsheet metadata
     */
    async listSpreadsheets() {
        // Return list of available spreadsheets
        return this.isProduction ? await this.listTextDB() : await this.listLocal();
    }

    /**
     * Save user settings
     * Implement settings persistence
     * @param {object} settings - User settings object
     */
    async saveSettings(settings) {
        // Save settings to appropriate storage
        const settingsKey = 'grids_user_settings';
        return this.isProduction ? await this.saveToTextDB(settingsKey,settings) : await this.saveToLocal(settingsKey,settings);
    }
    /**
     * Load user settings
     * Implement settings loading
     * @returns {Promise<object>} User settings
     */
    async loadSettings() {
        // Load settings from appropriate storage
        const settingsKey = 'grids_user_settings';
        return this.isProduction ? await this.loadFromTextDB(settingsKey) : this.loadFromLocal(settingsKey)
    }

    // ================================================
    // Local Storage Methods (Development/Testing)
    // ================================================

    /**
     * Save to local storage
     * Implement local storage save
     * @param {string} id - Spreadsheet ID
     * @param {object} data - Data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveToLocal(id, data) {
        // Save data to localStorage with proper key structure
        // Example key: `grids_sheet_${id}`
        try{
            const storageKey = `grids_sheet_${id}`;
            localStorage.setItem(storageKey, this.compressData(data));
            return true;
        } catch {
            console.error('Error saving to local');
            return false;
        }
    }

    /**
     * Load from local storage
     * Implement local storage load
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<object>} Loaded data
     */
    async loadFromLocal(id) {
        // Load data from localStorage
       
       try {
        const loadedData = localStorage.getItem(`grids_sheet_${id}`);
        if (loadedData == null){
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
     * Implement local storage delete
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteFromLocal(id) {
        // Remove data from localStorage
        try {
            localStorage.removeItem(`grids_sheet_${id}`);
            return true;
        } catch (e) {
            console.error("Error delete data from local storage: ", e);
            return false;
        }
    }

    /**
     * List all local spreadsheets
     * Implement local listing
     * @returns {Promise<Array>} Array of spreadsheet IDs
     */
    async listLocal() {
        // Scan localStorage for spreadsheet keys
        let keyList = [];
        const prefix = 'grids_sheet_';
        try {
            for (let i=0; i<localStorage.length; i++){
                const localKey = localStorage.key(i)
                if (localKey && localKey.startsWith(prefix)){
                    keyList.push(localKey.substring(prefix.length));
                }
            }
            return keyList;
        } catch (e){
            console.error("Error listing local spreadsheets:",e);
            return keyList;
        }
    }

    // ================================================
    // TextDB Methods (Production)
    // ================================================
    //
    // NOTES: Following the pattern from Notes project:
    // - Client-side (this file) calls YOUR API route: /api/storage
    // - Server-side (api/storage.js) calls TextDB directly
    // - This hides TextDB implementation and allows adding auth later
    //
    // API endpoint: /api/storage
    // Request body format: { action: 'save'|'load'|'delete'|'list', id: string, data?: object }
    // Response format: { success: boolean, data?: any, error?: string }
    //
    // You'll need to create: api/storage.js (similar to Notes project's api/notes.js)

    /**
     * Save to TextDB
     * Call your API route /api/storage with action='save'
     * @param {string} id - Spreadsheet ID (document identifier in TextDB)
     * @param {object} data - Spreadsheet data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveToTextDB(id, data) {
        // Use fetch() to call /api/storage
        // Body: { action: 'save', id: id, data: data }
        // Method: POST
        // Headers: { 'Content-Type': 'application/json' }
        // Check response.ok and return true/false

        try{
            // Step 1: Make the request
            const response = await fetch('/api/storage', {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify({
                    'action': 'save',
                    'id': id,
                    'data': data
                })
            })
            // Step 2: Check if successful
            if (response.ok){
                return true;
            }
            else {
                console.error("Save Failed");
                return false;
            }
        } catch (e){
            console.error('Error:', e);
            return false;
        }
    }

    /**
     * Load from TextDB
     * Call your API route /api/storage with action='load'
     * @param {string} id - Spreadsheet ID to load
     * @returns {Promise<object|null>} Loaded data or null if not found
     */
    async loadFromTextDB(id) {
        // Use fetch() to call /api/storage?action=load&id={id}
        // Method: GET
        // Parse JSON response and return data
        // Return null if not found or error
        try{
            const url = `/api/storage?action=load&id=${id}`
            const response = await fetch(url , {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                
            });
            if (response.ok){
                const result = await response.json();
                return result.data;
            } else {
                    console.error('Load Failed');
                    return null; // Not Found
            }
        } catch (e){
            console.error('Error:',e);
            return null; // error
        }
    }

    /**
     * Delete from TextDB
     * Call your API route /api/storage with action='delete'
     * @param {string} id - Spreadsheet ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFromTextDB(id) {
        // Use fetch() to call /api/storage
        // Body: { action: 'delete', id: id }
        // Method: POST (or DELETE)
        // Return true on success, false on failure
        try{
            const response = await fetch('/api/storage',{
                method: 'POST',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'delete',
                    id: id,
                })
            });
            if (response.ok){
                return true;
            } else {
                console.error('Delete Failed');
                return false;
            }
        } catch (e){
            console.error('Error:', e);
            return false;
        }
    }

    /**
     * List all TextDB spreadsheets
     * Call your API route /api/storage with action='list'
     * @returns {Promise<Array>} Array of spreadsheet metadata
     */
    async listTextDB() {
        // Use fetch() to call /api/storage?action=list
        // Method: GET
        // Return array of spreadsheet IDs or metadata
        try{
            const response = await fetch(`/api/storage?action=list`, {
                method: 'GET',
                headers:{'Content-Type': 'application/json'}
            });
            if (response.ok){
                const result = await response.json();
                return result.data;
            } else {
                console.error('Listing failed');
                return [];
            }
        } catch (e){
            console.error('Error:',e);
            return [];
        }

    }

    // ================================================
    // Utility Methods
    // ================================================

    /**
     * Generate unique ID for new spreadsheet
     * Implement ID generation
     * @returns {string} Unique ID
     */
    generateId() {
        // Generate unique identifier (timestamp + random)
        const uniqueID = Date.now() + Math.random();
        return uniqueID.toString();
    }

    /**
     * Compress data before storage
     * Implement data compression if needed
     * @param {object} data - Data to compress
     * @returns {string} Compressed data
     */
    compressData(data) {
        // Add compression logic for large datasets
        return JSON.stringify(data);
    }

    /**
     * Decompress data after loading
     * Implement data decompression
     * @param {string} compressed - Compressed data
     * @returns {object} Decompressed data
     */
    decompressData(compressed) {
        // Add decompression logic
        return JSON.parse(compressed);
    }

    /**
     * Validate data structure
     * Implement data validation
     * @param {object} data - Data to validate
     * @returns {boolean} Validation result
     */
    validateData(data) {
        return (typeof(data) === 'object') && data != null;
    }
}

// ================================================
// Export
// ================================================

// Initialize global storage instance
// Create storage instance when DOM is ready
const gridsStorage = new GridsStorage();
