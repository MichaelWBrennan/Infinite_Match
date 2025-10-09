/**
 * Data Loader
 * Handles loading and parsing of various data formats
 */

import { readFile } from 'fs/promises';
import { Logger } from '../core/logger/index.js';
import { ValidationError } from '../core/errors/ErrorHandler.js';

const logger = new Logger('DataLoader');

export class DataLoader {
  constructor() {
    this.parsers = new Map();
    this.registerDefaultParsers();
  }

  /**
   * Register a custom parser for a file type
   * @param {string} extension - File extension (e.g., '.csv', '.json')
   * @param {Function} parser - Parser function
   */
  registerParser(extension, parser) {
    this.parsers.set(extension, parser);
    logger.debug(`Registered parser for ${extension}`);
  }

  /**
   * Register default parsers
   */
  registerDefaultParsers() {
    this.registerParser('.csv', this.parseCSV.bind(this));
    this.registerParser('.json', this.parseJSON.bind(this));
  }

  /**
   * Load data from a file
   * @param {string} filePath - Path to the file
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Parsed data
   */
  async loadFile(filePath, options = {}) {
    try {
      logger.debug(`Loading file: ${filePath}`);
      const content = await readFile(filePath, 'utf8');

      const extension = this.getFileExtension(filePath);
      const parser = this.parsers.get(extension);

      if (!parser) {
        throw new ValidationError(
          `No parser found for file type: ${extension}`,
          'fileType'
        );
      }

      const data = await parser(content, options);
      logger.info(`Loaded ${data.length} records from ${filePath}`);
      return data;
    } catch (error) {
      logger.error(`Failed to load file ${filePath}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Load multiple files
   * @param {Array} filePaths - Array of file paths
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Object with file paths as keys and data as values
   */
  async loadFiles(filePaths, options = {}) {
    const results = {};

    try {
      const promises = filePaths.map(async (filePath) => {
        const data = await this.loadFile(filePath, options);
        return { filePath, data };
      });

      const loadedFiles = await Promise.all(promises);

      for (const { filePath, data } of loadedFiles) {
        const fileName = this.getFileName(filePath);
        results[fileName] = data;
      }

      logger.info(`Loaded ${filePaths.length} files successfully`);
      return results;
    } catch (error) {
      logger.error('Failed to load files', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse CSV content
   * @param {string} content - CSV content
   * @param {Object} options - Parsing options
   * @returns {Array} Parsed data
   */
  parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) {
        logger.warn(`Skipping malformed CSV line ${i + 1}: ${line}`);
        continue;
      }

      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = this.parseValue(values[j]);
      }
      data.push(record);
    }

    return data;
  }

  /**
   * Parse JSON content
   * @param {string} content - JSON content
   * @param {Object} options - Parsing options
   * @returns {Array} Parsed data
   */
  parseJSON(content) {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new ValidationError(
        `Invalid JSON format: ${error.message}`,
        'jsonFormat'
      );
    }
  }

  /**
   * Parse a single CSV line
   * @param {string} line - CSV line
   * @returns {Array} Parsed values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Parse a value based on its content
   * @param {string} value - Value to parse
   * @returns {*} Parsed value
   */
  parseValue(value) {
    if (value === '') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    return value;
  }

  /**
   * Get file extension
   * @param {string} filePath - File path
   * @returns {string} File extension
   */
  getFileExtension(filePath) {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot !== -1 ? filePath.substring(lastDot) : '';
  }

  /**
   * Get file name without extension
   * @param {string} filePath - File path
   * @returns {string} File name
   */
  getFileName(filePath) {
    const fileName = filePath.split('/').pop();
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
  }
}

export default DataLoader;
