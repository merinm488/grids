/**
 * ================================================
 * GRIDS - Main Application Module
 * ================================================
 * Application entry point that coordinates all modules:
 * - Theme management
 * - Spreadsheet initialization
 * - Storage operations
 * - Event handling
 * - Auto-save functionality
 */

// ================================================
// Application Class
// ================================================

class GridsApp {
    constructor() {
        // Initialize application state
        this.isInitialized = false;
        this.spreadsheetId = null;
        this.autoSaveInterval = null;
        this.hasUnsavedChanges = false;
        this.isProduction = APP_CONFIG.isProduction;
    }

    // ================================================
    // Initialization
    // ================================================

    /**
     * Initialize application
     * Set up all components and event listeners
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        try {
            // Set up loading state
            this.showLoadingState();

            // Initialize theme manager
            themeManager.init();

            // Initialize storage (already done via config, but validate connection)
            if (!this.validateStorageConnection()) {
                this.showError('Failed to connect to storage service');
                return false;
            }

            // Get or create spreadsheet ID
            this.spreadsheetId = this.getOrCreateSpreadsheetId();

            // Initialize spreadsheet
            if (this.spreadsheetId && await this.load(this.spreadsheetId)) {
                // Successfully loaded existing spreadsheet
            } else {
                // Create new spreadsheet
                const newId = await this.createNew();
                if (newId) {
                    this.spreadsheetId = newId;
                    this.updateURL(newId);
                } else {
                    this.showError('Failed to create spreadsheet');
                    return false;
                }
            }

            // Set up event listeners
            this.setupEventListeners();

            // Set up auto-save
            if (APP_CONFIG.autoSave.enabled) {
                this.setupAutoSave();
            }

            // Hide loading state
            this.hideLoadingState();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Application initialization error:', error);
            this.showError('Failed to initialize application');
            this.hideLoadingState();
            return false;
        }
    }

    /**
     * Set up event listeners
     * Configure all application events
     */
    setupEventListeners() {
        // Settings menu toggle
        this.setupSettingsMenu();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window resize events
        window.addEventListener('resize', () => this.handleResize());

        // Beforeunload for unsaved changes
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    /**
     * Setup settings menu
     * Configure settings menu functionality
     */
    setupSettingsMenu() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsDropdown = document.getElementById('settingsDropdown');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const viewKeyBtn = document.getElementById('viewKeyBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        // Toggle settings dropdown
        if (settingsBtn && settingsDropdown) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsDropdown.classList.toggle('active');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (settingsDropdown && !e.target.closest('.settings-menu-container')) {
                settingsDropdown.classList.remove('active');
            }
        });

        // Theme toggle
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
                if (settingsDropdown) {
                    settingsDropdown.classList.remove('active');
                }
            });
        }

        // View key button
        if (viewKeyBtn) {
            viewKeyBtn.addEventListener('click', () => {
                this.showKeyInfo();
            });
        }

        // Key modal close button
        const keyModalClose = document.getElementById('keyModalClose');
        if (keyModalClose) {
            keyModalClose.addEventListener('click', () => {
                this.hideKeyModal();
            });
        }

        // Close modal on outside click
        const keyModal = document.getElementById('keyModal');
        if (keyModal) {
            keyModal.addEventListener('click', (e) => {
                if (e.target === keyModal) {
                    this.hideKeyModal();
                }
            });
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Update theme indicator
        this.updateThemeIndicator();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Luckysheet handles resize automatically
        // Add any custom resize logic here if needed
    }

    /**
     * Set up keyboard shortcuts
     * Configure keyboard commands
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Save (Ctrl+S / Cmd+S)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }

            // Undo (Ctrl+Z / Cmd+Z)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                spreadsheetManager.undo();
            }

            // Redo (Ctrl+Y / Cmd+Y or Cmd+Shift+Z)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                spreadsheetManager.redo();
            }
        });
    }

    // ================================================
    // Spreadsheet Operations
    // ================================================

    /**
     * Create new spreadsheet
     * Initialize fresh spreadsheet
     * @returns {Promise<string>} New spreadsheet ID
     */
    async createNew() {
        try {
            // Generate unique ID
            const newId = this.generateId();

            // Create default data structure
            const defaultData = spreadsheetManager.createDefaultData();

            // Initialize spreadsheet with default data
            const success = await spreadsheetManager.initialize(defaultData);
            if (!success) {
                throw new Error('Failed to initialize spreadsheet');
            }

            // Save to storage
            spreadsheetManager.currentSheetId = newId;
            await spreadsheetManager.save();

            return newId;
        } catch (error) {
            console.error('Error creating new spreadsheet:', error);
            return null;
        }
    }

    /**
     * Load existing spreadsheet
     * Load spreadsheet from storage
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<boolean>} Success status
     */
    async load(id) {
        try {
            // Show loading state
            spreadsheetManager.showLoading();

            // Load from storage
            const success = await spreadsheetManager.load(id);

            // Hide loading state
            spreadsheetManager.hideLoading();

            if (success) {
                this.spreadsheetId = id;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error loading spreadsheet:', error);
            spreadsheetManager.hideLoading();
            return false;
        }
    }

    /**
     * Save current spreadsheet
     * Persist current state
     * @returns {Promise<boolean>} Success status
     */
    async save() {
        try {
            // Save spreadsheet data
            const success = await spreadsheetManager.save();

            if (success) {
                // Update hasUnsavedChanges flag
                this.hasUnsavedChanges = false;

                // Show save confirmation
                this.showNotification('Spreadsheet saved successfully', 'success');
                return true;
            } else {
                this.showError('Failed to save spreadsheet');
                return false;
            }
        } catch (error) {
            console.error('Error saving spreadsheet:', error);
            this.showError('Error saving spreadsheet');
            return false;
        }
    }

    /**
     * Auto-save handler
     * Periodic save logic
     */
    async autoSave() {
        // Check if has unsaved changes
        if (this.hasUnsavedChanges) {
            // Save if changed
            await this.save();
            // Reset unsaved flag
            this.hasUnsavedChanges = false;
        }
    }

    /**
     * Setup auto-save interval
     */
    setupAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, APP_CONFIG.autoSave.interval);
    }

    // ================================================
    // Theme Operations
    // ================================================

    /**
     * Toggle theme
     * Switch between light and dark
     */
    toggleTheme() {
        themeManager.toggleTheme();
        this.updateThemeIndicator();
    }

    /**
     * Set theme
     * Apply specific theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        themeManager.setTheme(theme);
        this.updateThemeIndicator();
    }

    /**
     * Update theme indicator in settings menu
     * Show current theme status
     */
    updateThemeIndicator() {
        const themeIndicator = document.getElementById('themeIndicator');
        if (themeIndicator) {
            const currentTheme = themeManager.getCurrentTheme();
            themeIndicator.className = `theme-indicator ${currentTheme}`;
        }
    }

    /**
     * Show key information
     * Display user's access key info
     */
    showKeyInfo() {
        const currentUserData = localStorage.getItem('grids_current_user');
        const keyModal = document.getElementById('keyModal');
        const keyUsername = document.getElementById('keyUsername');
        const keyCurrentTheme = document.getElementById('keyCurrentTheme');

        if (currentUserData) {
            try {
                const user = JSON.parse(currentUserData);
                if (keyUsername) keyUsername.textContent = user.username;
                if (keyCurrentTheme) keyCurrentTheme.textContent = themeManager.getCurrentTheme() || 'light';
                if (keyModal) keyModal.classList.add('active');
                if (settingsDropdown) settingsDropdown.classList.remove('active');
            } catch (e) {
                this.showNotification('User information unavailable', 'error');
            }
        } else {
            this.showNotification('User information not found', 'error');
        }
    }

    /**
     * Hide key modal
     * Close the key information modal
     */
    hideKeyModal() {
        const keyModal = document.getElementById('keyModal');
        if (keyModal) keyModal.classList.remove('active');
    }

    /**
     * Logout current user
     * Logout and redirect to login page
     */
    async logout() {
        try {
            await authManager.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            window.location.href = '/auth.html';
        }
    }

    // ================================================
    // URL Handling
    // ================================================

    /**
     * Parse URL for spreadsheet ID
     * Get ID from URL query params
     * @returns {string|null} Spreadsheet ID or null
     */
    parseURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Update URL with spreadsheet ID
     * Update browser URL without reload
     * @param {string} id - Spreadsheet ID
     */
    updateURL(id) {
        window.history.pushState(null, '', `?id=${id}`);
    }

    // ================================================
    // Unsaved Changes Handling
    // ================================================

    /**
     * Mark spreadsheet as changed
     * Set unsaved changes flag
     */
    markAsChanged() {
        this.hasUnsavedChanges = true;
    }

    /**
     * Check for unsaved changes
     * Warn user before closing
     * @returns {boolean} Has unsaved changes
     */
    checkUnsavedChanges() {
        return this.hasUnsavedChanges;
    }

    /**
     * Handle before unload event
     * Show warning for unsaved changes
     * @param {Event} event - Before unload event
     */
    handleBeforeUnload(event) {
        // Check for unsaved changes
        if (this.hasUnsavedChanges) {
            // Set event.returnValue if changes exist
            event.preventDefault();
            event.returnValue = '';
            return event.returnValue;
        }
    }

    // ================================================
    // Spreadsheet Event Handlers
    // ================================================

    /**
     * Handle cell value change
     * Process cell modifications
     * @param {object} event - Change event
     */
    onCellChange(event) {
        // Mark as changed
        this.markAsChanged();
        // Trigger auto-save timer (handled by interval)
    }

    /**
     * Handle sheet change
     * Process sheet switching
     * @param {object} event - Sheet change event
     */
    onSheetChange(event) {
        // Update current sheet reference
        const currentSheet = spreadsheetManager.getCurrentSheetData();
        if (currentSheet) {
            console.log('Switched to sheet:', currentSheet.name);
        }
    }

    /**
     * Handle selection change
     * Process selection updates
     * @param {object} event - Selection event
     */
    onSelectionChange(event) {
        // Update selection reference
        const selection = spreadsheetManager.getSelectedCells();
        // Store selection if needed for future operations
    }

    // ================================================
    // Utility Methods
    // ================================================

    /**
     * Show notification
     * Display user message
     * @param {string} message - Message text
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        // Create and display notification element
        const msg = document.createElement('div');
        msg.className = `notification notification-${type}`;
        msg.textContent = message;
        document.body.appendChild(msg);

        // Auto-dismiss after timeout
        setTimeout(() => {
            msg.classList.add('notification-hiding');
            setTimeout(() => msg.remove(), 300);
        }, 3000);
    }

    /**
     * Show error
     * Display error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show loading state
     * Display loading overlay
     */
    showLoadingState() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading state
     * Hide loading overlay
     */
    hideLoadingState() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // Immediately disable pointer events so interactions work
            loadingOverlay.style.pointerEvents = 'none';
            loadingOverlay.classList.add('hidden');
            // Allow transition to complete before hiding display
            setTimeout(() => {
                if (loadingOverlay.classList.contains('hidden')) {
                    loadingOverlay.style.display = 'none';
                }
            }, 500);
        }
    }

    /**
     * Validate storage connection
     * Check if storage is accessible
     * @returns {boolean} Connection status
     */
    validateStorageConnection() {
        // Try to access storage
        try {
            const testKey = '__grids_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.error('Storage connection failed:', e);
            return false;
        }
    }

    /**
     * Generate unique ID
     * Create unique identifier
     * @returns {string} Unique ID
     */
    generateId() {
        // Generate timestamp-based ID with random component
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 11);
        return `${timestamp}_${randomStr}`;
    }

    /**
     * Get spreadsheet ID from URL or create new
     * Check URL for existing ID
     * @returns {string} Spreadsheet ID
     */
    getOrCreateSpreadsheetId() {
        // Parse URL for ID
        const urlId = this.parseURL();

        // Generate new ID if not found
        if (urlId) {
            return urlId;
        }

        // Return null to trigger creation of new spreadsheet
        return null;
    }

    /**
     * Clean up
     * Release resources on shutdown
     */
    async destroy() {
        try {
            // Save any pending changes
            if (this.hasUnsavedChanges) {
                await this.save();
            }

            // Clear auto-save interval
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }

            // Destroy spreadsheet instance
            if (spreadsheetManager && spreadsheetManager.isInitialized) {
                spreadsheetManager.destroy();
            }

            this.isInitialized = false;
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// ================================================
// Application Entry Point
// ================================================

/**
 * Initialize application when DOM is ready
 * Set up app and start initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Create app instance
        const app = new GridsApp();

        // Initialize application
        const success = await app.init();

        if (!success) {
            console.error('Failed to initialize application');
            app.showError('Failed to initialize application. Please refresh the page.');
        }

        // Expose app instance globally for debugging
        window.gridsApp = app;
    } catch (error) {
        console.error('Application initialization error:', error);
    }
});

/**
 * Handle window errors
 * Global error handling
 */
window.addEventListener('error', (event) => {
    // Log error
    console.error('Application error:', event.error);

    // Show user-friendly error message
    if (window.gridsApp) {
        window.gridsApp.showError('An unexpected error occurred');
    }
});

/**
 * Handle unhandled promise rejections
 * Catch async errors
 */
window.addEventListener('unhandledrejection', (event) => {
    // Log error
    console.error('Unhandled promise rejection:', event.reason);

    // Show user-friendly error message
    if (window.gridsApp) {
        window.gridsApp.showError('An unexpected error occurred');
    }

    // Prevent default browser error handling
    event.preventDefault();
});
