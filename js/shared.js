/**
 * ================================================
 * GRIDS - Shared Spreadsheet Module
 * ================================================
 * Read-only view of a shared spreadsheet:
 * - Shows spreadsheet in view-only mode
 * - No edit/delete/save options
 * - Handles shared links with ?shared= parameter
 */

class SharedSpreadsheet {
    constructor() {
        this.shareId = null;
        this.spreadsheetData = null;
        this.isLoaded = false;
    }

    /**
     * Initialize shared spreadsheet view
     */
    async init() {
        try {
            // Get share ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.shareId = urlParams.get('shared');

            if (!this.shareId) {
                this.showError('No share ID provided');
                return;
            }

            // Fetch shared spreadsheet from textdb.dev
            await this.fetchSharedSpreadsheet();

        } catch (error) {
            console.error('[SHARED] Initialization error:', error);
            this.showError('Failed to load shared spreadsheet');
        }
    }

    /**
     * Fetch shared spreadsheet from textdb.dev
     */
    async fetchSharedSpreadsheet() {
        try {
            this.showLoading();

            const response = await fetch(`https://textdb.dev/api/data/shared_${this.shareId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                this.showError('Shared spreadsheet not found');
                return;
            }

            const text = await response.text();

            // Check for empty or invalid content (including when original was deleted)
            if (!text || text.trim() === '' || text.includes('hello world from textdb') || text.length < 10 || text === 'null' || text === 'undefined') {
                this.showError('This shared spreadsheet has been deleted or the link is invalid');
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(text);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
            } catch (parseError) {
                console.error('[SHARED] JSON parse error:', parseError);
                this.showError('Shared spreadsheet not found');
                return;
            }

            // Validate structure
            if (!parsed || typeof parsed !== 'object' || !parsed.spreadsheet) {
                this.showError('Shared spreadsheet not found');
                return;
            }

            this.spreadsheetData = parsed.spreadsheet;

            // Initialize Luckysheet in read-only mode
            await this.initializeSpreadsheet();

        } catch (error) {
            console.error('[SHARED] Fetch error:', error);
            this.showError('Failed to load shared spreadsheet');
        }
    }

    /**
     * Initialize Luckysheet in read-only mode
     */
    async initializeSpreadsheet() {
        try {
            // Check if Luckysheet is available
            if (typeof luckysheet === 'undefined') {
                throw new Error('Luckysheet not loaded');
            }

            // Prepare data for Luckysheet
            const options = {
                container: 'luckysheet',
                data: this.spreadsheetData.data || [],
                title: this.spreadsheetData.name || 'Untitled Spreadsheet',
                lang: 'en',
                showinfobar: false,
                showsheetbar: true,
                showstatisticBar: false,
                showConfigWindowResize: true,

                // Read-only mode settings
                allowEdit: false,
                enableAddRow: false,
                enableAddCol: false,
                enableAddBackTop: false,
                userInfo: false,

                // Disable features for read-only
                showSheet: false,
                enableCellEdit: false,
                enableRangeEdit: false,

                // Custom toolbar for read-only
                customButtons: [],

                // Callbacks
                hook: {
                    cellEditBefore: function (range) {
                        return false; // Prevent editing
                    },
                    rangeEditBefore: function (range) {
                        return false; // Prevent editing
                    }
                }
            };

            // Initialize Luckysheet
            luckysheet.create(options);
            this.isLoaded = true;
            this.hideLoading();

        } catch (error) {
            console.error('[SHARED] Spreadsheet initialization error:', error);
            this.showError('Failed to display spreadsheet');
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const errorOverlay = document.getElementById('errorOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.style.display = 'flex';
        }
        if (errorOverlay) {
            errorOverlay.classList.add('hidden');
            errorOverlay.style.display = 'none';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show error overlay
     */
    showError(message) {
        this.hideLoading();
        const errorOverlay = document.getElementById('errorOverlay');
        const loadingOverlay = document.getElementById('loadingOverlay');

        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        if (errorOverlay) {
            errorOverlay.classList.remove('hidden');
            errorOverlay.style.display = 'flex';
            const errorText = errorOverlay.querySelector('p');
            if (errorText && message) {
                errorText.textContent = message;
            }
        }
    }

    /**
     * Close shared view
     */
    close() {
        // Close window or navigate to home
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/auth.html';
        }
    }
}

// ================================================
// Initialize Shared Spreadsheet View
// ================================================

let sharedSpreadsheet;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Luckysheet to be available
    let attempts = 0;
    const maxAttempts = 100;
    while (typeof luckysheet === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (typeof luckysheet === 'undefined') {
        console.error('[SHARED] Luckysheet failed to load');
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                <h2>Failed to load spreadsheet library</h2>
                <p>Please check your internet connection and refresh the page.</p>
            </div>
        `;
        return;
    }

    sharedSpreadsheet = new SharedSpreadsheet();
    await sharedSpreadsheet.init();

    // Set up event listeners
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => sharedSpreadsheet.close());
    }

    const closeErrorBtn = document.getElementById('closeErrorBtn');
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => sharedSpreadsheet.close());
    }

    // Expose globally for debugging
    window.sharedSpreadsheet = sharedSpreadsheet;
});

// Handle window errors
window.addEventListener('error', (event) => {
    console.error('[SHARED] Application error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('[SHARED] Unhandled promise rejection:', event.reason);
});
