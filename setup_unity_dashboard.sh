#!/bin/bash
echo "🎮 Unity Cloud Setup - Evergreen Puzzler"
echo "========================================"
echo ""
echo "Project ID: 0dd5a03e-7f23-49c4-964e-7919c48c0574"
echo "Environment ID: 1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
echo ""
echo "Opening Unity Dashboard..."
if command -v xdg-open > /dev/null; then
    xdg-open "https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
elif command -v open > /dev/null; then
    open "https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
else
    echo "Please manually open: https://dashboard.unity3d.com/organizations/0dd5a03e-7f23-49c4-964e-7919c48c0574/projects/0dd5a03e-7f23-49c4-964e-7919c48c0574/environments/1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d"
fi
echo ""
echo "Please follow the instructions in UNITY_DASHBOARD_QUICK_SETUP.md"
echo ""
read -p "Press Enter to continue..."
