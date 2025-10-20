declare const _default: PushNotificationService;
export default _default;
export class PushNotificationService {
    fcm: any;
    apns: any;
    isInitialized: boolean;
    notificationQueue: Map<any, any>;
    scheduledNotifications: Map<any, any>;
    campaigns: Map<any, any>;
    userPreferences: Map<any, any>;
    engagementMetrics: {
        notificationsSent: number;
        notificationsDelivered: number;
        notificationsOpened: number;
        engagementRate: number;
        retentionImpact: number;
    };
    templates: Map<any, any>;
    abTests: Map<any, any>;
    testGroups: Map<any, any>;
    interventionTriggers: Map<any, any>;
    initialize(): Promise<void>;
    initializeTemplates(): void;
    sendNotification(userId: any, templateKey: any, customData?: {}): Promise<boolean>;
    sendBatchNotifications(notifications: any): Promise<{
        successCount: number;
        failureCount: number;
        responses?: never;
    } | {
        successCount: any;
        failureCount: any;
        responses: any;
    }>;
    scheduleNotification(userId: any, templateKey: any, scheduleTime: any, customData?: {}): Promise<string>;
    sendScheduledNotification(notificationId: any): Promise<void>;
    createCampaign(campaignData: any): Promise<string>;
    executeCampaign(campaignId: any): Promise<void>;
    setupInterventionTriggers(): void;
    checkInterventionTriggers(userId: any, playerData: any): Promise<{
        trigger: any;
        action: any;
        template: any;
        priority: any;
        playerData: any;
    }[]>;
    executeIntervention(userId: any, intervention: any): Promise<void>;
    createABTest(testData: any): Promise<string>;
    applyABTesting(userId: any, templateKey: any): Promise<{
        title?: never;
        body?: never;
        data?: never;
    } | {
        title: any;
        body: any;
        data: any;
    }>;
    getUserTestGroup(userId: any, testId: any): number;
    getUserFCMToken(userId: any): Promise<any>;
    getUserPreferences(userId: any): Promise<any>;
    shouldSendNotification(userId: any, templateKey: any, preferences: any): any;
    isUserCurrentlyActive(userId: any): Promise<boolean>;
    getTargetUsers(targetAudience: any): Promise<{
        id: string;
        preferences: any;
    }[]>;
    evaluateTrigger(userId: any, triggerName: any, playerData: any): Promise<boolean>;
    trackNotificationSent(userId: any, templateKey: any, response: any): Promise<void>;
    startNotificationProcessor(): void;
    startScheduledNotifications(): void;
    startEngagementMonitoring(): void;
    processNotificationQueue(): Promise<void>;
    processScheduledNotifications(): Promise<void>;
    updateEngagementMetrics(): Promise<void>;
    dateToCron(date: any): string;
    hashString(str: any): number;
    getMetrics(): Promise<{
        activeCampaigns: number;
        scheduledNotifications: number;
        activeABTests: number;
        notificationsSent: number;
        notificationsDelivered: number;
        notificationsOpened: number;
        engagementRate: number;
        retentionImpact: number;
    }>;
    getCampaigns(): Promise<any[]>;
    getABTests(): Promise<any[]>;
    updateUserPreferences(userId: any, preferences: any): Promise<void>;
    registerFCMToken(userId: any, token: any): Promise<void>;
    handleNotificationClick(userId: any, messageId: any, action: any): Promise<void>;
}
//# sourceMappingURL=push-notification-service.d.ts.map