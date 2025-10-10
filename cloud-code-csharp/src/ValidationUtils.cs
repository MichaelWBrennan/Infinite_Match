using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace CloudCode.Utils
{
    public static class ValidationUtils
    {
        /// <summary>
        /// Validate required parameters
        /// </summary>
        /// <param name="parameters">Parameters to validate</param>
        /// <param name="requiredFields">Array of required field names</param>
        /// <param name="validators">Optional custom validators for each field</param>
        /// <returns>Validation result with IsValid and Errors</returns>
        public static ValidationResult ValidateParameters(
            Dictionary<string, object> parameters, 
            string[] requiredFields, 
            Dictionary<string, Func<object, bool>> validators = null)
        {
            var errors = new List<string>();
            
            foreach (var field in requiredFields)
            {
                if (!parameters.ContainsKey(field) || parameters[field] == null)
                {
                    errors.Add($"{field} is required");
                }
                else if (validators != null && validators.ContainsKey(field) && !validators[field](parameters[field]))
                {
                    errors.Add($"Invalid {field}");
                }
            }
            
            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }

        /// <summary>
        /// Validate currency ID format
        /// </summary>
        public static bool IsValidCurrencyId(object value)
        {
            if (value is not string currencyId) return false;
            return !string.IsNullOrEmpty(currencyId) && 
                   Regex.IsMatch(currencyId, @"^[a-zA-Z0-9_]+$") && 
                   currencyId.Length <= 50;
        }

        /// <summary>
        /// Validate item ID format
        /// </summary>
        public static bool IsValidItemId(object value)
        {
            if (value is not string itemId) return false;
            return !string.IsNullOrEmpty(itemId) && 
                   Regex.IsMatch(itemId, @"^[a-zA-Z0-9_]+$") && 
                   itemId.Length <= 50;
        }

        /// <summary>
        /// Validate positive integer
        /// </summary>
        public static bool IsPositiveInteger(object value)
        {
            if (value is int intValue) return intValue > 0;
            if (value is long longValue) return longValue > 0;
            if (value is string stringValue) return int.TryParse(stringValue, out int parsed) && parsed > 0;
            return false;
        }

        /// <summary>
        /// Validate non-negative integer
        /// </summary>
        public static bool IsNonNegativeInteger(object value)
        {
            if (value is int intValue) return intValue >= 0;
            if (value is long longValue) return longValue >= 0;
            if (value is string stringValue) return int.TryParse(stringValue, out int parsed) && parsed >= 0;
            return false;
        }

        /// <summary>
        /// Validate string length
        /// </summary>
        public static bool IsValidStringLength(object value, int maxLength)
        {
            if (value is not string stringValue) return false;
            return !string.IsNullOrEmpty(stringValue) && stringValue.Length <= maxLength;
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}