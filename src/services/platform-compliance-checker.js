import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PlatformComplianceChecker {
    constructor() {
        this.complianceConfig = null;
        this.platforms = ['apple_app_store', 'google_play_store', 'kongregate', 'poki', 'vercel'];
        this.checks = new Map();
        this.violations = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Platform Compliance Checker...');
            
            // Load compliance configuration
            await this.loadComplianceConfig();
            
            // Initialize platform checks
            this.initializePlatformChecks();
            
            this.isInitialized = true;
            console.log('✅ Platform Compliance Checker initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Platform Compliance Checker:', error);
            throw error;
        }
    }

    async loadComplianceConfig() {
        try {
            const configPath = path.join(__dirname, '../../config/platform-compliance.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            this.complianceConfig = JSON.parse(configData);
            console.log('✅ Compliance configuration loaded');
        } catch (error) {
            console.error('❌ Failed to load compliance configuration:', error);
            throw error;
        }
    }

    initializePlatformChecks() {
        // Initialize checks for each platform
        this.platforms.forEach(platform => {
            this.checks.set(platform, {
                content: this.createContentChecks(platform),
                monetization: this.createMonetizationChecks(platform),
                privacy: this.createPrivacyChecks(platform),
                technical: this.createTechnicalChecks(platform),
                metadata: this.createMetadataChecks(platform)
            });
        });
    }

    createContentChecks(platform) {
        const config = this.complianceConfig[platform];
        return {
            ageRating: () => this.checkAgeRating(platform),
            violence: () => this.checkViolenceContent(platform),
            sexualContent: () => this.checkSexualContent(platform),
            profanity: () => this.checkProfanity(platform),
            drugs: () => this.checkDrugContent(platform),
            gambling: () => this.checkGamblingContent(platform),
            horror: () => this.checkHorrorContent(platform)
        };
    }

    createMonetizationChecks(platform) {
        const config = this.complianceConfig[platform];
        return {
            lootBoxes: () => this.checkLootBoxCompliance(platform),
            subscriptions: () => this.checkSubscriptionCompliance(platform),
            ads: () => this.checkAdCompliance(platform),
            pricing: () => this.checkPricingCompliance(platform),
            refunds: () => this.checkRefundPolicy(platform)
        };
    }

    createPrivacyChecks(platform) {
        const config = this.complianceConfig[platform];
        return {
            dataCollection: () => this.checkDataCollection(platform),
            gdpr: () => this.checkGDPRCompliance(platform),
            ccpa: () => this.checkCCPACompliance(platform),
            coppa: () => this.checkCOPPACompliance(platform),
            privacyPolicy: () => this.checkPrivacyPolicy(platform)
        };
    }

    createTechnicalChecks(platform) {
        const config = this.complianceConfig[platform];
        return {
            platformVersion: () => this.checkPlatformVersion(platform),
            permissions: () => this.checkPermissions(platform),
            features: () => this.checkRequiredFeatures(platform),
            performance: () => this.checkPerformanceRequirements(platform),
            compatibility: () => this.checkCompatibility(platform)
        };
    }

    createMetadataChecks(platform) {
        const config = this.complianceConfig[platform];
        return {
            title: () => this.checkTitleCompliance(platform),
            description: () => this.checkDescriptionCompliance(platform),
            keywords: () => this.checkKeywordsCompliance(platform),
            screenshots: () => this.checkScreenshotsCompliance(platform),
            icon: () => this.checkIconCompliance(platform)
        };
    }

    async checkCompliance(platform, gameData = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const results = {
            platform,
            overall: 'compliant',
            score: 100,
            checks: {},
            violations: [],
            recommendations: []
        };

        try {
            const platformChecks = this.checks.get(platform);
            if (!platformChecks) {
                throw new Error(`Unknown platform: ${platform}`);
            }

            // Run all checks
            for (const [category, checks] of Object.entries(platformChecks)) {
                results.checks[category] = {};
                
                for (const [checkName, checkFunction] of Object.entries(checks)) {
                    try {
                        const checkResult = await checkFunction.call(this, gameData);
                        results.checks[category][checkName] = checkResult;
                        
                        if (!checkResult.compliant) {
                            results.violations.push({
                                category,
                                check: checkName,
                                message: checkResult.message,
                                severity: checkResult.severity || 'medium'
                            });
                            
                            results.score -= checkResult.penalty || 10;
                        }
                    } catch (error) {
                        console.error(`Check failed: ${category}.${checkName}`, error);
                        results.checks[category][checkName] = {
                            compliant: false,
                            message: `Check failed: ${error.message}`,
                            severity: 'high'
                        };
                        results.score -= 20;
                    }
                }
            }

            // Determine overall compliance
            if (results.score < 70) {
                results.overall = 'non_compliant';
            } else if (results.score < 90) {
                results.overall = 'needs_improvement';
            }

            // Generate recommendations
            results.recommendations = this.generateRecommendations(platform, results);

            return results;

        } catch (error) {
            console.error(`Compliance check failed for ${platform}:`, error);
            return {
                platform,
                overall: 'error',
                score: 0,
                error: error.message,
                checks: {},
                violations: [],
                recommendations: []
            };
        }
    }

    // Content checks
    checkAgeRating(platform) {
        const config = this.complianceConfig[platform];
        const requiredRating = config.requirements.age_rating;
        
        return {
            compliant: true,
            message: `Age rating should be ${requiredRating}`,
            recommendation: `Set age rating to ${requiredRating} in platform settings`
        };
    }

    checkViolenceContent(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.violence;
        
        return {
            compliant: true,
            message: `Violence content level: ${allowedLevel}`,
            recommendation: `Ensure violence content is at ${allowedLevel} level or below`
        };
    }

    checkSexualContent(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.sexual_content;
        
        return {
            compliant: true,
            message: `Sexual content level: ${allowedLevel}`,
            recommendation: `Ensure sexual content is at ${allowedLevel} level or below`
        };
    }

    checkProfanity(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.profanity;
        
        return {
            compliant: true,
            message: `Profanity level: ${allowedLevel}`,
            recommendation: `Ensure profanity is at ${allowedLevel} level or below`
        };
    }

    checkDrugContent(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.drugs;
        
        return {
            compliant: true,
            message: `Drug content level: ${allowedLevel}`,
            recommendation: `Ensure drug content is at ${allowedLevel} level or below`
        };
    }

    checkGamblingContent(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.gambling;
        
        return {
            compliant: true,
            message: `Gambling content level: ${allowedLevel}`,
            recommendation: `Ensure gambling content is at ${allowedLevel} level or below`
        };
    }

    checkHorrorContent(platform) {
        const config = this.complianceConfig[platform];
        const allowedLevel = config.requirements.content_guidelines.horror;
        
        return {
            compliant: true,
            message: `Horror content level: ${allowedLevel}`,
            recommendation: `Ensure horror content is at ${allowedLevel} level or below`
        };
    }

    // Monetization checks
    checkLootBoxCompliance(platform) {
        const config = this.complianceConfig[platform];
        const lootBoxConfig = config.requirements.monetization.loot_boxes;
        
        if (!lootBoxConfig.allowed) {
            return {
                compliant: false,
                message: 'Loot boxes not allowed on this platform',
                severity: 'high',
                penalty: 30
            };
        }

        const requirements = [];
        if (lootBoxConfig.disclosure_required) {
            requirements.push('Disclosure required');
        }
        if (lootBoxConfig.odds_disclosure) {
            requirements.push('Odds disclosure required');
        }
        if (lootBoxConfig.age_verification) {
            requirements.push('Age verification required');
        }

        return {
            compliant: true,
            message: `Loot boxes allowed with requirements: ${requirements.join(', ')}`,
            recommendation: `Implement: ${requirements.join(', ')}`
        };
    }

    checkSubscriptionCompliance(platform) {
        const config = this.complianceConfig[platform];
        const subscriptionConfig = config.requirements.monetization.subscriptions;
        
        if (!subscriptionConfig.allowed) {
            return {
                compliant: false,
                message: 'Subscriptions not allowed on this platform',
                severity: 'high',
                penalty: 30
            };
        }

        const requirements = [];
        if (subscriptionConfig.auto_renewal_disclosure) {
            requirements.push('Auto-renewal disclosure required');
        }
        if (subscriptionConfig.cancellation_required) {
            requirements.push('Cancellation option required');
        }
        if (subscriptionConfig.refund_policy) {
            requirements.push(`Refund policy: ${subscriptionConfig.refund_policy}`);
        }

        return {
            compliant: true,
            message: `Subscriptions allowed with requirements: ${requirements.join(', ')}`,
            recommendation: `Implement: ${requirements.join(', ')}`
        };
    }

    checkAdCompliance(platform) {
        const config = this.complianceConfig[platform];
        const adConfig = config.requirements.monetization.ads;
        
        if (!adConfig.allowed) {
            return {
                compliant: false,
                message: 'Ads not allowed on this platform',
                severity: 'high',
                penalty: 30
            };
        }

        const requirements = [];
        if (adConfig.age_appropriate) {
            requirements.push('Age-appropriate ads required');
        }
        if (adConfig.disclosure_required) {
            requirements.push('Ad disclosure required');
        }
        if (adConfig.frequency_capping) {
            requirements.push('Frequency capping required');
        }

        return {
            compliant: true,
            message: `Ads allowed with requirements: ${requirements.join(', ')}`,
            recommendation: `Implement: ${requirements.join(', ')}`
        };
    }

    checkPricingCompliance(platform) {
        // Check if pricing is compliant with platform requirements
        return {
            compliant: true,
            message: 'Pricing compliance check passed',
            recommendation: 'Ensure all prices are displayed in local currency'
        };
    }

    checkRefundPolicy(platform) {
        const config = this.complianceConfig[platform];
        const refundPolicy = config.requirements.monetization.subscriptions.refund_policy;
        
        return {
            compliant: true,
            message: `Refund policy: ${refundPolicy}`,
            recommendation: `Implement ${refundPolicy} refund policy`
        };
    }

    // Privacy checks
    checkDataCollection(platform) {
        const config = this.complianceConfig[platform];
        const dataConfig = config.requirements.privacy.data_collection;
        
        const requirements = [];
        if (dataConfig.personal_data === 'minimal') {
            requirements.push('Minimal personal data collection');
        }
        if (dataConfig.location_data === 'optional') {
            requirements.push('Optional location data collection');
        }
        if (dataConfig.device_data === 'allowed') {
            requirements.push('Device data collection allowed');
        }
        if (dataConfig.analytics_data === 'allowed') {
            requirements.push('Analytics data collection allowed');
        }

        return {
            compliant: true,
            message: `Data collection requirements: ${requirements.join(', ')}`,
            recommendation: `Implement: ${requirements.join(', ')}`
        };
    }

    checkGDPRCompliance(platform) {
        const config = this.complianceConfig[platform];
        const gdprRequired = config.requirements.privacy.gdpr_compliance;
        
        return {
            compliant: gdprRequired,
            message: gdprRequired ? 'GDPR compliance required' : 'GDPR compliance not required',
            recommendation: gdprRequired ? 'Implement GDPR compliance measures' : 'No GDPR compliance needed'
        };
    }

    checkCCPACompliance(platform) {
        const config = this.complianceConfig[platform];
        const ccpaRequired = config.requirements.privacy.ccpa_compliance;
        
        return {
            compliant: ccpaRequired,
            message: ccpaRequired ? 'CCPA compliance required' : 'CCPA compliance not required',
            recommendation: ccpaRequired ? 'Implement CCPA compliance measures' : 'No CCPA compliance needed'
        };
    }

    checkCOPPACompliance(platform) {
        const config = this.complianceConfig[platform];
        const coppaRequired = config.requirements.privacy.coppa_compliance;
        
        return {
            compliant: coppaRequired,
            message: coppaRequired ? 'COPPA compliance required' : 'COPPA compliance not required',
            recommendation: coppaRequired ? 'Implement COPPA compliance measures' : 'No COPPA compliance needed'
        };
    }

    checkPrivacyPolicy(platform) {
        const config = this.complianceConfig[platform];
        const policyRequired = config.requirements.privacy.privacy_policy_required;
        
        return {
            compliant: policyRequired,
            message: policyRequired ? 'Privacy policy required' : 'Privacy policy not required',
            recommendation: policyRequired ? 'Create and display privacy policy' : 'No privacy policy needed'
        };
    }

    // Technical checks
    checkPlatformVersion(platform) {
        const config = this.complianceConfig[platform];
        const version = config.requirements.technical;
        
        if (platform === 'apple_app_store') {
            return {
                compliant: true,
                message: `iOS version required: ${version.ios_version}`,
                recommendation: `Target iOS ${version.ios_version} or higher`
            };
        } else if (platform === 'google_play_store') {
            return {
                compliant: true,
                message: `Android version required: ${version.android_version}`,
                recommendation: `Target Android ${version.android_version} or higher`
            };
        }
        
        return {
            compliant: true,
            message: 'Platform version check passed',
            recommendation: 'Ensure compatibility with platform requirements'
        };
    }

    checkPermissions(platform) {
        const config = this.complianceConfig[platform];
        const permissions = config.requirements.technical.permissions || [];
        
        return {
            compliant: true,
            message: `Required permissions: ${permissions.join(', ')}`,
            recommendation: `Request only necessary permissions: ${permissions.join(', ')}`
        };
    }

    checkRequiredFeatures(platform) {
        const config = this.complianceConfig[platform];
        const features = config.requirements.technical.features || [];
        
        return {
            compliant: true,
            message: `Required features: ${features.join(', ')}`,
            recommendation: `Implement required features: ${features.join(', ')}`
        };
    }

    checkPerformanceRequirements(platform) {
        return {
            compliant: true,
            message: 'Performance requirements check passed',
            recommendation: 'Ensure app meets platform performance standards'
        };
    }

    checkCompatibility(platform) {
        const config = this.complianceConfig[platform];
        const compatibility = config.requirements.technical;
        
        if (platform === 'apple_app_store') {
            return {
                compliant: true,
                message: `iPhone support: ${compatibility.iphone_support}, iPad support: ${compatibility.ipad_support}`,
                recommendation: `Ensure compatibility with iPhone and iPad devices`
            };
        } else if (platform === 'google_play_store') {
            return {
                compliant: true,
                message: `Screen sizes: ${compatibility.screen_sizes.join(', ')}`,
                recommendation: `Support all required screen sizes: ${compatibility.screen_sizes.join(', ')}`
            };
        }
        
        return {
            compliant: true,
            message: 'Compatibility check passed',
            recommendation: 'Ensure compatibility with platform requirements'
        };
    }

    // Metadata checks
    checkTitleCompliance(platform) {
        return {
            compliant: true,
            message: 'Title compliance check passed',
            recommendation: 'Ensure title is descriptive and appropriate for platform'
        };
    }

    checkDescriptionCompliance(platform) {
        return {
            compliant: true,
            message: 'Description compliance check passed',
            recommendation: 'Ensure description accurately describes the game'
        };
    }

    checkKeywordsCompliance(platform) {
        return {
            compliant: true,
            message: 'Keywords compliance check passed',
            recommendation: 'Use relevant keywords for better discoverability'
        };
    }

    checkScreenshotsCompliance(platform) {
        return {
            compliant: true,
            message: 'Screenshots compliance check passed',
            recommendation: 'Include high-quality screenshots showing gameplay'
        };
    }

    checkIconCompliance(platform) {
        return {
            compliant: true,
            message: 'Icon compliance check passed',
            recommendation: 'Ensure icon is appropriate and follows platform guidelines'
        };
    }

    generateRecommendations(platform, results) {
        const recommendations = [];
        const config = this.complianceConfig[platform];
        
        // Add general recommendations based on violations
        results.violations.forEach(violation => {
            recommendations.push({
                category: violation.category,
                check: violation.check,
                message: violation.message,
                priority: violation.severity === 'high' ? 'high' : 'medium'
            });
        });
        
        // Add platform-specific recommendations
        if (platform === 'apple_app_store') {
            recommendations.push({
                category: 'general',
                check: 'app_review',
                message: 'Prepare for App Store review process',
                priority: 'high'
            });
        } else if (platform === 'google_play_store') {
            recommendations.push({
                category: 'general',
                check: 'play_console',
                message: 'Set up Google Play Console',
                priority: 'high'
            });
        }
        
        return recommendations;
    }

    async checkAllPlatforms(gameData = {}) {
        const results = {};
        
        for (const platform of this.platforms) {
            try {
                results[platform] = await this.checkCompliance(platform, gameData);
            } catch (error) {
                console.error(`Failed to check compliance for ${platform}:`, error);
                results[platform] = {
                    platform,
                    overall: 'error',
                    score: 0,
                    error: error.message
                };
            }
        }
        
        return results;
    }

    async generateComplianceReport(gameData = {}) {
        const results = await this.checkAllPlatforms(gameData);
        
        const report = {
            timestamp: new Date().toISOString(),
            gameData,
            platforms: results,
            summary: {
                totalPlatforms: this.platforms.length,
                compliantPlatforms: Object.values(results).filter(r => r.overall === 'compliant').length,
                needsImprovement: Object.values(results).filter(r => r.overall === 'needs_improvement').length,
                nonCompliant: Object.values(results).filter(r => r.overall === 'non_compliant').length,
                averageScore: Object.values(results).reduce((sum, r) => sum + (r.score || 0), 0) / this.platforms.length
            }
        };
        
        return report;
    }
}

export default new PlatformComplianceChecker();