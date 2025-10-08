#!/usr/bin/env python3
"""
Unity Dashboard Form Filler
Generates JavaScript code to auto-fill Unity Dashboard forms
"""

import csv
import json
from pathlib import Path


class DashboardFormFiller:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.config_path = (
            self.repo_root
            / "unity"
            / "Assets"
            / "StreamingAssets"
            / "unity_services_config.json"
        )

    def load_config(self):
        """Load Unity Services configuration"""
        with open(self.config_path, "r") as f:
            return json.load(f)

    def generate_currency_filler(self, currencies):
        """Generate JavaScript to auto-fill currency forms"""
        js_code = (
            """
// Unity Dashboard Currency Form Filler
// Copy and paste this into browser console on Unity Dashboard

function fillCurrencyForm(currency) {
    // Fill currency form fields
    const idField = document.querySelector('input[name="id"], input[placeholder*="ID"], input[placeholder*="id"]');
    const nameField = document.querySelector('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]');
    const typeField = document.querySelector('select[name="type"], select[placeholder*="Type"], select[placeholder*="type"]');
    const initialField = document.querySelector('input[name="initial"], input[placeholder*="Initial"], input[placeholder*="initial"]');
    const maxField = document.querySelector('input[name="maximum"], input[placeholder*="Maximum"], input[placeholder*="maximum"]');

    if (idField) idField.value = currency.id;
    if (nameField) nameField.value = currency.name;
    if (typeField) {
        const option = Array.from(typeField.options).find(opt =>
            opt.value.toLowerCase().includes(currency.type.toLowerCase()) ||
            opt.text.toLowerCase().includes(currency.type.toLowerCase())
        );
        if (option) typeField.value = option.value;
    }
    if (initialField) initialField.value = currency.initial;
    if (maxField) maxField.value = currency.maximum;

    console.log(`Filled form for ${currency.name} (${currency.id})`);
}

// Currency data
const currencies = """
            + json.dumps(currencies, indent=2)
            + """;

// Auto-fill function
function autoFillCurrencies() {
    currencies.forEach((currency, index) => {
        console.log(`Filling currency ${index + 1}/${currencies.length}: ${currency.name}`);
        fillCurrencyForm(currency);

        // Wait a bit between fills
        setTimeout(() => {
            if (index < currencies.length - 1) {
                // Click create button if available
                const createBtn = document.querySelector('button[type="submit"], button:contains("Create"), button:contains("Save")');
                if (createBtn) createBtn.click();
            }
        }, 1000);
    });
}

// Run the auto-fill
console.log('Starting currency auto-fill...');
autoFillCurrencies();
"""
        )
        return js_code

    def generate_inventory_filler(self, inventory_items):
        """Generate JavaScript to auto-fill inventory item forms"""
        js_code = (
            """
// Unity Dashboard Inventory Item Form Filler
// Copy and paste this into browser console on Unity Dashboard

function fillInventoryForm(item) {
    // Fill inventory item form fields
    const idField = document.querySelector('input[name="id"], input[placeholder*="ID"], input[placeholder*="id"]');
    const nameField = document.querySelector('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]');
    const typeField = document.querySelector('select[name="type"], select[placeholder*="Type"], select[placeholder*="type"]');
    const tradableField = document.querySelector('input[name="tradable"], input[type="checkbox"]');
    const stackableField = document.querySelector('input[name="stackable"], input[type="checkbox"]');

    if (idField) idField.value = item.id;
    if (nameField) nameField.value = item.name;
    if (typeField) {
        const option = Array.from(typeField.options).find(opt =>
            opt.value.toLowerCase().includes(item.type.toLowerCase()) ||
            opt.text.toLowerCase().includes(item.type.toLowerCase())
        );
        if (option) typeField.value = option.value;
    }
    if (tradableField) tradableField.checked = item.tradable;
    if (stackableField) stackableField.checked = item.stackable;

    console.log(`Filled form for ${item.name} (${item.id})`);
}

// Inventory items data
const inventoryItems = """
            + json.dumps(inventory_items, indent=2)
            + """;

// Auto-fill function
function autoFillInventoryItems() {
    inventoryItems.forEach((item, index) => {
        console.log(`Filling inventory item ${index + 1}/${inventoryItems.length}: ${item.name}`);
        fillInventoryForm(item);

        // Wait a bit between fills
        setTimeout(() => {
            if (index < inventoryItems.length - 1) {
                // Click create button if available
                const createBtn = document.querySelector('button[type="submit"], button:contains("Create"), button:contains("Save")');
                if (createBtn) createBtn.click();
            }
        }, 1000);
    });
}

// Run the auto-fill
console.log('Starting inventory items auto-fill...');
autoFillInventoryItems();
"""
        )
        return js_code

    def generate_purchase_filler(self, virtual_purchases):
        """Generate JavaScript to auto-fill virtual purchase forms"""
        js_code = (
            """
// Unity Dashboard Virtual Purchase Form Filler
// Copy and paste this into browser console on Unity Dashboard

function fillPurchaseForm(purchase) {
    // Fill virtual purchase form fields
    const idField = document.querySelector('input[name="id"], input[placeholder*="ID"], input[placeholder*="id"]');
    const nameField = document.querySelector('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]');
    const costCurrencyField = document.querySelector('select[name="costCurrency"], select[placeholder*="Currency"]');
    const costAmountField = document.querySelector('input[name="costAmount"], input[placeholder*="Amount"]');
    const rewardCurrencyField = document.querySelector('select[name="rewardCurrency"], select[placeholder*="Reward Currency"]');
    const rewardAmountField = document.querySelector('input[name="rewardAmount"], input[placeholder*="Reward Amount"]');

    if (idField) idField.value = purchase.id;
    if (nameField) nameField.value = purchase.name;
    if (costCurrencyField) {
        const option = Array.from(costCurrencyField.options).find(opt =>
            opt.value.toLowerCase().includes(purchase.cost.currency.toLowerCase()) ||
            opt.text.toLowerCase().includes(purchase.cost.currency.toLowerCase())
        );
        if (option) costCurrencyField.value = option.value;
    }
    if (costAmountField) costAmountField.value = purchase.cost.amount;
    if (rewardCurrencyField) {
        const option = Array.from(rewardCurrencyField.options).find(opt =>
            opt.value.toLowerCase().includes(purchase.rewards[0].currency.toLowerCase()) ||
            opt.text.toLowerCase().includes(purchase.rewards[0].currency.toLowerCase())
        );
        if (option) rewardCurrencyField.value = option.value;
    }
    if (rewardAmountField) rewardAmountField.value = purchase.rewards[0].amount;

    console.log(`Filled form for ${purchase.name} (${purchase.id})`);
}

// Virtual purchases data
const virtualPurchases = """
            + json.dumps(virtual_purchases, indent=2)
            + """;

// Auto-fill function
function autoFillVirtualPurchases() {
    virtualPurchases.forEach((purchase, index) => {
        console.log(`Filling virtual purchase ${index + 1}/${virtualPurchases.length}: ${purchase.name}`);
        fillPurchaseForm(purchase);

        // Wait a bit between fills
        setTimeout(() => {
            if (index < virtualPurchases.length - 1) {
                // Click create button if available
                const createBtn = document.querySelector('button[type="submit"], button:contains("Create"), button:contains("Save")');
                if (createBtn) createBtn.click();
            }
        }, 1000);
    });
}

// Run the auto-fill
console.log('Starting virtual purchases auto-fill...');
autoFillVirtualPurchases();
"""
        )
        return js_code

    def generate_all_fillers(self):
        """Generate all form fillers"""
        config = self.load_config()

        # Generate currency filler
        currency_js = self.generate_currency_filler(
            config["services"]["economy"]["currencies"]
        )
        currency_path = self.repo_root / "dashboard_currency_filler.js"
        with open(currency_path, "w") as f:
            f.write(currency_js)

        # Generate inventory filler
        inventory_js = self.generate_inventory_filler(
            config["services"]["economy"]["inventoryItems"]
        )
        inventory_path = self.repo_root / "dashboard_inventory_filler.js"
        with open(inventory_path, "w") as f:
            f.write(inventory_js)

        # Generate purchase filler
        purchase_js = self.generate_purchase_filler(
            config["services"]["economy"]["virtualPurchases"]
        )
        purchase_path = self.repo_root / "dashboard_purchase_filler.js"
        with open(purchase_path, "w") as f:
            f.write(purchase_js)

        return currency_path, inventory_path, purchase_path

    def run(self):
        """Generate all form fillers"""
        print("🔧 Generating Unity Dashboard Form Fillers...")

        currency_path, inventory_path, purchase_path = self.generate_all_fillers()

        print(f"✅ Currency filler: {currency_path}")
        print(f"✅ Inventory filler: {inventory_path}")
        print(f"✅ Purchase filler: {purchase_path}")

        print("\n📋 How to use:")
        print("1. Open Unity Dashboard")
        print("2. Navigate to the appropriate section (Economy → Currencies, etc.)")
        print("3. Open browser console (F12)")
        print("4. Copy and paste the JavaScript code from the .js files")
        print("5. Press Enter to run the auto-fill")

        print("\n🎯 This will automatically fill all form fields for you!")


if __name__ == "__main__":
    filler = DashboardFormFiller()
    filler.run()
