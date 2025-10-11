# Architecture

## Overview
Modular Match-3 game built with Unity 2022.3 LTS, using industry-standard patterns for live ops and monetization.

## Core Systems
- **Service Locator** - Centralized dependency injection
- **Object Pooling** - Memory optimization for frequently created objects
- **Caching** - Level data and asset caching with TTL
- **Game Manager** - Centralized game initialization and coordination

## Key Components

### Service Locator (`Evergreen.Core.ServiceLocator`)
- Type-safe service access
- Lazy instantiation with factory functions
- Proper service lifecycle management

### Object Pooling (`Evergreen.Core.ObjectPool`)
- Generic object pools for any type
- Memory allocation optimization
- Performance improvements in match detection

### Caching System (`Evergreen.Data.CacheManager`)
- Level data caching with TTL support
- Asset caching for frequently accessed resources
- LRU eviction policy

## Performance Optimizations
- Object pooling for frequently created objects
- Reduced allocations in hot paths
- Level data caching with intelligent preloading
- UI optimizations with service locator pattern

## Live Ops
- Remote config for pricing, ads frequency, DDA
- Events calendar with seasonal themes
- Tournaments and team chests
- A/B testing support

## Monetization
- Energy/lives system
- Rewarded video and interstitial ads
- IAP: coin/gem packs, passes, dynamic offers
- Proper service lifecycle management