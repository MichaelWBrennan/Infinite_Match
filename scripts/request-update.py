#!/usr/bin/env python3
"""
Request Update Interface
Simple interface for requesting updates to your Unity Cloud project
"""

import json
import sys
from seamless_update_system import SeamlessUpdateSystem

def request_economy_update():
    """Request economy data updates"""
    print("💰 Economy Update Request")
    print("=" * 30)
    
    # Get currency updates
    print("Enter new currencies (format: id,name,type,initial,max) or 'done' to finish:")
    currencies = []
    while True:
        currency_input = input("Currency: ").strip()
        if currency_input.lower() == 'done':
            break
        if currency_input:
            currencies.append(currency_input.split(','))
    
    # Get inventory updates
    print("\nEnter new inventory items (format: id,name,type,tradable,stackable) or 'done' to finish:")
    inventory = []
    while True:
        item_input = input("Item: ").strip()
        if item_input.lower() == 'done':
            break
        if item_input:
            inventory.append(item_input.split(','))
    
    # Get catalog updates
    print("\nEnter new catalog items (format: id,name,cost_currency,cost_amount,rewards) or 'done' to finish:")
    catalog = []
    while True:
        catalog_input = input("Catalog item: ").strip()
        if catalog_input.lower() == 'done':
            break
        if catalog_input:
            catalog.append(catalog_input.split(','))
    
    description = input("\nUpdate description: ").strip() or "Economy data update"
    
    update_data = {
        "currencies": currencies,
        "inventory": inventory,
        "catalog": catalog
    }
    
    return "economy", update_data, description

def request_remote_config_update():
    """Request remote config updates"""
    print("⚙️ Remote Config Update Request")
    print("=" * 35)
    
    print("Enter config updates (JSON format) or 'done' to finish:")
    config_updates = {}
    
    while True:
        key = input("Config key: ").strip()
        if key.lower() == 'done':
            break
        
        value_input = input(f"Value for '{key}': ").strip()
        try:
            # Try to parse as JSON
            value = json.loads(value_input)
        except:
            # Treat as string if not valid JSON
            value = value_input
        
        config_updates[key] = value
    
    description = input("\nUpdate description: ").strip() or "Remote config update"
    
    return "remote_config", config_updates, description

def request_cloud_code_update():
    """Request Cloud Code updates"""
    print("☁️ Cloud Code Update Request")
    print("=" * 32)
    
    print("Enter Cloud Code function updates or 'done' to finish:")
    cloud_code_updates = {}
    
    while True:
        function_name = input("Function name: ").strip()
        if function_name.lower() == 'done':
            break
        
        print(f"Enter code for '{function_name}' (end with 'END' on new line):")
        code_lines = []
        while True:
            line = input()
            if line.strip() == 'END':
                break
            code_lines.append(line)
        
        cloud_code_updates[function_name] = '\n'.join(code_lines)
    
    description = input("\nUpdate description: ").strip() or "Cloud Code update"
    
    return "cloud_code", cloud_code_updates, description

def main():
    """Main interface"""
    print("🤖 Unity Cloud Update Request System")
    print("=" * 45)
    print("This system will:")
    print("1. Create a new branch with your changes")
    print("2. Automatically merge the branch")
    print("3. Trigger Unity Cloud update")
    print("=" * 45)
    
    # Get update type
    print("\nWhat would you like to update?")
    print("1. Economy data (currencies, inventory, catalog)")
    print("2. Remote config")
    print("3. Cloud Code functions")
    print("4. Everything")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        update_type, update_data, description = request_economy_update()
    elif choice == "2":
        update_type, update_data, description = request_remote_config_update()
    elif choice == "3":
        update_type, update_data, description = request_cloud_code_update()
    elif choice == "4":
        print("🔄 Full Update Request")
        print("This will update economy, remote config, and cloud code")
        # You would implement full update logic here
        update_type = "all"
        update_data = {}
        description = "Full system update"
    else:
        print("❌ Invalid choice")
        return
    
    # Confirm update
    print(f"\n📋 Update Summary:")
    print(f"Type: {update_type}")
    print(f"Description: {description}")
    print(f"Data: {json.dumps(update_data, indent=2)}")
    
    confirm = input("\nProceed with update? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Update cancelled")
        return
    
    # Process update
    print("\n🚀 Processing update...")
    system = SeamlessUpdateSystem()
    result = system.process_update_request(update_type, update_data, description)
    
    print(f"\n✅ Result: {result}")

if __name__ == "__main__":
    main()