export class DataLoader {
    parsers: Map<any, any>;
    /**
     * Register a custom parser for a file type
     * @param {string} extension - File extension (e.g., '.csv', '.json')
     * @param {Function} parser - Parser function
     */
    registerParser(extension: string, parser: Function): void;
    /**
     * Register default parsers
     */
    registerDefaultParsers(): void;
    /**
     * Load data from a file
     * @param {string} filePath - Path to the file
     * @param {Object} options - Loading options
     * @returns {Promise<Array>} Parsed data
     */
    loadFile(filePath: string, options?: Object): Promise<any[]>;
    /**
     * Load multiple files
     * @param {Array} filePaths - Array of file paths
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Object with file paths as keys and data as values
     */
    loadFiles(filePaths: any[], options?: Object): Promise<Object>;
    /**
     * Parse CSV content
     * @param {string} content - CSV content
     * @param {Object} options - Parsing options
     * @returns {Array} Parsed data
     */
    parseCSV(content: string): any[];
    /**
     * Parse JSON content
     * @param {string} content - JSON content
     * @param {Object} options - Parsing options
     * @returns {Array} Parsed data
     */
    parseJSON(content: string): any[];
    /**
     * Parse a single CSV line
     * @param {string} line - CSV line
     * @returns {Array} Parsed values
     */
    parseCSVLine(line: string): any[];
    /**
     * Parse a value based on its content
     * @param {string} value - Value to parse
     * @returns {*} Parsed value
     */
    parseValue(value: string): any;
    /**
     * Get file extension
     * @param {string} filePath - File path
     * @returns {string} File extension
     */
    getFileExtension(filePath: string): string;
    /**
     * Get file name without extension
     * @param {string} filePath - File path
     * @returns {string} File name
     */
    getFileName(filePath: string): string;
}
export default DataLoader;
//# sourceMappingURL=DataLoader.d.ts.map