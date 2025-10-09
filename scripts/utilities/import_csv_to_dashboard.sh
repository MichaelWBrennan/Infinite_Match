#!/bin/bash
# Simple CSV to Unity Dashboard Import Script

echo "🚀 CSV to Unity Dashboard Import"
echo "================================"

# Check if CSV file exists
CSV_FILE="unity/Assets/StreamingAssets/economy_items.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file not found: $CSV_FILE"
    exit 1
fi

echo "📊 Found CSV file: $CSV_FILE"
echo "🔄 Running import process..."

# Run the Python importer
python3 scripts/csv_to_dashboard_importer.py --csv "$CSV_FILE"

echo ""
echo "✅ Import completed!"
echo "📄 Check UNITY_DASHBOARD_SETUP_INSTRUCTIONS.md for next steps"
