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
        const userData = await this.loadUserData();

        if (!userData || !userData.spreadsheets) {
            console.error('[STORAGE] No user data or spreadsheets found');
            return null;
        }

        const spreadsheet = userData.spreadsheets.find(s => s.id === spreadsheetId);
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
     * Also deletes the shared copy if one exists
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
            // First, get the spreadsheet to check if it has a shared copy
            const spreadsheet = await this.getSpreadsheet(spreadsheetId);

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

            // If deletion successful and spreadsheet had a shared copy, delete it too
            if (result.success && spreadsheet?.sharedId) {
                await this.deleteSharedSpreadsheet(spreadsheet.sharedId);
            }

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
    // Share Functionality
    // ================================================

    /**
     * Share a spreadsheet
     * @param {string} spreadsheetId - Spreadsheet ID to share
     * @returns {Promise<object|null>} Share result with shareUrl and alreadyShared flag
     */
    async shareSpreadsheet(spreadsheetId) {
        const hash = this.getUserHash();
        if (!hash) {
            console.error('[STORAGE] No user hash found');
            return null;
        }

        try {
            // First, get the current spreadsheet data to check if already shared
            const userData = await this.loadUserData();
            if (!userData || !userData.spreadsheets) {
                console.error('[STORAGE] No user data found');
                return null;
            }

            const spreadsheet = userData.spreadsheets.find(s => s.id === spreadsheetId);
            if (!spreadsheet) {
                console.error('[STORAGE] Spreadsheet not found:', spreadsheetId);
                return null;
            }

            // Check if already shared
            if (spreadsheet.sharedId) {
                const existingShareId = spreadsheet.sharedId;

                // Get base URL
                const baseUrl = this.getBaseUrl();
                return {
                    shareId: existingShareId,
                    shareUrl: `${baseUrl}/shared.html?shared=${existingShareId}`,
                    alreadyShared: true
                };
            }

            // Generate new share ID
            const newShareId = this.generateId();

            // Prepare share data
            const shareData = {
                spreadsheet: spreadsheet,
                sharedAt: new Date().toISOString()
            };

            // Store shared spreadsheet in textdb.dev
            const textdbResponse = await fetch(`https://textdb.dev/api/data/shared_${newShareId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(shareData)
            });

            if (!textdbResponse.ok) {
                console.error('[STORAGE] Failed to save shared spreadsheet to textdb.dev');
                return null;
            }

            // Update spreadsheet with sharedId
            spreadsheet.sharedId = newShareId;

            // Save updated user data
            const saveResponse = await fetch(this.apiEndpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hash: hash,
                    action: 'updateSpreadsheet',
                    data: {
                        spreadsheetId: spreadsheetId,
                        spreadsheetData: spreadsheet
                    }
                })
            });

            const saveResult = await saveResponse.json();
            if (!saveResult.success) {
                console.error('[STORAGE] Failed to update spreadsheet with sharedId');
                return null;
            }

            // Get base URL and return share info
            const baseUrl = this.getBaseUrl();
            const shareUrl = `${baseUrl}/shared.html?shared=${newShareId}`;

            return {
                shareId: newShareId,
                shareUrl: shareUrl,
                alreadyShared: false
            };

        } catch (error) {
            console.error('[STORAGE] Share error:', error);
            return null;
        }
    }

    /**
     * Get shared spreadsheet from textdb.dev
     * @param {string} shareId - Share ID
     * @returns {Promise<object|null>} Shared spreadsheet data
     */
    async getSharedSpreadsheet(shareId) {
        try {
            const response = await fetch(`https://textdb.dev/api/data/shared_${shareId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return null;
            }

            const text = await response.text();

            // Check for empty or invalid content
            if (!text || text.trim() === '' || text.includes('hello world from textdb') || text.length < 10) {
                return null;
            }

            let parsed;
            try {
                parsed = JSON.parse(text);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
            } catch (parseError) {
                console.error('[STORAGE] JSON parse error:', parseError);
                return null;
            }

            // Validate structure
            if (!parsed || typeof parsed !== 'object' || !parsed.spreadsheet) {
                return null;
            }

            return parsed;

        } catch (error) {
            console.error('[STORAGE] Get shared spreadsheet error:', error);
            return null;
        }
    }

    /**
     * Delete shared spreadsheet from textdb.dev
     * @param {string} shareId - Share ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteSharedSpreadsheet(shareId) {
        try {
            // Send null to delete
            const response = await fetch(`https://textdb.dev/api/data/shared_${shareId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(null)
            });

            return response.ok;
        } catch (error) {
            console.error('[STORAGE] Delete shared spreadsheet error:', error);
            return false;
        }
    }

    /**
     * Generate unique ID for sharing
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Get base URL for share links
     * @returns {string} Base URL
     */
    getBaseUrl() {
        // Determine base URL from current location
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}`;
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
