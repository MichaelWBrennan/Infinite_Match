# Architecture Overview

This project is a modular, data-driven Match-3 mobile game built with Unity 2022.3 LTS, organized to support live ops, monetization, and rapid content iteration with industry-standard patterns and optimizations.

## High-level layers
- **Core Systems**: Service Locator pattern, GameManager, Object Pooling, Caching
- **Game Logic**: Optimized Match-3 engine with object pooling and performance improvements
- **Data Layer**: Enhanced JSON handling, caching system, level management
- **UI Layer**: Event-driven UI with proper service injection and reduced FindObjectOfType calls
- **Live Ops**: Remote config, events, offers, tournament/team systems
- **Monetization**: IAP, ads, piggy bank and passes with proper service management
- **Analytics**: Enhanced logging system with file output and performance profiling
- **Testing**: Comprehensive unit testing framework for core game logic

## Key Architectural Improvements

### 1. Service Locator Pattern
- Centralized dependency injection through `ServiceLocator`
- Lazy instantiation with factory functions
- Proper service lifecycle management
- Reduced coupling between components

### 2. Object Pooling System
- Generic object pools for frequently created/destroyed objects
- Memory allocation optimization
- Performance improvements in Board.cs match detection
- Reduced garbage collection pressure

### 3. Enhanced Caching System
- Level data caching with TTL support
- Asset caching for frequently accessed resources
- LRU eviction policy
- Preloading system for next levels

### 4. Improved Error Handling
- Comprehensive logging system with different log levels
- File-based logging with rotation
- Performance profiling utilities
- Exception handling throughout the codebase

### 5. Optimized Game Logic
- Board.cs optimized with object pooling
- Reduced memory allocations in match detection
- Improved performance in board resolution
- Better special piece creation logic

## Core Systems

### Service Locator (`Evergreen.Core.ServiceLocator`)
- Centralized service registration and retrieval
- Factory pattern for lazy instantiation
- Type-safe service access
- Service lifecycle management

### Game Manager (`Evergreen.Core.GameManager`)
- Centralized game initialization
- Service coordination
- Proper shutdown handling
- Fallback initialization support

### Object Pooling (`Evergreen.Core.ObjectPool`)
- Generic object pools for any type
- Unity-specific GameObject pools
- Memory optimization
- Performance improvements

### Caching System (`Evergreen.Data.CacheManager`)
- Generic cache with TTL support
- Level data caching
- Asset caching
- Preloading capabilities

### Enhanced JSON Handling (`Evergreen.Data.JsonUtility`)
- Unity JsonUtility with error handling
- Fallback to MiniJSON for complex dictionaries
- File I/O with validation
- Comprehensive error reporting

## Data Model
- Levels JSON fields: `size, num_colors, move_limit, goals[], jelly, holes, crates, ice, locks, chocolate, vines, licorice, honey, portals, conveyors, preplaced, spawn_weights`
- Goals: `collect_color, clear_jelly, deliver_ingredients, clear_vines, clear_licorice, clear_honey`
- Cached level data with TTL
- Preloaded next levels for smooth gameplay

## Performance Optimizations

### Memory Management
- Object pooling for frequently created objects
- Reduced allocations in hot paths
- Proper disposal of pooled objects
- Memory usage monitoring

### Caching Strategy
- Level data caching with intelligent preloading
- Asset caching for frequently accessed resources
- LRU eviction policy
- TTL-based cache invalidation

### UI Optimizations
- Reduced FindObjectOfType calls
- Service locator pattern for dependencies
- Event-driven UI updates
- Proper cleanup of event listeners

## Testing & Quality Assurance

### Unit Testing Framework (`Evergreen.Testing.GameLogicTests`)
- Comprehensive test coverage for core game logic
- Board creation and match detection tests
- GameState operation tests
- Performance benchmarking
- Automated test execution

### Logging & Monitoring
- Multi-level logging system (Debug, Info, Warning, Error, Critical)
- File-based logging with rotation
- Performance profiling utilities
- Memory usage monitoring
- Exception tracking

## Live Ops
- Remote-config keys for pricing, ads frequency, DDA, offers
- Events calendar routing to seasonal themes
- Tournaments and team chests with weekly seeds
- A/B testing support through remote config

## Monetization
- Energy/lives system with proper state management
- Rewarded video placements with service integration
- Interstitials with caps and frequency control
- IAP: coin/gem packs, passes, piggy, dynamic offers
- Proper service lifecycle management

## Next Steps
- Decoration meta layer (rooms, tasks) as separate service
- Cloud save via PlayFab/Firebase with proper error handling
- A/B testing framework integration
- CI/CD pipelines with automated testing
- Performance monitoring and analytics integration
- Advanced AI personalization engine
- AR mode integration
- Cloud gaming support
