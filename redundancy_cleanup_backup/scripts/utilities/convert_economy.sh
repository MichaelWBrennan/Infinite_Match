#!/bin/bash
# Quick script to convert economy CSV for Unity CLI

echo "🔄 Converting economy CSV to Unity CLI format..."

# Run the conversion script
python3 scripts/convert_economy_csv.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Conversion completed successfully!"
    echo ""
    echo "📁 Generated files:"
    echo "   📄 economy/currencies.csv"
    echo "   📦 economy/inventory.csv" 
    echo "   🛒 economy/catalog.csv"
    echo "   ⚙️  remote-config/game_config.json"
    echo "   ☁️  cloud-code/*.js"
    echo "   📊 economy_conversion_report.md"
    echo ""
    echo "🚀 Ready for Unity CLI deployment!"
else
    echo "❌ Conversion failed!"
    exit 1
fi