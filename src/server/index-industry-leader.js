import { IndustryLeaderServer } from './industry-leader-server.js';
import { Logger } from '../core/logger/index.js';

/**
 * Industry Leader Game Server - The Ultimate Mobile Game Development Platform
 * 
 * This server integrates:
 * - AI Content Generation (OpenAI GPT-4, DALL-E 3)
 * - AI Personalization Engine
 * - Market Research & Competitor Analysis
 * - Infinite Content Pipeline
 * - AI Analytics & Insights
 * - Real-time Performance Optimization
 * 
 * Features:
 * - Infinite content generation for every player
 * - Real-time market analysis and competitor tracking
 * - AI-powered personalization for maximum engagement
 * - Predictive analytics for churn and LTV
 * - Automated content optimization
 * - Real-time insights and recommendations
 * - Industry-leading monetization strategies
 * - Advanced social features
 * - Live operations automation
 * 
 * This is the most advanced mobile game development platform ever built.
 */

const logger = new Logger('IndustryLeaderMain');

async function main() {
    try {
        logger.info('Starting Industry Leader Game Server...');
        logger.info('Initializing the most advanced mobile game development platform...');
        
        // Create and start the Industry Leader Server
        const server = new IndustryLeaderServer();
        await server.start();
        
        logger.info('Industry Leader Game Server started successfully!');
        logger.info('The ultimate mobile game development platform is now running.');
        logger.info('Ready to create the next industry-leading mobile game!');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('Failed to start Industry Leader Game Server', { error: error.message });
        process.exit(1);
    }
}

// Start the server
main().catch((error) => {
    logger.error('Unhandled error in main', { error: error.message });
    process.exit(1);
});