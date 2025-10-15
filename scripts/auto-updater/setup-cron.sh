#!/bin/bash

# Setup cron job for daily package updates
# Run this script to set up automatic daily updates

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
UPDATE_SCRIPT="$SCRIPT_DIR/update-packages.sh"
CRON_LOG="$PROJECT_ROOT/logs/cron.log"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_status $YELLOW "Running as root. This is not recommended for cron setup."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to create log directory
create_log_dir() {
    print_status $BLUE "Creating log directory..."
    mkdir -p "$(dirname "$CRON_LOG")"
    print_status $GREEN "Log directory created: $(dirname "$CRON_LOG")"
}

# Function to setup cron job
setup_cron() {
    print_status $BLUE "Setting up cron job..."
    
    # Create cron entry
    local cron_entry="0 2 * * * cd $PROJECT_ROOT && $UPDATE_SCRIPT >> $CRON_LOG 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
        print_status $YELLOW "Cron job already exists. Updating..."
        # Remove existing entry
        crontab -l 2>/dev/null | grep -v "$UPDATE_SCRIPT" | crontab -
    fi
    
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
    
    print_status $GREEN "Cron job added successfully!"
    print_status $BLUE "Schedule: Daily at 2:00 AM"
    print_status $BLUE "Command: $UPDATE_SCRIPT"
    print_status $BLUE "Log file: $CRON_LOG"
}

# Function to verify cron job
verify_cron() {
    print_status $BLUE "Verifying cron job..."
    
    if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
        print_status $GREEN "Cron job verified successfully!"
        print_status $BLUE "Current cron jobs:"
        crontab -l 2>/dev/null | grep -v "^#"
    else
        print_status $RED "Cron job not found!"
        exit 1
    fi
}

# Function to test cron job
test_cron() {
    print_status $BLUE "Testing cron job..."
    
    # Run the update script in test mode
    if [ -f "$UPDATE_SCRIPT" ]; then
        print_status $BLUE "Running test update (check-only mode)..."
        "$UPDATE_SCRIPT" --check-only
        
        if [ $? -eq 0 ]; then
            print_status $GREEN "Test completed successfully!"
        else
            print_status $RED "Test failed!"
            exit 1
        fi
    else
        print_status $RED "Update script not found: $UPDATE_SCRIPT"
        exit 1
    fi
}

# Function to show cron status
show_status() {
    print_status $BLUE "Cron job status:"
    echo
    
    if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
        print_status $GREEN "✅ Cron job is active"
        print_status $BLUE "Schedule:"
        crontab -l 2>/dev/null | grep "$UPDATE_SCRIPT"
        echo
        print_status $BLUE "Log file: $CRON_LOG"
        if [ -f "$CRON_LOG" ]; then
            print_status $BLUE "Last log entry:"
            tail -5 "$CRON_LOG"
        else
            print_status $YELLOW "No log file found yet"
        fi
    else
        print_status $RED "❌ Cron job not found"
    fi
}

# Function to remove cron job
remove_cron() {
    print_status $BLUE "Removing cron job..."
    
    if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
        crontab -l 2>/dev/null | grep -v "$UPDATE_SCRIPT" | crontab -
        print_status $GREEN "Cron job removed successfully!"
    else
        print_status $YELLOW "No cron job found to remove"
    fi
}

# Function to show help
show_help() {
    echo "Cron Setup Script for Unity Package Auto-Updater"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --setup           Set up cron job for daily updates"
    echo "  --verify          Verify cron job is installed"
    echo "  --test            Test the update script"
    echo "  --status          Show cron job status"
    echo "  --remove          Remove cron job"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --setup        # Set up daily updates at 2 AM"
    echo "  $0 --status       # Check if cron job is active"
    echo "  $0 --test         # Test the update script"
    echo "  $0 --remove       # Remove the cron job"
}

# Main script logic
main() {
    local setup=false
    local verify=false
    local test=false
    local status=false
    local remove=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup)
                setup=true
                shift
                ;;
            --verify)
                verify=true
                shift
                ;;
            --test)
                test=true
                shift
                ;;
            --status)
                status=true
                shift
                ;;
            --remove)
                remove=true
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
    
    # If no options provided, show help
    if [ "$setup" = false ] && [ "$verify" = false ] && [ "$test" = false ] && [ "$status" = false ] && [ "$remove" = false ]; then
        show_help
        exit 0
    fi
    
    # Check if running as root
    check_root
    
    # Create log directory
    create_log_dir
    
    # Execute based on options
    if [ "$setup" = true ]; then
        setup_cron
        verify_cron
        test_cron
        print_status $GREEN "Setup complete! Daily updates will run at 2:00 AM"
    elif [ "$verify" = true ]; then
        verify_cron
    elif [ "$test" = true ]; then
        test_cron
    elif [ "$status" = true ]; then
        show_status
    elif [ "$remove" = true ]; then
        remove_cron
    fi
}

# Run main function
main "$@"