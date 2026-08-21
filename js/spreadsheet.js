/**
 * ================================================
 * GRIDS - Spreadsheet Module
 * ================================================
 * Manages Luckysheet spreadsheet functionality including:
 * - Initialization and configuration
 * - Data operations (load, save, export)
 * - Cell formulas and calculations
 * - Multi-sheet management
 * - Charts and visualizations
 * - Import/Export functionality
 * - Undo/Redo operations
 * - Freeze rows/columns
 *
 * Implement all spreadsheet operations
 */

// ================================================
// Spreadsheet Manager Class
// ================================================

class SpreadsheetManager {
    constructor() {
        // Initialize spreadsheet manager
        this.container = null;
        this.data = null;
        this.currentSheetId = null;
        this.options = null;
        this.isInitialized = false;
        this.currentSpreadsheetMetadata = null; // Cache spreadsheet metadata
    }

    // ================================================
    // Initialization
    // ================================================

    /**
     * Initialize Luckysheet
     * Set up Luckysheet with configuration
     * @param {object} initialData - Initial spreadsheet data
     * @returns {Promise<boolean>} Success status
     */
    async initialize(initialData = null) {
        // Get container element
        // Build Luckysheet options
        // Load initial data or create default sheet
        // Initialize Luckysheet with luckysheet.create()
        // Set up event listeners
        // Mark as initialized
        console.log('[SPREADSHEET] Starting initialization with data:', initialData);

        let containerElement = document.getElementById(APP_CONFIG.spreadsheet.container);
        if (containerElement === null){
            console.error('[SPREADSHEET] Container element not found:', APP_CONFIG.spreadsheet.container);
            this.showError('Spreadsheet container not found');
            return false;
        }

        console.log('[SPREADSHEET] Container element found:', containerElement);
        this.container = containerElement;
        this.showLoading();

        // Store data BEFORE creating Luckysheet
        this.data = initialData || this.createDefaultData();
        console.log('[SPREADSHEET] Using data:', this.data);

        let options = this.buildOptions(this.data);
        console.log('[SPREADSHEET] Built options:', options);

        try {
            console.log('[SPREADSHEET] Calling luckysheet.create...');
            luckysheet.create(options);

            // Wait a bit for Luckysheet to render
            await new Promise(resolve => setTimeout(resolve, 200));

            this.isInitialized = true;
            console.log('[SPREADSHEET] Luckysheet initialization complete');
            this.hideLoading();
            return true;
        } catch (error) {
            console.error('[SPREADSHEET] Luckysheet initialization error:', error);
            this.hideLoading();
            this.showError('Failed to initialize spreadsheet. Please refresh the page.');
            return false;
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.getElementById(APP_CONFIG.spreadsheet.container);
        if (container) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; color: var(--text-primary); text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="margin-bottom: 10px;">Spreadsheet Error</h2>
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">${message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Build Luckysheet options object
     * Construct options from APP_CONFIG
     * @returns {object} Luckysheet options
     */
    buildOptions(data = null) {
        // Build and return Luckysheet configuration
        // Include: container, data, title, lang, etc.
        let sheetData;
        if (data === null){
            sheetData = this.createDefaultData();
        } else {
            sheetData = data;
        }
        let options = {};
        options.container = APP_CONFIG.spreadsheet.container;
        // Set the data property
        options.data = sheetData;
        // Set basic display properties
        options.title = APP_CONFIG.name;
        options.lang = APP_CONFIG.spreadsheet.lang;
        options.showinfobar = APP_CONFIG.spreadsheet.showinfobar;
        options.showsheetbar = APP_CONFIG.spreadsheet.showsheetbar;
        options.showstatisticBar = APP_CONFIG.spreadsheet.showstatisticBar;
        // Set feature enabling properties
        options.enableAddRow = APP_CONFIG.spreadsheet.enableAddRow;
        options.enableAddBackTop = APP_CONFIG.spreadsheet.enableAddBackTop;
        // Set user/folder properties
        options.userInfo = APP_CONFIG.spreadsheet.userInfo;
        options.myFolderUrl = APP_CONFIG.spreadsheet.myFolderUrl;
        return options;
    }

    /**
     * Create default spreadsheet data
     * Generate initial sheet structure
     * @returns {object} Default spreadsheet data
     */
    createDefaultData() {
        console.log('[SPREADSHEET] Creating default data');
        // Create default sheet with sample data
        // Include: sheet name, row/column count, cell data
        const defaultSheet = {
            name: 'Sheet1',
            row: APP_CONFIG.spreadsheet.default.row,
            column: APP_CONFIG.spreadsheet.default.column,
            celldata: [],
            // Add required Luckysheet properties
            luckysheet_select_save: [{ row: [0, 1], column: [0, 1] }],
            luckysheet_selection_range: []
        };
        console.log('[SPREADSHEET] Default sheet created:', defaultSheet);
        return [defaultSheet];
    }

    // ================================================
    // Data Operations
    // ================================================

    /**
     * Load spreadsheet data
     * Load data into Luckysheet
     * @param {object} data - Spreadsheet data
     * @returns {Promise<boolean>} Success status
     */
    async loadData(data) {
        // Validate data structure
        // Update Luckysheet with new data
        // Handle multiple sheets
        console.log('[SPREADSHEET] loadData called with:', data);

        if(!this.validateData(data)){
            console.error('[SPREADSHEET] Invalid data structure:', data);
            return false;
        }

        try {
            if(!this.isInitialized){
                console.log('[SPREADSHEET] First initialization with data');
                const success = await this.initialize(data);
                if (!success) {
                    console.error('[SPREADSHEET] Failed to initialize');
                    return false;
                }
                return true;
            } else {
                console.log('[SPREADSHEET] Reinitializing with new data');
                luckysheet.destroy();
                this.isInitialized = false;
                // Wait for destruction to complete
                await new Promise(resolve => setTimeout(resolve, 100));
                const success = await this.initialize(data);
                if (!success) {
                    console.error('[SPREADSHEET] Failed to reinitialize');
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.error('[SPREADSHEET] Error in loadData:', error);
            this.hideLoading();
            return false;
        }
    }

    /**
     * Get current spreadsheet data
     * Extract data from Luckysheet
     * @returns {object} Current spreadsheet data
     */
    getData() {
        // Use Luckysheet API to get all sheet data
        // Return structured data object
        if (!this.isInitialized)
            return [];
        return luckysheet.getAllSheets();
    }

    /**
     * Get current sheet data
     * Get active sheet data only
     * @returns {object} Current sheet data
     */
    getCurrentSheetData() {
        // Get active sheet using Luckysheet API
        if(!this.isInitialized)
            return null;
        return luckysheet.getSheet();
    }

    /**
     * Get cached spreadsheet metadata
     * @returns {object|null} Spreadsheet metadata or null
     */
    getMetadata() {
        return this.currentSpreadsheetMetadata;
    }

    /**
     * Save spreadsheet data
     * Save current state to storage using cached metadata
     * @returns {Promise<boolean>} Success status
     */
    async save() {
        // Get current data
        console.log('[SPREADSHEET] Saving spreadsheet...');
        console.log('[SPREADSHEET] Current sheet ID:', this.currentSheetId);
        const currentSheetData = this.getData();
        if(!currentSheetData || !this.currentSheetId){
            console.error('[SPREADSHEET] Error saving - no data or sheet ID');
            return false;
        }

        // Use cached metadata instead of fetching from API
        const existingSpreadsheet = this.currentSpreadsheetMetadata || {
            name: 'Untitled Spreadsheet',
            createdAt: new Date().toISOString()
        };

        // Build complete spreadsheet object with metadata
        // IMPORTANT: Ensure the id matches exactly what we're saving to
        const spreadsheetData = {
            id: this.currentSheetId, // Use the currentSheetId as the definitive ID
            name: existingSpreadsheet.name || 'Untitled Spreadsheet',
            data: currentSheetData,
            createdAt: existingSpreadsheet.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('[SPREADSHEET] Saving spreadsheet with ID:', spreadsheetData.id);
        console.log('[SPREADSHEET] Complete spreadsheet object:', spreadsheetData);
        const success = await gridsStorage.saveSpreadsheet(this.currentSheetId, spreadsheetData);

        // Update cached metadata
        if (success) {
            this.currentSpreadsheetMetadata = spreadsheetData;
            console.log('[SPREADSHEET] Successfully saved and cached metadata');
        }

        console.log('[SPREADSHEET] Save result:', success);
        return success;
    }

    /**
     * Load spreadsheet from storage
     * Load data from storage and cache metadata
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<boolean>} Success status
     */
    async load(id) {
        this.showLoading();
        console.log('[SPREADSHEET] Loading spreadsheet with ID:', id);

        try {
            // Set currentSheetId immediately to ensure consistency
            this.currentSheetId = id;
            console.log('[SPREADSHEET] Set currentSheetId to:', this.currentSheetId);

            // Get specific spreadsheet from user data
            let spreadsheetData = await gridsStorage.getSpreadsheet(id);

            if(!spreadsheetData){
                console.error('[SPREADSHEET] No spreadsheet data found for ID:', id);
                this.currentSheetId = null; // Reset since load failed
                this.hideLoading();
                return false;
            }

            console.log('[SPREADSHEET] Retrieved spreadsheet data:', spreadsheetData);

            // Cache the metadata (id, name, dates) to avoid refetching
            this.currentSpreadsheetMetadata = {
                id: spreadsheetData.id,
                name: spreadsheetData.name,
                createdAt: spreadsheetData.createdAt,
                updatedAt: spreadsheetData.updatedAt
            };

            // Extract the actual spreadsheet data from the stored object
            let data = spreadsheetData.data || spreadsheetData;
            console.log('[SPREADSHEET] Extracted data:', data);

            // If data is an array (multiple sheets), use it directly
            let sheetData = Array.isArray(data) ? data : (data.data || data);
            console.log('[SPREADSHEET] Final sheet data:', sheetData);

            if (!sheetData || sheetData.length === 0) {
                console.error('[SPREADSHEET] Invalid or empty sheet data');
                this.currentSheetId = null; // Reset since load failed
                this.hideLoading();
                return false;
            }

            const loadSuccess = await this.loadData(sheetData);
            if (!loadSuccess) {
                console.error('[SPREADSHEET] Failed to load data into Luckysheet');
                this.currentSheetId = null; // Reset since load failed
                this.hideLoading();
                return false;
            }

            this.data = sheetData;
            this.hideLoading();
            console.log('[SPREADSHEET] Successfully loaded spreadsheet. currentSheetId:', this.currentSheetId);
            return true;
        } catch (error) {
            console.error('[SPREADSHEET] Load error:', error);
            this.currentSheetId = null; // Reset since load failed
            this.hideLoading();
            return false;
        }
    }

    // ================================================
    // Sheet Operations
    // ================================================

    /**
     * Add new sheet
     * Create new sheet in spreadsheet
     * @param {string} name - Sheet name
     * @returns {string} New sheet ID
     */
    addSheet(name = null) {
        // Use Luckysheet API to add sheet
        // Generate unique name if not provided
        if (name === null){
            name = this.generateSheetName();
        }

        const sheetObject = luckysheet.setSheetAdd({name: name});
        return sheetObject.id;
    }

    /**
     * Delete current sheet
     * Remove active sheet
     * @returns {boolean} Success status
     */
    deleteSheet() {
        // Use Luckysheet API to delete sheet
        // Prevent deleting last sheet
        if (luckysheet.getAllSheets().length === 1){
            console.error('Cannot delete the last sheet');
            return false;
        }
        luckysheet.setSheetDelete(luckysheet.getSheet().id);
        return true;
    }

    /**
     * Rename sheet
     * Change sheet name
     * @param {string} sheetId - Sheet ID
     * @param {string} newName - New name
     * @returns {boolean} Success status
     */
    renameSheet(sheetId, newName) {
        // Use Luckysheet API to rename sheet
        luckysheet.setSheetRename(sheetId,newName);
        return true;
    }

    /**
     * Duplicate sheet
     * Copy current sheet
     * @returns {string} New sheet ID
     */
    duplicateSheet() {
        // Copy active sheet data
        // Create new sheet with copied data
        let currentSheetData = luckysheet.getSheet();
        currentSheetData.name = this.generateSheetName();
        let sheetCopy = luckysheet.setSheetAdd(currentSheetData);
        return sheetCopy.id;
    }

    /**
     * Switch to sheet
     * Change active sheet
     * @param {string} sheetId - Target sheet ID
     */
    switchSheet(sheetId) {
        // Use Luckysheet API to switch sheets
        luckysheet.setSheetActivate(sheetId);
    }

    // ================================================
    // Cell Operations
    // ================================================

    /**
     * Get cell value
     * Read cell data
     * @param {string} cell - Cell reference (e.g., 'A1')
     * @returns {string|number} Cell value
     */
    getCellValue(cell) {
        // Use Luckysheet API to get cell value
        let cellIndex = this.cellToIndex(cell);
        return luckysheet.getCellValue(cellIndex.row, cellIndex.column);
    }

    /**
     * Set cell value
     * Write cell data
     * @param {string} cell - Cell reference (e.g., 'A1')
     * @param {string|number} value - Value to set
     */
    setCellValue(cell, value) {
        // Use Luckysheet API to set cell value
        const cellIndex = this.cellToIndex(cell);
        return luckysheet.setCellValue(cellIndex.row, cellIndex.column,value);

    }

    /**
     * Get selected cells
     * Get current selection
     * @returns {Array} Array of cell references
     */
    getSelectedCells() {
        // Use Luckysheet API to get selection
        return luckysheet.getRange();
    }

    /**
     * Format cells
     * Apply formatting to cells
     * @param {string|Array} cells - Cell reference(s)
     * @param {object} format - Format options
     */
    formatCells(cells, format) {
        // Apply formatting (bold, italic, color, etc.)
        const cellFormat = this.cellToIndex(cells);
        return luckysheet.setCellFormat(cellFormat.row, cellFormat.column, format);
    }

    /**
     * Merge cells
     * Merge selected cells
     * @param {string} type - Merge type ('merge', 'mergeAll', 'unmerge')
     */
    mergeCells(type = 'merge') {
        // Use Luckysheet API to merge cells
        luckysheet.setRangeMerge(type);
    }

    // ================================================
    // Formula Operations
    // ================================================

    /**
     * Execute formula
     * Calculate formula result
     * @param {string} formula - Formula string (e.g., '=SUM(A1:A10)')
     * @returns {number} Formula result
     */
    executeFormula(formula) {
        // Use Luckysheet formula engine
        return luckysheet.execFormula(formula);
    }

    /**
     * Get formula result
     * Calculate and return formula value
     * @param {string} cell - Cell with formula
     * @returns {number} Formula result
     */
    getFormulaResult(cell) {
        // Get formula and calculate result
        const formula = this.getCellValue(cell);
        return this.executeFormula(formula);
    }

    /**
     * Update formulas
     * Refresh all formula calculations
     */
    refreshFormulas() {
        // Trigger formula recalculation
        luckysheet.refresh();
    }

    // ================================================
    // Chart Operations
    // ================================================

    /**
     * Add chart
     * Create chart from selected data
     * @param {string} type - Chart type ('line', 'bar', 'pie', etc.)
     * @param {Array} dataRange - Data range for chart
     * @returns {string} Chart ID
     */
    addChart(type, dataRange) {
        // Use Luckysheet chart API
        return luckysheet.insertChart(type,dataRange);
    }

    /**
     * Delete chart
     * Remove chart from sheet
     * @param {string} chartId - Chart ID
     */
    deleteChart(chartId) {
        // Remove chart using Luckysheet API
        luckysheet.deleteChart(chartId);
    }

    /**
     * Update chart
     * Modify chart properties
     * @param {string} chartId - Chart ID
     * @param {object} options - New chart options
     */
    updateChart(chartId, options) {
        // Update chart configuration
        luckysheet.modifyChart(chartId, options);
    }

    // ================================================
    // Import/Export Operations
    // ================================================

    /**
     * Import file
     * Load data from file
     * @param {File} file - File to import
     * @returns {Promise<boolean>} Success status
     */
    async importFile(file) {
        // Validate file type
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            console.error('Invalid file type. Only CSV and Excel files are supported.');
            return false;
        }

        const reader = new FileReader();
        let fileContent;

        try {
            fileContent = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('Failed to read file'));

                // Read as text for CSV, as ArrayBuffer for Excel
                if (fileName.endsWith('.csv')) {
                    reader.readAsText(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            });
        } catch (error) {
            console.error('File reading error:', error);
            return false;
        }

        // Parse and load based on file type
        let parsedData;

        if (fileName.endsWith('.csv')) {
            // Parse CSV using Luckysheet's CSV parser
            parsedData = luckysheet.transformFileToCsv(fileContent);
        } else {
            // Parse Excel using Luckysheet's Excel parser
            parsedData = luckysheet.transformFileToSheet(fileContent);
        }

        // Load the parsed data into Luckysheet
        if (parsedData) {
            return await this.loadData(parsedData);
        } else {
            console.error('Failed to parse file');
            return false;
        }
    }

    /**
     * Export to Excel
     * Create Excel file
     * @param {string} filename - Output filename
     * @returns {Promise<boolean>} Success status
     */
    async exportToExcel(filename) {
        // Check if spreadsheet is initialized
        if (!this.isInitialized) {
            console.error('Spreadsheet not initialized');
            return false;
        }

        // Get current sheet data
        const sheetData = this.getData();
        if (!sheetData) {
            console.error('Failed to get sheet data');
            return false;
        }

        // Generate default filename if not provided
        const defaultFilename = `spreadsheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const outputFilename = filename || defaultFilename;

        try {
            // Export to Excel blob
            const excelBlob = luckysheet.exportXlsx(sheetData);

            // Create download link
            const link = document.createElement('a');
            const downloadUrl = URL.createObjectURL(excelBlob);
            link.href = downloadUrl;
            link.download = outputFilename.endsWith('.xlsx') ? outputFilename : `${outputFilename}.xlsx`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('Export to Excel failed:', error);
            return false;
        }
    }

    /**
     * Export to CSV
     * Create CSV file
     * @param {string} filename - Output filename
     * @returns {Promise<boolean>} Success status
     */
    async exportToCSV(filename) {
        // Check if spreadsheet is initialized
        if (!this.isInitialized) {
            console.error('Spreadsheet not initialized');
            return false;
        }

        // Get current sheet data (CSV only supports single sheet)
        const sheetData = this.getCurrentSheetData();
        if (!sheetData) {
            console.error('Failed to get current sheet data');
            return false;
        }

        // Generate default filename if not provided
        const defaultFilename = `sheet_${new Date().toISOString().slice(0, 10)}.csv`;
        const outputFilename = filename || defaultFilename;

        try {
            // Export to CSV string
            const csvContent = luckysheet.exportCsv(sheetData);

            // Create blob with correct MIME type
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create download link
            const link = document.createElement('a');
            const downloadUrl = URL.createObjectURL(csvBlob);
            link.href = downloadUrl;
            link.download = outputFilename.endsWith('.csv') ? outputFilename : `${outputFilename}.csv`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('Export to CSV failed:', error);
            return false;
        }
    }

    // ================================================
    // Undo/Redo Operations
    // ================================================

    /**
     * Undo last action
     * Revert last change
     */
    undo() {
        // Use Luckysheet undo functionality
        luckysheet.undo();
    }

    /**
     * Redo last undone action
     * Restore undone change
     */
    redo() {
        // Use Luckysheet redo functionality
        luckysheet.redo();
    }

    // ================================================
    // Freeze Operations
    // ================================================

    /**
     * Freeze rows
     * Freeze specified number of rows
     * @param {number} count - Number of rows to freeze
     */
    freezeRows(count) {
        // Use Luckysheet freeze API
        if (count <= 0){
            console.error('Count cannot be zero or negative');
            return;
        }
        luckysheet.frozenRowsOnly(count);
    }

    /**
     * Freeze columns
     * Freeze specified number of columns
     * @param {number} count - Number of columns to freeze
     */
    freezeColumns(count) {
        // Use Luckysheet freeze API
        if (count <= 0){
            console.error('Count cannot be zero or negative');
            return;
        }
        luckysheet.frozenColumnOnly(count);
    }

    /**
     * Freeze both rows and columns
     * Freeze at intersection point
     * @param {object} options - {rows: number, cols: number}
     */
    freeze(options) {
        // Freeze rows and columns
        luckysheet.frozenBothRowColumn(options.rows, options.cols);
    }

    /**
     * Unfreeze all
     * Remove all freezing
     */
    unfreeze() {
        // Clear freeze settings
        luckysheet.frozenCancel();
    }

    // ================================================
    // Utility Methods
    // ================================================

    /**
     * Validate data structure
     * Check if data is valid for Luckysheet
     * @param {object} data - Data to validate
     * @returns {boolean} Valid or not
     */
    validateData(data) {
        // Check required fields and structure
        console.log('[SPREADSHEET] Validating data:', data);

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('[SPREADSHEET] Data is not a valid array');
            return false;
        }

        for (let sheet of data){
            if (!sheet.name || typeof sheet.name  !== 'string') {
                console.error('[SPREADSHEET] Sheet missing name or invalid:', sheet);
                return false;
            }
            // celldata can be undefined or should be an array
            if (sheet.celldata !== undefined && !Array.isArray(sheet.celldata)) {
                console.error('[SPREADSHEET] Sheet celldata is not an array:', sheet);
                return false;
            }
        }

        console.log('[SPREADSHEET] Data validation passed');
        return true;
    }

    /**
     * Generate unique sheet name
     * Create unique sheet name
     * @param {string} baseName - Base name for sheet
     * @returns {string} Unique sheet name
     */
    generateSheetName(baseName = 'Sheet') {
        // Generate name like "Sheet1", "Sheet2", etc.
        const allSheets = luckysheet.getAllSheets();
        const existingNames = allSheets.map(sheet => sheet.name);
        let counter = 1;
        let newName = baseName + counter;
        while (existingNames.includes(newName)){
            counter++;
            newName = baseName + counter;
        }
        return newName;
    }

    /**
     * Convert cell reference to index
     * Parse "A1" to {row: 0, col: 0}
     * @param {string} cell - Cell reference
     * @returns {object} Row and column indices
     */
    cellToIndex(cell) {
        // Parse cell reference
        const match = cell.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            console.error('Invalid cell reference:', cell);
            return null;
        }
        const row = match[2];
        const column = match[1];
        let colIndex = 0;
        for(let i=0; i<column.length; i++){
            colIndex = colIndex * 26 + (column.charCodeAt(i) - 64);
        }
        colIndex--; //Subtracting 1 from colIndex to make it 0-based
        let rowIndex = parseInt(row) - 1;
        return {row: rowIndex, column: colIndex};
    }

    /**
     * Convert index to cell reference
     * Convert {row: 0, col: 0} to "A1"
     * @param {object} index - Row and column indices
     * @returns {string} Cell reference
     */
    indexToCell(index) {
        // Generate cell reference
        const rowIndex = index.row + 1;
        const colIndex = index.column;

        let column = '';
        let col = colIndex + 1; // Convert to 1-based first
        while (col > 0){
            col--; // Adjust because there's no zero in this system
            const remainder = col % 26;
            column = String.fromCharCode(65 + remainder) + column;
            col = Math.floor(col/26);
        }
        return column + rowIndex;
    }

    /**
     * Show loading state
     * Display loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading state
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.pointerEvents = 'none';
            console.log('[SPREADSHEET] Loading overlay hidden');
        }
    }

    /**
     * Show loading state
     * Display loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
            loadingOverlay.style.pointerEvents = 'auto';
            console.log('[SPREADSHEET] Loading overlay shown');
        }
    }

    /**
     * Destroy spreadsheet
     * Clean up Luckysheet instance
     */
    destroy() {
        // Call luckysheet.destroy()
        // Clear references
        luckysheet.destroy();
        this.isInitialized = false;
        this.container = null;
        this.data = null;
    }

    /**
     * Get current spreadsheet data
     * @returns {object|null} Current spreadsheet data
     */
    async getCurrentSpreadsheetData() {
        try {
            if (!this.currentSheetId) return null;

            // Load from storage
            const userData = await gridsStorage.loadUserData();
            if (!userData || !userData.spreadsheets) return null;

            const spreadsheet = userData.spreadsheets.find(s => s.id === this.currentSheetId);
            return spreadsheet || null;
        } catch (error) {
            console.error('[SPREADSHEET] Error getting spreadsheet data:', error);
            return null;
        }
    }

    /**
     * Save spreadsheet metadata
     * @param {object} metadata - Spreadsheet metadata with updated name/date
     * @returns {Promise<boolean>} Success status
     */
    async saveSpreadsheetMetadata(metadata) {
        try {
            if (!metadata.id) return false;

            // Load current user data
            const userData = await gridsStorage.loadUserData();
            if (!userData || !userData.spreadsheets) return false;

            // Find and update the spreadsheet
            const index = userData.spreadsheets.findIndex(s => s.id === metadata.id);
            if (index === -1) return false;

            // Update metadata while preserving the spreadsheet data
            const updatedSpreadsheet = {
                ...userData.spreadsheets[index],
                name: metadata.name,
                updatedAt: metadata.updatedAt
            };

            // Save to storage using the existing saveSpreadsheet method
            const success = await gridsStorage.saveSpreadsheet(metadata.id, updatedSpreadsheet);

            if (success) {
                this.currentSpreadsheetMetadata = metadata;
                console.log('[SPREADSHEET] Metadata saved successfully');
            }

            return success;
        } catch (error) {
            console.error('[SPREADSHEET] Error saving metadata:', error);
            return false;
        }
    }
}

// ================================================
// Export
// ================================================

// Initialize global spreadsheet manager instance
// Create spreadsheet manager instance when DOM is ready
const spreadsheetManager = new SpreadsheetManager();
