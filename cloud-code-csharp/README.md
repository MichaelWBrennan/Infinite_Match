# Unity Cloud Code - C# Functions

This directory contains C# cloud code functions for your Unity project's economy system.

## Project Structure

```
cloud-code-csharp/
├── cloud-code.csproj          # .NET project file
├── cloud-code-config.json     # Function configuration
├── README.md                  # This file
└── src/                       # Source code directory
    ├── AddCurrency.cs         # Add currency to player
    ├── SpendCurrency.cs       # Deduct currency from player
    ├── AddInventoryItem.cs    # Add item to inventory
    ├── UseInventoryItem.cs    # Consume inventory item
    └── ValidationUtils.cs     # Shared validation utilities
```

## Functions

### AddCurrency
Adds currency to a player's account.

**Parameters:**
- `currencyId` (string, required): ID of the currency to add
- `amount` (int, required): Amount of currency to add

**Returns:**
- `success` (bool): Whether the operation succeeded
- `currencyId` (string): The currency ID that was added
- `amount` (int): The amount that was added

### SpendCurrency
Deducts currency from a player's account.

**Parameters:**
- `currencyId` (string, required): ID of the currency to spend
- `amount` (int, required): Amount of currency to spend

**Returns:**
- `success` (bool): Whether the operation succeeded
- `currencyId` (string): The currency ID that was spent
- `amount` (int): The amount that was spent
- `newBalance` (int): The player's new balance

### AddInventoryItem
Adds an item to a player's inventory.

**Parameters:**
- `itemId` (string, required): ID of the item to add
- `quantity` (int, optional): Quantity of items to add (default: 1)

**Returns:**
- `success` (bool): Whether the operation succeeded
- `itemId` (string): The item ID that was added
- `quantity` (int): The quantity that was added

### UseInventoryItem
Consumes an inventory item.

**Parameters:**
- `itemId` (string, required): ID of the item to use
- `quantity` (int, optional): Quantity of items to use (default: 1)

**Returns:**
- `success` (bool): Whether the operation succeeded
- `itemId` (string): The item ID that was used
- `quantity` (int): The quantity that was used
- `remainingQuantity` (int): Remaining quantity in inventory

## Deployment

To deploy these functions to Unity Cloud Code:

1. Install Unity CLI:
   ```bash
   npm install -g @unity/cloud-code-cli
   ```

2. Login to Unity:
   ```bash
   unity auth login
   ```

3. Deploy functions:
   ```bash
   unity cloud-code deploy --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 --environment-id 1d8c470b-d8d2-4a72-88f6
   ```

## Development

### Prerequisites
- .NET 6.0 or later
- Unity Gaming Services SDK

### Building
```bash
dotnet build
```

### Testing
```bash
dotnet test
```

## Validation

The `ValidationUtils` class provides common validation functions:
- `ValidateParameters`: Validates required parameters
- `IsValidCurrencyId`: Validates currency ID format
- `IsValidItemId`: Validates item ID format
- `IsPositiveInteger`: Validates positive integers
- `IsNonNegativeInteger`: Validates non-negative integers
- `IsValidStringLength`: Validates string length

## Error Handling

All functions include comprehensive error handling:
- Parameter validation
- Business logic validation
- Exception catching and logging
- Meaningful error messages

## Logging

Functions use Unity's built-in logging system:
- `Logger.LogInfo()` for successful operations
- `Logger.LogError()` for errors and exceptions