#!/bin/bash

# Unity Package & SDK Auto-Updater
# Manual execution script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UNITY_PROJECT_PATH="$PROJECT_ROOT/unity-refactored"
CONFIG_FILE="$SCRIPT_DIR/updater-config.yaml"
LOG_DIR="$PROJECT_ROOT/logs"
REPORTS_DIR="$PROJECT_ROOT/reports"
BACKUPS_DIR="$PROJECT_ROOT/backups"

# Create necessary directories
mkdir -p "$LOG_DIR" "$REPORTS_DIR" "$BACKUPS_DIR"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show help
show_help() {
    echo "Unity Package & SDK Auto-Updater"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --check-only          Only check for updates, don't apply them"
    echo "  --force-update        Force update even if no updates available"
    echo "  --update-major        Include major version updates with breaking changes"
    echo "  --dry-run             Show what would be updated without making changes"
    echo "  --backup-only         Create backup without updating"
    echo "  --rollback <backup>   Rollback to specific backup"
    echo "  --list-backups        List available backups"
    echo "  --test-build          Test build after updates"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run normal update process"
    echo "  $0 --check-only       # Check for updates only"
    echo "  $0 --dry-run          # Preview updates without applying"
    echo "  $0 --rollback backup_20241201_120000  # Rollback to specific backup"
    echo "  $0 --list-backups     # List available backups"
}

# Function to check dependencies
check_dependencies() {
    print_status $BLUE "Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_status $RED "Python 3 is required but not installed."
        exit 1
    fi
    
    # Check pip packages
    if ! python3 -c "import requests, yaml" &> /dev/null; then
        print_status $YELLOW "Installing required Python packages..."
        pip3 install requests pyyaml
    fi
    
    # Check Unity (optional)
    if ! command -v Unity &> /dev/null; then
        print_status $YELLOW "Unity not found in PATH. Some features may not work."
    fi
    
    print_status $GREEN "Dependencies check complete."
}

# Function to check for updates
check_updates() {
    print_status $BLUE "Checking for package updates..."
    
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_DIR/package-updater.py" --check-only
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Update check complete."
    else
        print_status $RED "Update check failed."
        exit 1
    fi
}

# Function to run dry run
dry_run() {
    print_status $BLUE "Running dry run (preview mode)..."
    
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_DIR/package-updater.py" --dry-run
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Dry run complete."
    else
        print_status $RED "Dry run failed."
        exit 1
    fi
}

# Function to create backup
create_backup() {
    print_status $BLUE "Creating backup..."
    
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_DIR/package-updater.py" --backup-only
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Backup created successfully."
    else
        print_status $RED "Backup creation failed."
        exit 1
    fi
}

# Function to list backups
list_backups() {
    print_status $BLUE "Available backups:"
    
    if [ -d "$BACKUPS_DIR" ]; then
        ls -la "$BACKUPS_DIR" | grep "backup_" | awk '{print $9, $6, $7, $8}'
    else
        print_status $YELLOW "No backups found."
    fi
}

# Function to rollback
rollback() {
    local backup_name=$1
    
    if [ -z "$backup_name" ]; then
        print_status $RED "Backup name required for rollback."
        echo "Use --list-backups to see available backups."
        exit 1
    fi
    
    print_status $BLUE "Rolling back to: $backup_name"
    
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_DIR/package-updater.py" --rollback "$backup_name"
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Rollback completed successfully."
    else
        print_status $RED "Rollback failed."
        exit 1
    fi
}

# Function to test build
test_build() {
    print_status $BLUE "Testing build..."
    
    if ! command -v Unity &> /dev/null; then
        print_status $YELLOW "Unity not found, skipping build test."
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    Unity -batchmode -quit -projectPath "$UNITY_PROJECT_PATH" -executeMethod "Evergreen.Editor.BuildScript.TestBuild"
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Build test passed."
    else
        print_status $RED "Build test failed."
        exit 1
    fi
}

# Function to run full update
run_update() {
    local force_update=$1
    local update_major=$2
    
    print_status $BLUE "Starting package update process..."
    
    # Check dependencies
    check_dependencies
    
    # Create backup
    create_backup
    
    # Run updates
    cd "$PROJECT_ROOT"
    python3 "$SCRIPT_DIR/package-updater.py" \
        --force-update="$force_update" \
        --update-major="$update_major"
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "Package updates completed successfully."
        
        # Test build
        test_build
        
        print_status $GREEN "All updates completed and tested successfully!"
    else
        print_status $RED "Package updates failed."
        exit 1
    fi
}

# Main script logic
main() {
    local check_only=false
    local force_update=false
    local update_major=false
    local dry_run=false
    local backup_only=false
    local rollback_backup=""
    local list_backups=false
    local test_build_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-only)
                check_only=true
                shift
                ;;
            --force-update)
                force_update=true
                shift
                ;;
            --update-major)
                update_major=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --backup-only)
                backup_only=true
                shift
                ;;
            --rollback)
                rollback_backup="$2"
                shift 2
                ;;
            --list-backups)
                list_backups=true
                shift
                ;;
            --test-build)
                test_build_only=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_status $RED "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Execute based on options
    if [ "$check_only" = true ]; then
        check_updates
    elif [ "$dry_run" = true ]; then
        dry_run
    elif [ "$backup_only" = true ]; then
        create_backup
    elif [ "$list_backups" = true ]; then
        list_backups
    elif [ -n "$rollback_backup" ]; then
        rollback "$rollback_backup"
    elif [ "$test_build_only" = true ]; then
        test_build
    else
        run_update "$force_update" "$update_major"
    fi
}

# Run main function
main "$@"