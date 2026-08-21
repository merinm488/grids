/**
 * ================================================
 * GRIDS - Storage Module (Updated for Unified API)
 * ================================================
 * Handles data persistence using the unified /api/users endpoint:
 * - All storage operations go through the user API
 * - Uses user hash from sessionStorage for identification
 * - Spreadsheet data is stored within user data structure
 *
 * Matches Notes project approach
 */

// ================================================
// Storage Class
// ================================================

class GridsStorage {
    constructor() {
        this.isProduction = APP_CONFIG.isProduction;
        this.apiEndpoint = '/api/users';
    }

    // ================================================
    // Public Methods
    // ================================================

    /**
     * Get current user hash from sessionStorage
     * @returns {string|null} User hash
     */
    getUserHash() {
        return sessionStorage.getItem('grids_user_hash');
    }

    /**
     * Save spreadsheet data for current user
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {object} spreadsheetData - Spreadsheet data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveSpreadsheet(spreadsheetId, spreadsheetData) {
        const hash = this.getUserHash();
        if (!hash) {
            console.error('[STORAGE] No user hash found');
            return false;
        }

        console.log('[STORAGE] Saving spreadsheet with ID:', spreadsheetId);
        console.log('[STORAGE] Spreadsheet data ID:', spreadsheetData?.id);
        console.log('[STORAGE] ID match:', spreadsheetId === spreadsheetData?.id);

        // Add cache-busting to avoid service worker interference
        const cacheBuster = `&_t=${Date.now()}_${Math.random().toString(36).substring(2)}`;

        try {
            const response = await fetch(`${this.apiEndpoint}?${new URLSearchParams({ _cacheBust: Date.now() })}`, {
                method: 'PUT',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({
                    hash: hash,
                    action: 'updateSpreadsheet',
                    data: {
                        spreadsheetId: spreadsheetId,
                        spreadsheetData: spreadsheetData,
                        _timestamp: Date.now()
                    }
                })
            });

            const result = await response.json();
            console.log('[STORAGE] Save result:', result.success);
            console.log('[STORAGE] Total spreadsheets after save:', result.data?.spreadsheets?.length);

            // Verify the save worked correctly
            if (result.success && result.data?.spreadsheets) {
                const savedSpreadsheet = result.data.spreadsheets.find(s => s.id === spreadsheetId);
                if (!savedSpreadsheet) {
                    console.error('[STORAGE] Save reported success but spreadsheet not found in data!');
                    return false;
                }
                console.log('[STORAGE] Verified spreadsheet saved:', savedSpreadsheet.name);
            }

            return result.success;
        } catch (error) {
            console.error('[STORAGE] Save error:', error);
            return false;
        }
    }

    /**
     * Load all user data (including spreadsheets)
     * @returns {Promise<object|null>} User data with spreadsheets
     */
    async loadUserData() {
        const hash = this.getUserHash();
        if (!hash) {
            console.error('[STORAGE] No user hash found');
            return null;
        }

        try {
            // Add cache-busting timestamp to ensure fresh data
            const cacheBuster = `&_t=${Date.now()}`;
            const response = await fetch(`${this.apiEndpoint}?hash=${encodeURIComponent(hash)}${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[STORAGE] Loaded user data:', result);
                return result.success ? result.data : null;
            } else {
                console.error('[STORAGE] Load failed:', response.status);
                return null;
            }
        } catch (error) {
            console.error('[STORAGE] Load error:', error);
            return null;
        }
    }

    /**
     * Get specific spreadsheet from user data
     * @param {string} spreadsheetId - Spreadsheet ID
     * @returns {Promise<object|null>} Spreadsheet data
     */
    async getSpreadsheet(spreadsheetId) {
        console.log('[STORAGE] Getting spreadsheet:', spreadsheetId);
        const userData = await this.loadUserData();
        console.log('[STORAGE] User data:', userData);

        if (!userData || !userData.spreadsheets) {
            console.error('[STORAGE] No user data or spreadsheets found');
            return null;
        }

        const spreadsheet = userData.spreadsheets.find(s => s.id === spreadsheetId);
        if (spreadsheet) {
            console.log('[STORAGE] Found spreadsheet:', spreadsheet.name);
        } else {
            console.error('[STORAGE] Spreadsheet not found:', spreadsheetId);
        }

        return spreadsheet || null;
    }

    /**
     * Get all spreadsheets for current user
     * @returns {Promise<Array>} Array of spreadsheets
     */
    async getSpreadsheets() {
        const userData = await this.loadUserData();
        if (!userData || !userData.spreadsheets) {
            return [];
        }

        return userData.spreadsheets;
    }

    /**
     * Delete spreadsheet from user data
     * @param {string} spreadsheetId - Spreadsheet ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteSpreadsheet(spreadsheetId) {
        const hash = this.getUserHash();
        if (!hash) {
            console.error('[STORAGE] No user hash found');
            return false;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hash: hash,
                    action: 'deleteSpreadsheet',
                    data: {
                        spreadsheetId: spreadsheetId
                    }
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('[STORAGE] Delete error:', error);
            return false;
        }
    }

    /**
     * Update user settings
     * @param {object} settings - Settings object to update
     * @returns {Promise<boolean>} Success status
     */
    async saveSettings(settings) {
        const hash = this.getUserHash();
        if (!hash) {
            console.error('[STORAGE] No user hash found');
            return false;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hash: hash,
                    action: 'updateSettings',
                    data: {
                        settings: settings
                    }
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('[STORAGE] Save settings error:', error);
            return false;
        }
    }

    /**
     * Get user settings from user data
     * @returns {Promise<object>} User settings
     */
    async getSettings() {
        const userData = await this.loadUserData();
        if (!userData || !userData.settings) {
            // Return default settings
            return {
                theme: 'light'
            };
        }

        return userData.settings;
    }

    // ================================================
    // Legacy Methods (for backward compatibility)
    // ================================================

    /**
     * Legacy method - uses new API
     * @deprecated Use saveSpreadsheet with spreadsheet ID instead
     */
    async saveSpreadsheetByHash(hash, data) {
        console.warn('[STORAGE] saveSpreadsheetByHash is deprecated, use saveSpreadsheet instead');
        // This would need a spreadsheet ID, using hash as fallback
        return this.saveSpreadsheet(hash, data);
    }

    /**
     * Legacy method - uses new API
     * @deprecated Use loadUserData instead
     */
    async loadSpreadsheet(hash) {
        console.warn('[STORAGE] loadSpreadsheet is deprecated, use loadUserData instead');
        return this.loadUserData();
    }

    /**
     * Legacy method - uses new API
     * @deprecated Use getSpreadsheets instead
     */
    async listSpreadsheets() {
        return this.getSpreadsheets();
    }
}

// ================================================
// Export
// ================================================

// Initialize global storage instance
const gridsStorage = new GridsStorage();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.GridsStorage = GridsStorage;
    window.gridsStorage = gridsStorage;
}
