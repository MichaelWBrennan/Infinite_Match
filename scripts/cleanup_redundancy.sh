#!/bin/bash
# Redundancy Cleanup Script

echo "🧹 Starting Redundancy Cleanup"
echo "=============================="

# Create backup directory
BACKUP_DIR="redundant_files_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"

# Move redundant CSV processing files
echo "🔄 Moving redundant CSV processing files..."
mv scripts/utilities/convert_economy_csv.py "$BACKUP_DIR/" 2>/dev/null || echo "   convert_economy_csv.py not found"
mv scripts/csv_to_dashboard_importer.py "$BACKUP_DIR/" 2>/dev/null || echo "   csv_to_dashboard_importer.py not found"
mv scripts/unity/setup_unity_economy.py "$BACKUP_DIR/" 2>/dev/null || echo "   setup_unity_economy.py not found"

# Move redundant Unity setup files
echo "🔄 Moving redundant Unity setup files..."
mv scripts/unity/unity_dashboard_setup_assistant.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_dashboard_setup_assistant.py not found"
mv scripts/unity/one_click_unity_setup.py "$BACKUP_DIR/" 2>/dev/null || echo "   one_click_unity_setup.py not found"

# Move redundant browser automation files
echo "🔄 Moving redundant browser automation files..."
mv scripts/unity/unity_browser_automation.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_browser_automation.py not found"
mv scripts/unity/unity_dashboard_browser_automation.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_dashboard_browser_automation.py not found"
mv scripts/unity/unity_cloud_automation.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_cloud_automation.py not found"
mv scripts/unity/unity_cloud_console_automation.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_cloud_console_automation.py not found"

# Move redundant API automation files
echo "🔄 Moving redundant API automation files..."
mv scripts/unity/unity_api_automation.py "$BACKUP_DIR/" 2>/dev/null || echo "   unity_api_automation.py not found"

# Move redundant Unity Editor files
echo "🔄 Moving redundant Unity Editor files..."
mv unity/Assets/Editor/CSVToDashboardImporter.cs "$BACKUP_DIR/" 2>/dev/null || echo "   CSVToDashboardImporter.cs not found"

echo ""
echo "✅ Cleanup completed!"
echo "📁 Redundant files moved to: $BACKUP_DIR"
echo "🎯 Use scripts/unified_economy_processor.py for all economy processing"
