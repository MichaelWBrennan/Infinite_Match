# Coding Standards

This document outlines the coding standards and best practices for the Evergreen Match-3 Unity project.

## Table of Contents

- [General Principles](#general-principles)
- [Python Standards](#python-standards)
- [JavaScript/Node.js Standards](#javascriptnodejs-standards)
- [C# Unity Standards](#c-unity-standards)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Documentation Standards](#documentation-standards)
- [Testing Standards](#testing-standards)

## General Principles

1. **Readability First**: Code should be self-documenting and easy to understand
2. **Consistency**: Follow established patterns and conventions
3. **Maintainability**: Write code that's easy to modify and extend
4. **Performance**: Consider performance implications, especially in Unity
5. **Security**: Follow security best practices for all code

## Python Standards

### Code Style

```python
#!/usr/bin/env python3
"""
Module docstring describing the purpose and functionality.
"""

import os
import sys
from typing import Dict, List, Optional, Union
from dataclasses import dataclass

@dataclass
class ConfigData:
    """Configuration data structure."""
    api_key: str
    timeout: int = 30
    retries: int = 3

class ServiceManager:
    """Manages service connections and operations."""
    
    def __init__(self, config: ConfigData):
        """Initialize service manager with configuration.
        
        Args:
            config: Configuration data for the service
        """
        self.config = config
        self._connection = None
    
    def connect(self) -> bool:
        """Establish connection to the service.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Implementation
            return True
        except Exception as e:
            self._log_error(f"Connection failed: {e}")
            return False
    
    def _log_error(self, message: str) -> None:
        """Log error message.
        
        Args:
            message: Error message to log
        """
        print(f"ERROR: {message}")

if __name__ == "__main__":
    # Main execution
    config = ConfigData(api_key="test-key")
    manager = ServiceManager(config)
    manager.connect()
```

### Python Guidelines

- **Type Hints**: Use type hints for all function parameters and return values
- **Docstrings**: Use Google-style docstrings for all classes and methods
- **Imports**: Group imports (standard library, third-party, local) with blank lines
- **Line Length**: Maximum 88 characters (Black formatter standard)
- **Naming**: 
  - Variables and functions: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: `_leading_underscore`

## JavaScript/Node.js Standards

### Code Style

```javascript
/**
 * Service manager for handling API operations
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

/**
 * Configuration options for the service
 * @typedef {Object} ServiceConfig
 * @property {string} apiKey - API key for authentication
 * @property {number} timeout - Request timeout in milliseconds
 * @property {number} retries - Number of retry attempts
 */

/**
 * Service manager class
 */
class ServiceManager {
    /**
     * Create a new service manager
     * @param {ServiceConfig} config - Configuration options
     */
    constructor(config) {
        this.config = {
            apiKey: config.apiKey,
            timeout: config.timeout || 30000,
            retries: config.retries || 3
        };
        this.connection = null;
    }
    
    /**
     * Establish connection to the service
     * @returns {Promise<boolean>} True if connection successful
     */
    async connect() {
        try {
            // Implementation
            return true;
        } catch (error) {
            this.logError(`Connection failed: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Log error message
     * @param {string} message - Error message to log
     * @private
     */
    logError(message) {
        console.error(`ERROR: ${message}`);
    }
}

module.exports = ServiceManager;
```

### JavaScript Guidelines

- **JSDoc**: Use JSDoc comments for all functions and classes
- **ES6+**: Use modern JavaScript features (const/let, arrow functions, destructuring)
- **Async/Await**: Prefer async/await over callbacks and promises
- **Naming**:
  - Variables and functions: `camelCase`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: `_leadingUnderscore`

## C# Unity Standards

### Code Style

```csharp
using UnityEngine;
using System.Collections.Generic;
using System;

namespace Evergreen.Game
{
    /// <summary>
    /// Manages game state and core functionality
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        #region Fields
        
        [Header("Configuration")]
        [SerializeField] private GameConfig gameConfig;
        [SerializeField] private float gameSpeed = 1.0f;
        
        [Header("References")]
        [SerializeField] private BoardManager boardManager;
        [SerializeField] private UIManager uiManager;
        
        // Private fields
        private GameState currentState;
        private int currentScore;
        private bool isGamePaused;
        
        #endregion
        
        #region Properties
        
        /// <summary>
        /// Current game state
        /// </summary>
        public GameState CurrentState 
        { 
            get => currentState; 
            private set => currentState = value; 
        }
        
        /// <summary>
        /// Current player score
        /// </summary>
        public int CurrentScore 
        { 
            get => currentScore; 
            private set => currentScore = value; 
        }
        
        #endregion
        
        #region Unity Lifecycle
        
        private void Awake()
        {
            InitializeGame();
        }
        
        private void Start()
        {
            StartGame();
        }
        
        #endregion
        
        #region Public Methods
        
        /// <summary>
        /// Start a new game
        /// </summary>
        public void StartNewGame()
        {
            ResetGame();
            CurrentState = GameState.Playing;
            OnGameStarted?.Invoke();
        }
        
        /// <summary>
        /// Pause or resume the game
        /// </summary>
        /// <param name="pause">True to pause, false to resume</param>
        public void SetPaused(bool pause)
        {
            isGamePaused = pause;
            Time.timeScale = pause ? 0f : 1f;
            OnGamePaused?.Invoke(pause);
        }
        
        #endregion
        
        #region Private Methods
        
        /// <summary>
        /// Initialize game systems
        /// </summary>
        private void InitializeGame()
        {
            // Implementation
        }
        
        /// <summary>
        /// Reset game to initial state
        /// </summary>
        private void ResetGame()
        {
            currentScore = 0;
            isGamePaused = false;
            Time.timeScale = 1f;
        }
        
        #endregion
        
        #region Events
        
        /// <summary>
        /// Invoked when game starts
        /// </summary>
        public event Action OnGameStarted;
        
        /// <summary>
        /// Invoked when game is paused or resumed
        /// </summary>
        public event Action<bool> OnGamePaused;
        
        #endregion
    }
    
    /// <summary>
    /// Enumeration of possible game states
    /// </summary>
    public enum GameState
    {
        Menu,
        Playing,
        Paused,
        GameOver
    }
}
```

### C# Guidelines

- **Regions**: Use regions to organize code sections
- **XML Documentation**: Use XML documentation for all public members
- **Naming**:
  - Public members: `PascalCase`
  - Private fields: `camelCase` with underscore prefix
  - Properties: `PascalCase`
  - Methods: `PascalCase`
  - Events: `PascalCase` with "On" prefix
- **Access Modifiers**: Always specify access modifiers explicitly
- **Unity Conventions**: Follow Unity naming conventions for MonoBehaviour scripts

## File Organization

### Directory Structure

```
scripts/
├── unity/                 # Unity-specific scripts
├── automation/            # General automation
├── maintenance/           # Health checks and monitoring
├── setup/                # Setup scripts
└── utilities/            # Utility scripts

docs/
├── guides/               # How-to guides
├── setup/                # Setup instructions
├── features/             # Feature documentation
└── reports/              # Analysis reports

config/
├── levels/               # Level configurations
├── themes/               # Theme configurations
└── remote/               # Remote configuration
```

### File Naming

- **Scripts**: `snake_case.py`, `snake_case.js`
- **Documentation**: `kebab-case.md`
- **Configuration**: `snake_case.json`
- **Directories**: `snake_case/`

## Naming Conventions

### General Rules

| Language | Variables/Functions | Classes | Constants | Private Members |
|----------|-------------------|---------|-----------|----------------|
| Python | `snake_case` | `PascalCase` | `UPPER_SNAKE_CASE` | `_leading_underscore` |
| JavaScript | `camelCase` | `PascalCase` | `UPPER_SNAKE_CASE` | `_leadingUnderscore` |
| C# | `camelCase` | `PascalCase` | `UPPER_SNAKE_CASE` | `_leadingUnderscore` |

### Descriptive Names

- Use descriptive names that explain intent
- Avoid abbreviations unless they're widely understood
- Use verbs for methods, nouns for variables
- Use boolean names that can be read as questions

**Good Examples:**
```python
def calculate_player_score(moves: List[Move]) -> int:
    is_game_over = check_game_condition()
    max_attempts = 3
```

**Bad Examples:**
```python
def calc(ms: List) -> int:
    done = check()
    max = 3
```

## Documentation Standards

### Code Comments

- **Why, not What**: Explain why code exists, not what it does
- **Complex Logic**: Comment complex algorithms and business logic
- **TODOs**: Use TODO comments for temporary workarounds
- **Avoid**: Obvious comments that just repeat the code

### Documentation Files

- Use clear, concise language
- Include code examples
- Use proper markdown formatting
- Add table of contents for long documents
- Keep documentation up to date with code changes

## Testing Standards

### Unit Tests

- Test all public methods
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies

### Test Naming

```python
def test_calculate_score_with_valid_moves_returns_correct_value():
    """Test that score calculation works with valid moves."""
    pass

def test_calculate_score_with_empty_moves_returns_zero():
    """Test that score calculation returns zero for empty moves."""
    pass
```

### Test Organization

- One test file per source file
- Group related tests in classes
- Use setup and teardown methods appropriately
- Keep tests independent and isolated

## Tools and Automation

### Code Formatting

- **Python**: Use Black formatter
- **JavaScript**: Use Prettier
- **C#**: Use Visual Studio Code formatting

### Linting

- **Python**: Use flake8 or pylint
- **JavaScript**: Use ESLint
- **C#**: Use Roslyn analyzers

### Pre-commit Hooks

Set up pre-commit hooks to ensure code quality:
- Format code automatically
- Run linters
- Run tests
- Check for secrets and sensitive data

## Performance Considerations

### Python

- Use list comprehensions for simple transformations
- Use generators for large datasets
- Profile code to identify bottlenecks
- Use appropriate data structures

### JavaScript

- Avoid memory leaks with proper cleanup
- Use efficient algorithms
- Minimize DOM manipulation
- Use requestAnimationFrame for animations

### C# Unity

- Use object pooling for frequently created objects
- Minimize garbage collection
- Use appropriate data structures
- Profile with Unity Profiler

## Security Best Practices

- Never commit secrets or API keys
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Regular security audits

## Conclusion

Following these standards ensures:
- **Consistency** across the codebase
- **Readability** for all team members
- **Maintainability** for future development
- **Quality** through testing and review
- **Security** through best practices

Remember: Standards are guidelines, not rigid rules. Use your judgment and adapt when necessary, but always consider the impact on team productivity and code quality.