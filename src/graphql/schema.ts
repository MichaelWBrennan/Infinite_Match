import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date
  scalar JSON

  type Player {
    id: ID!
    username: String!
    email: String!
    level: Int!
    experience: Int!
    currency: PlayerCurrency!
    inventory: [InventoryItem!]!
    statistics: PlayerStatistics!
    achievements: [Achievement!]!
    createdAt: Date!
    updatedAt: Date!
  }

  type PlayerCurrency {
    coins: Int!
    gems: Int!
    energy: Int!
    maxEnergy: Int!
  }

  type InventoryItem {
    id: ID!
    itemId: String!
    quantity: Int!
    rarity: ItemRarity!
    metadata: JSON
  }

  type PlayerStatistics {
    gamesPlayed: Int!
    gamesWon: Int!
    totalScore: Int!
    bestScore: Int!
    averageScore: Float!
    playTime: Int!
    lastPlayed: Date
  }

  type Achievement {
    id: ID!
    name: String!
    description: String!
    icon: String!
    unlockedAt: Date
    progress: Int!
    maxProgress: Int!
    reward: JSON
  }

  type GameSession {
    id: ID!
    playerId: ID!
    level: Int!
    score: Int!
    moves: Int!
    timeSpent: Int!
    completed: Boolean!
    createdAt: Date!
  }

  type Match3Level {
    id: ID!
    levelNumber: Int!
    difficulty: LevelDifficulty!
    targetScore: Int!
    maxMoves: Int!
    timeLimit: Int
    specialTiles: [SpecialTile!]!
    obstacles: [Obstacle!]!
    rewards: [Reward!]!
  }

  type SpecialTile {
    id: ID!
    type: SpecialTileType!
    position: Position!
    effect: JSON
  }

  type Obstacle {
    id: ID!
    type: ObstacleType!
    position: Position!
    health: Int
  }

  type Reward {
    id: ID!
    type: RewardType!
    amount: Int!
    probability: Float!
  }

  type ShopItem {
    id: ID!
    name: String!
    description: String!
    price: Int!
    currency: CurrencyType!
    category: ShopCategory!
    rarity: ItemRarity!
    metadata: JSON
    available: Boolean!
  }

  type UnityCloudConfig {
    projectId: String!
    environmentId: String!
    organizationId: String!
    clientId: String!
    services: [UnityService!]!
  }

  type UnityService {
    name: String!
    enabled: Boolean!
    configuration: JSON
  }

  type GameAnalytics {
    playerId: ID!
    sessionId: ID!
    events: [AnalyticsEvent!]!
    metrics: GameMetrics!
    timestamp: Date!
  }

  type AnalyticsEvent {
    id: ID!
    type: String!
    data: JSON!
    timestamp: Date!
  }

  type GameMetrics {
    sessionDuration: Int!
    levelsCompleted: Int!
    totalScore: Int!
    averageMoveTime: Float!
    powerUpsUsed: Int!
    purchases: Int!
    revenue: Float!
  }

  type SecurityEvent {
    id: ID!
    type: SecurityEventType!
    severity: SecuritySeverity!
    playerId: ID
    description: String!
    metadata: JSON!
    timestamp: Date!
    resolved: Boolean!
  }

  type DeviceFingerprint {
    id: ID!
    fingerprint: String!
    platform: String!
    deviceModel: String!
    osVersion: String!
    appVersion: String!
    firstSeen: Date!
    lastSeen: Date!
    requestCount: Int!
  }

  type CheatDetection {
    playerId: ID!
    score: Int!
    reasons: [String!]!
    suspicious: Boolean!
    timestamp: Date!
  }

  # Enums
  enum ItemRarity {
    COMMON
    UNCOMMON
    RARE
    EPIC
    LEGENDARY
  }

  enum LevelDifficulty {
    EASY
    MEDIUM
    HARD
    EXPERT
    MASTER
  }

  enum SpecialTileType {
    BOMB
    LIGHTNING
    RAINBOW
    MULTIPLIER
    FREEZE
  }

  enum ObstacleType {
    ROCK
    ICE
    CHAIN
    LOCK
    TIMER
  }

  enum RewardType {
    COINS
    GEMS
    ENERGY
    POWER_UP
    EXPERIENCE
  }

  enum CurrencyType {
    COINS
    GEMS
    ENERGY
  }

  enum ShopCategory {
    POWER_UPS
    COSMETICS
    CURRENCY
    BOOSTERS
  }

  enum SecurityEventType {
    CHEAT_DETECTED
    SUSPICIOUS_ACTIVITY
    DEVICE_CHANGE
    MULTIPLE_DEVICES
    RAPID_ACTIONS
    IMPOSSIBLE_SCORE
  }

  enum SecuritySeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  # Input Types
  input Position {
    x: Int!
    y: Int!
  }

  input GameActionInput {
    sessionId: ID!
    actionType: String!
    data: JSON!
    timestamp: Date!
  }

  input PurchaseInput {
    itemId: ID!
    quantity: Int!
    currency: CurrencyType!
    receipt: String
  }

  input PlayerUpdateInput {
    username: String
    email: String
    level: Int
    experience: Int
  }

  # Queries
  type Query {
    # Player queries
    player(id: ID!): Player
    players(limit: Int, offset: Int): [Player!]!
    playerByUsername(username: String!): Player
    
    # Game queries
    gameSession(id: ID!): GameSession
    gameSessions(playerId: ID!, limit: Int, offset: Int): [GameSession!]!
    match3Level(levelNumber: Int!): Match3Level
    match3Levels(difficulty: LevelDifficulty, limit: Int, offset: Int): [Match3Level!]!
    
    # Shop queries
    shopItems(category: ShopCategory, available: Boolean): [ShopItem!]!
    shopItem(id: ID!): ShopItem
    
    # Unity Cloud queries
    unityCloudConfig: UnityCloudConfig!
    unityServices: [UnityService!]!
    
    # Analytics queries
    gameAnalytics(playerId: ID!, startDate: Date, endDate: Date): [GameAnalytics!]!
    playerStatistics(playerId: ID!): PlayerStatistics!
    
    # Security queries
    securityEvents(severity: SecuritySeverity, resolved: Boolean): [SecurityEvent!]!
    deviceFingerprints(playerId: ID!): [DeviceFingerprint!]!
    cheatDetections(playerId: ID!): [CheatDetection!]!
    
    # Health and monitoring
    health: HealthStatus!
    systemMetrics: SystemMetrics!
  }

  # Mutations
  type Mutation {
    # Player mutations
    createPlayer(input: PlayerUpdateInput!): Player!
    updatePlayer(id: ID!, input: PlayerUpdateInput!): Player!
    deletePlayer(id: ID!): Boolean!
    
    # Game mutations
    startGameSession(playerId: ID!, level: Int!): GameSession!
    updateGameSession(id: ID!, score: Int, moves: Int, completed: Boolean): GameSession!
    endGameSession(id: ID!, finalScore: Int!): GameSession!
    
    # Economy mutations
    addCurrency(playerId: ID!, currency: CurrencyType!, amount: Int!): PlayerCurrency!
    spendCurrency(playerId: ID!, currency: CurrencyType!, amount: Int!): PlayerCurrency!
    purchaseItem(input: PurchaseInput!): InventoryItem!
    useInventoryItem(playerId: ID!, itemId: ID!, quantity: Int!): InventoryItem!
    
    # Unity Cloud mutations
    updateUnityConfig(config: JSON!): UnityCloudConfig!
    deployCloudCode(code: String!, functionName: String!): Boolean!
    
    # Security mutations
    reportSecurityEvent(type: SecurityEventType!, playerId: ID, description: String!, metadata: JSON!): SecurityEvent!
    resolveSecurityEvent(id: ID!): SecurityEvent!
    generateDeviceFingerprint(deviceInfo: JSON!): DeviceFingerprint!
    validateDeviceFingerprint(fingerprint: String!, deviceInfo: JSON!): Boolean!
  }

  # Subscriptions
  type Subscription {
    # Real-time game events
    gameSessionUpdated(sessionId: ID!): GameSession!
    playerScoreUpdated(playerId: ID!): Player!
    
    # Real-time security events
    securityEventCreated: SecurityEvent!
    cheatDetected(playerId: ID!): CheatDetection!
    
    # Real-time analytics
    analyticsEvent(playerId: ID!): AnalyticsEvent!
    
    # System monitoring
    systemHealthChanged: HealthStatus!
  }

  # Additional types
  type HealthStatus {
    status: String!
    timestamp: Date!
    services: [ServiceHealth!]!
    uptime: Int!
    version: String!
  }

  type ServiceHealth {
    name: String!
    status: String!
    responseTime: Int
    lastCheck: Date!
  }

  type SystemMetrics {
    cpu: Float!
    memory: Float!
    disk: Float!
    network: NetworkMetrics!
    database: DatabaseMetrics!
  }

  type NetworkMetrics {
    requestsPerSecond: Float!
    averageResponseTime: Float!
    errorRate: Float!
  }

  type DatabaseMetrics {
    connections: Int!
    queriesPerSecond: Float!
    averageQueryTime: Float!
    cacheHitRate: Float!
  }
`;