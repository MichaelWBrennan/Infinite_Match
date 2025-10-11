export class EconomyValidator {
    currencyRules: {
        required: string[];
        optional: string[];
        types: {
            id: string;
            name: string;
            type: string;
            initial: string;
            maximum: string;
            isTradable: string;
            isConsumable: string;
        };
    };
    inventoryRules: {
        required: string[];
        optional: string[];
        types: {
            id: string;
            name: string;
            type: string;
            description: string;
            rarity: string;
            category: string;
            tradable: string;
            stackable: string;
            iconPath: string;
        };
    };
    catalogRules: {
        required: string[];
        optional: string[];
        types: {
            id: string;
            name: string;
            cost_currency: string;
            cost_amount: string;
            description: string;
            type: string;
            rewards: string;
            category: string;
            rarity: string;
            isActive: string;
        };
    };
    /**
     * Validate currency data
     * @param {Array} currencies - Currency data
     * @returns {Array} Validated currencies
     */
    validateCurrencies(currencies: any[]): any[];
    /**
     * Validate inventory data
     * @param {Array} inventory - Inventory data
     * @returns {Array} Validated inventory items
     */
    validateInventory(inventory: any[]): any[];
    /**
     * Validate catalog data
     * @param {Array} catalog - Catalog data
     * @returns {Array} Validated catalog items
     */
    validateCatalog(catalog: any[]): any[];
    /**
     * Generic data validation
     * @param {Array} data - Data to validate
     * @param {Object} rules - Validation rules
     * @param {string} dataType - Type of data being validated
     * @returns {Array} Validated data
     */
    validateData(data: any[], rules: Object, dataType: string): any[];
    /**
     * Validate a single item
     * @param {Object} item - Item to validate
     * @param {Object} rules - Validation rules
     * @param {string} dataType - Type of data
     * @param {number} index - Item index
     * @returns {Object} Validated item
     */
    validateItem(item: Object, rules: Object, dataType: string, index: number): Object;
    /**
     * Validate field type and apply transformations
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @param {string} expectedType - Expected type
     * @param {number} index - Item index
     * @returns {*} Validated and transformed value
     */
    validateFieldType(field: string, value: any, expectedType: string, index: number): any;
    /**
     * Apply field mappings and defaults
     * @param {Object} item - Item to map
     * @param {Object} rules - Validation rules
     * @param {string} dataType - Type of data
     * @returns {Object} Mapped item
     */
    applyFieldMappings(item: Object, rules: Object, dataType: string): Object;
    /**
     * Parse boolean value
     * @param {*} value - Value to parse
     * @returns {boolean} Parsed boolean
     */
    parseBoolean(value: any): boolean;
    /**
     * Get validation statistics
     * @param {Array} originalData - Original data
     * @param {Array} validatedData - Validated data
     * @returns {Object} Validation statistics
     */
    getValidationStats(originalData: any[], validatedData: any[]): Object;
}
export default EconomyValidator;
//# sourceMappingURL=EconomyValidator.d.ts.map