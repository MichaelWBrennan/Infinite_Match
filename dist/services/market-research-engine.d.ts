/**
 * Market Research Engine - Real-time industry analysis and competitor monitoring
 * Uses multiple data sources to track industry trends and optimize game strategy
 */
export class MarketResearchEngine {
    logger: Logger;
    supabase: any;
    dataSources: {
        appStore: {
            baseUrl: string;
            apiKey: string | undefined;
        };
        googlePlay: {
            baseUrl: string;
            apiKey: string | undefined;
        };
        sensortower: {
            baseUrl: string;
            apiKey: string | undefined;
        };
        appannie: {
            baseUrl: string;
            apiKey: string | undefined;
        };
    };
    competitors: string[];
    marketData: Map<any, any>;
    trends: Map<any, any>;
    competitorAnalysis: Map<any, any>;
    /**
     * Start real-time market monitoring
     */
    startRealTimeMonitoring(): void;
    /**
     * Update market data from all sources
     */
    updateMarketData(): Promise<void>;
    /**
     * Fetch App Store data
     */
    fetchAppStoreData(): Promise<{
        totalGames: any;
        match3Games: any;
        topGames: any;
        marketShare: number;
        trends: string[];
    } | null>;
    /**
     * Fetch Google Play data
     */
    fetchGooglePlayData(): Promise<{
        topGames: never[];
        categories: {
            puzzle: {
                downloads: number;
                revenue: number;
            };
            casual: {
                downloads: number;
                revenue: number;
            };
        };
        trends: {
            rising: never[];
            falling: never[];
        };
    } | null>;
    /**
     * Fetch Sensor Tower data
     */
    fetchSensorTowerData(): Promise<{
        downloads: any;
        revenue: any;
        rankings: any;
        keywords: any;
        competitors: any;
    } | null>;
    /**
     * Fetch App Annie data
     */
    fetchAppAnnieData(): Promise<{
        rankings: any;
        marketSize: any;
        growthRate: any;
        topCountries: any;
    } | null>;
    /**
     * Process App Store data
     */
    processAppStoreData(data: any): {
        totalGames: any;
        match3Games: any;
        topGames: any;
        marketShare: number;
        trends: string[];
    };
    /**
     * Process Sensor Tower data
     */
    processSensorTowerData(data: any): {
        downloads: any;
        revenue: any;
        rankings: any;
        keywords: any;
        competitors: any;
    };
    /**
     * Process App Annie data
     */
    processAppAnnieData(data: any): {
        rankings: any;
        marketSize: any;
        growthRate: any;
        topCountries: any;
    };
    /**
     * Aggregate market data from all sources
     */
    aggregateMarketData(appStore: any, googlePlay: any, sensorTower: any, appAnnie: any): {
        totalMarketSize: number;
        topPerformers: never[];
        emergingTrends: string[];
        marketOpportunities: string[];
        competitiveLandscape: {
            competition: string;
            barriers: string;
        };
    };
    /**
     * Analyze market trends
     */
    analyzeTrends(): Promise<void>;
    /**
     * Analyze competitors
     */
    analyzeCompetitors(): Promise<void>;
    /**
     * Analyze individual competitor
     */
    analyzeCompetitor(competitorId: any): Promise<{
        id: any;
        name: string;
        downloads: number;
        revenue: number;
        rating: number;
        features: string[];
        monetization: string[];
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
        lastUpdated: string;
    } | null>;
    /**
     * Get market insights for content generation
     */
    getMarketInsights(): {
        popularThemes: string[];
        engagementPatterns: string;
        revenueTrends: string;
        competitorAnalysis: string;
        marketOpportunities: string[];
        recommendedFeatures: string[];
    };
    /**
     * Store market data
     */
    storeMarketData(data: any): Promise<void>;
    /**
     * Store trends
     */
    storeTrends(trends: any): Promise<void>;
    /**
     * Store competitor analysis
     */
    storeCompetitorAnalysis(analysis: any): Promise<void>;
    /**
     * Get historical market data
     */
    getHistoricalMarketData(days: any): Promise<any>;
    calculateMarketShare(games: any): number;
    identifyTrends(games: any): string[];
    calculateTotalMarketSize(...sources: any[]): number;
    identifyTopPerformers(...sources: any[]): never[];
    identifyEmergingTrends(...sources: any[]): string[];
    identifyMarketOpportunities(...sources: any[]): string[];
    analyzeCompetitiveLandscape(...sources: any[]): {
        competition: string;
        barriers: string;
    };
    analyzeDownloadTrends(data: any): {
        trend: string;
        rate: number;
    };
    analyzeRevenueTrends(data: any): {
        trend: string;
        rate: number;
    };
    analyzeCategoryTrends(data: any): {
        puzzle: string;
        casual: string;
    };
    analyzeFeatureTrends(data: any): {
        social: string;
        ai: string;
    };
    analyzeMonetizationTrends(data: any): {
        subscription: string;
        ads: string;
    };
    analyzePlayerBehaviorTrends(data: any): {
        session_length: string;
        retention: string;
    };
    extractPopularThemes(data: any, trends: any): string[];
    extractEngagementPatterns(data: any, trends: any): string;
    extractRevenueTrends(data: any, trends: any): string;
    extractCompetitorInsights(competitors: any): string;
    identifyOpportunities(data: any, trends: any, competitors: any): string[];
    recommendFeatures(data: any, trends: any, competitors: any): string[];
}
import { Logger } from '../core/logger/index.js';
//# sourceMappingURL=market-research-engine.d.ts.map