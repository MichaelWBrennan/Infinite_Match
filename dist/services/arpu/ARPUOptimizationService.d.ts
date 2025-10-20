export default ARPUOptimizationService;
declare class ARPUOptimizationService {
    playerProfiles: Map<any, any>;
    revenueEvents: Map<any, any>;
    offerTemplates: Map<any, any>;
    subscriptionTiers: Map<any, any>;
    energyPacks: Map<any, any>;
    socialChallenges: Map<any, any>;
    initializeData(): void;
    /**
     * Generate personalized offers for a player
     */
    generatePersonalizedOffers(playerId: any, playerProfile: any): Promise<{
        id: string;
        templateId: any;
        name: any;
        originalPrice: any;
        personalizedPrice: number;
        discount: number;
        rewards: any;
        playerId: any;
        createdAt: string;
        expiresAt: string;
        isActive: boolean;
        personalizationFactors: {
            playerSegment: any;
            totalSpent: any;
            level: any;
        };
    }[]>;
    /**
     * Determine player segment based on spending behavior
     */
    determinePlayerSegment(playerProfile: any): string | undefined;
    /**
     * Check if offer should be shown to player
     */
    shouldShowOffer(template: any, playerProfile: any, playerSegment: any): boolean;
    /**
     * Evaluate offer condition
     */
    evaluateCondition(conditionType: any, conditionValue: any, playerProfile: any): boolean;
    /**
     * Create personalized offer
     */
    createPersonalizedOffer(template: any, playerProfile: any, playerSegment: any): {
        id: string;
        templateId: any;
        name: any;
        originalPrice: any;
        personalizedPrice: number;
        discount: number;
        rewards: any;
        playerId: any;
        createdAt: string;
        expiresAt: string;
        isActive: boolean;
        personalizationFactors: {
            playerSegment: any;
            totalSpent: any;
            level: any;
        };
    };
    /**
     * Calculate personalized price
     */
    calculatePersonalizedPrice(template: any, playerProfile: any, playerSegment: any): number;
    /**
     * Calculate personalized discount
     */
    calculatePersonalizedDiscount(template: any, playerProfile: any, playerSegment: any): number;
    /**
     * Process offer purchase
     */
    processOfferPurchase(offerId: any, playerId: any, amount: any): Promise<{
        success: boolean;
        offerId: any;
        amount: any;
    }>;
    /**
     * Track revenue event
     */
    trackRevenue(playerId: any, amount: any, source: any, itemId?: string): void;
    /**
     * Get player profile
     */
    getPlayerProfile(playerId: any): any;
    /**
     * Update player profile
     */
    updatePlayerProfile(playerId: any, updates: any): void;
    /**
     * Get ARPU statistics
     */
    getARPUStatistics(): {
        totalPlayers: number;
        payingPlayers: number;
        totalRevenue: any;
        arpu: number;
        arpuPaying: number;
        conversionRate: number;
        revenueBySource: {};
        segmentDistribution: {};
    };
    /**
     * Get revenue by source
     */
    getRevenueBySource(): {};
    /**
     * Get segment distribution
     */
    getSegmentDistribution(): {};
    /**
     * Generate unique ID
     */
    generateId(): string;
}
//# sourceMappingURL=ARPUOptimizationService.d.ts.map