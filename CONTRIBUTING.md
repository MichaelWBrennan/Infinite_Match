# Contributing Guidelines

Thank you for your interest in contributing to the Evergreen Match-3 Unity project! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project follows a code of conduct that ensures a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**:
   ```bash
   npm run install:all
   pip install -r requirements.txt
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### File Organization

Follow the established project structure:
- **Scripts**: Place in appropriate subdirectory under `/scripts/`
- **Documentation**: Place in appropriate subdirectory under `/docs/`
- **Configuration**: Place in `/config/` with appropriate subdirectory
- **Unity Assets**: Place in `/unity/Assets/` following Unity conventions

## Coding Standards

### Python Scripts

```python
#!/usr/bin/env python3
"""
Script description and purpose.
"""

import os
import sys
from typing import Dict, List, Optional

class ScriptName:
    """Class description."""
    
    def __init__(self, config: Dict[str, str]):
        """Initialize with configuration."""
        self.config = config
    
    def method_name(self, param: str) -> Optional[str]:
        """Method description.
        
        Args:
            param: Parameter description
            
        Returns:
            Return value description
        """
        # Implementation
        pass

if __name__ == "__main__":
    # Main execution
    pass
```

**Python Standards:**
- Use type hints for all function parameters and return values
- Follow PEP 8 style guide
- Use descriptive variable and function names
- Add docstrings for all classes and methods
- Use snake_case for variables and functions
- Use PascalCase for class names

### JavaScript/Node.js

```javascript
/**
 * Module description
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

/**
 * Class description
 */
class ServiceName {
    /**
     * Constructor description
     * @param {Object} config - Configuration object
     */
    constructor(config) {
        this.config = config;
    }
    
    /**
     * Method description
     * @param {string} param - Parameter description
     * @returns {Promise<string>} Return value description
     */
    async methodName(param) {
        // Implementation
    }
}

module.exports = ServiceName;
```

**JavaScript Standards:**
- Use JSDoc comments for all functions
- Use camelCase for variables and functions
- Use PascalCase for class names
- Use const/let instead of var
- Use async/await instead of callbacks when possible

### C# (Unity Scripts)

```csharp
using UnityEngine;
using System.Collections.Generic;

namespace Evergreen.Game
{
    /// <summary>
    /// Class description
    /// </summary>
    public class ScriptName : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private string configValue;
        
        [Header("References")]
        [SerializeField] private Transform targetTransform;
        
        /// <summary>
        /// Method description
        /// </summary>
        /// <param name="param">Parameter description</param>
        /// <returns>Return value description</returns>
        public string MethodName(string param)
        {
            // Implementation
            return string.Empty;
        }
    }
}
```

**C# Standards:**
- Use PascalCase for public members
- Use camelCase for private fields
- Use descriptive names for all members
- Add XML documentation for public APIs
- Use proper access modifiers
- Follow Unity naming conventions

## Commit Guidelines

Use conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(scripts): add Unity automation script
fix(server): resolve authentication issue
docs(readme): update installation instructions
refactor(config): consolidate configuration files
```

## Pull Request Process

1. **Ensure your branch is up to date** with the main branch
2. **Run tests** to ensure nothing is broken
3. **Update documentation** if needed
4. **Create a descriptive PR title** and description
5. **Link any related issues** using keywords like "Fixes #123"
6. **Request review** from appropriate team members

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

## Testing

### Python Scripts
```bash
# Run specific script tests
python -m pytest scripts/tests/test_script_name.py

# Run all tests
python -m pytest scripts/tests/
```

### Node.js/Server
```bash
# Run server tests
cd server && npm test

# Run with coverage
cd server && npm run test:coverage
```

### Unity
- Use Unity Test Runner for C# unit tests
- Test scripts in appropriate test scenes
- Ensure all public APIs are tested

## Documentation

### Adding New Documentation

1. **Choose appropriate directory**:
   - `docs/guides/` - How-to guides and tutorials
   - `docs/setup/` - Setup and installation instructions
   - `docs/features/` - Feature documentation
   - `docs/reports/` - Analysis and test reports

2. **Follow naming convention**: `kebab-case.md`

3. **Update main documentation index** in `docs/README.md`

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Use proper markdown formatting
- Add table of contents for long documents
- Include screenshots for UI-related documentation

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Contact the maintainers

Thank you for contributing! 🎮