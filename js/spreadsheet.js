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
        let containerElement = document.getElementById(APP_CONFIG.spreadsheet.container);
        if (containerElement === null){
            return false;
        }
        this.container = containerElement;
        this.showLoading();
        let options = this.buildOptions(initialData);
        luckysheet.create(options);
        this.data = initialData || this.createDefaultData();
        this.isInitialized = true;
        this.hideLoading();
        return true;
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
        // Create default sheet with sample data
        // Include: sheet name, row/column count, cell data
        return [{name: 'Sheet1', row: APP_CONFIG.spreadsheet.default.row, column: APP_CONFIG.spreadsheet.default.column, celldata: []}];
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
        if(!this.validateData(data)){
            console.error('Invalid Data');
            return false;
        }
        if(!this.isInitialized){
            this.initialize(data);
            return true;
        } else {
            luckysheet.destroy();
            this.isInitialized = false;
            this.initialize(data);
            return true;
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
     * Save spreadsheet data
     * Save current state to storage
     * @returns {Promise<boolean>} Success status
     */
    async save() {
        // Get current data
        // Use gridsStorage.saveSpreadsheet()
        // Handle save confirmation
        const currentData = this.getData();
        if(!currentData){
            console.error("Error saving the sheet");
            return false;
        }
        await gridsStorage.saveSpreadsheet(this.currentSheetId,currentData);
        return true;
    }

    /**
     * Load spreadsheet from storage
     * Load data from storage
     * @param {string} id - Spreadsheet ID
     * @returns {Promise<boolean>} Success status
     */
    async load(id) {
        // Use gridsStorage.loadSpreadsheet()
        // Load data into Luckysheet
       this.showLoading();
       let data = await gridsStorage.loadSpreadsheet(id);
       if(!data){
        this.hideLoading();
        return false;
       }
       await this.loadData(data);
       this.currentSheetId = id;
       this.data = data;
       this.hideLoading();
       return true;
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
        if (!data || !Array.isArray(data) || data.length === 0)
            return false;
        for (let sheet of data){
            if (!sheet.name || typeof sheet.name  !== 'string')
                return false;
            if(!sheet.celldata || !Array.isArray(sheet.celldata))
                return false;
        }
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
        // Show loading overlay element
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';
    }

    /**
     * Hide loading state
     * Hide loading overlay
     */
    hideLoading() {
        // Hide loading overlay element
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
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
}

// ================================================
// Export
// ================================================

// Initialize global spreadsheet manager instance
// Create spreadsheet manager instance when DOM is ready
const spreadsheetManager = new SpreadsheetManager();
