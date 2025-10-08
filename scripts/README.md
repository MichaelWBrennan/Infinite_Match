# Scripts Directory

This directory contains all automation and utility scripts organized by category.

## Directory Structure

- **`unity/`** - Unity-specific automation scripts
- **`automation/`** - General automation and CI/CD scripts  
- **`maintenance/`** - Health checks, monitoring, and maintenance scripts
- **`setup/`** - Initial setup and configuration scripts
- **`utilities/`** - General utility scripts and tools

## Usage

### Unity Scripts
```bash
# Run Unity automation
python unity/unity_automation_main.py

# Run Unity AI optimization
python unity/unity_ai_automation.py
```

### Automation Scripts
```bash
# Run economy automation
python automation/automated_economy_generator.py

# Run main automation
python automation/main_automation.py
```

### Maintenance Scripts
```bash
# Run health check
python maintenance/health_check.py

# Run performance monitoring
python maintenance/performance_monitor.py
```

### Setup Scripts
```bash
# One-click Unity setup
python setup/one_click_unity_setup.py
```

### Utilities
```bash
# Convert economy CSV
python utilities/convert_economy_csv.py

# Manage dependencies
python utilities/dependency_manager.py
```

## Dependencies

All scripts require the dependencies listed in `/requirements.txt`:

```bash
pip install -r requirements.txt
```