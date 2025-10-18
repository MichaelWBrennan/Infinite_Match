import express from 'express';
import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';

const router = express.Router();
const logger = new Logger('ASORoutes');

/**
 * ASO Optimization Routes
 * Provides endpoints for App Store Optimization
 */

// Optimize store listing for a platform
router.post('/optimize/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { gameData, targetKeywords = [] } = req.body;

    if (!gameData) {
      return res.status(400).json({
        error: 'Game data is required',
        code: 'MISSING_GAME_DATA'
      });
    }

    // This would be injected from the server
    const asoService = req.app.locals.asoOptimization;
    if (!asoService) {
      return res.status(500).json({
        error: 'ASO service not available',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const result = await asoService.optimizeStoreListing(platform, gameData, targetKeywords);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('ASO optimization failed:', error);
    res.status(500).json({
      error: error.message || 'ASO optimization failed',
      code: error.code || 'ASO_OPTIMIZATION_FAILED'
    });
  }
});

// Generate keywords for a platform
router.post('/keywords/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { gameCategory, competitorKeywords = [] } = req.body;

    if (!gameCategory) {
      return res.status(400).json({
        error: 'Game category is required',
        code: 'MISSING_CATEGORY'
      });
    }

    const asoService = req.app.locals.asoOptimization;
    if (!asoService) {
      return res.status(500).json({
        error: 'ASO service not available',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const result = await asoService.generateKeywords(platform, gameCategory, competitorKeywords);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Keyword generation failed:', error);
    res.status(500).json({
      error: error.message || 'Keyword generation failed',
      code: error.code || 'KEYWORD_GENERATION_FAILED'
    });
  }
});

// Analyze competitors
router.post('/competitors/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { gameCategory, competitorUrls = [] } = req.body;

    if (!gameCategory) {
      return res.status(400).json({
        error: 'Game category is required',
        code: 'MISSING_CATEGORY'
      });
    }

    const asoService = req.app.locals.asoOptimization;
    if (!asoService) {
      return res.status(500).json({
        error: 'ASO service not available',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const result = await asoService.analyzeCompetitors(platform, gameCategory, competitorUrls);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Competitor analysis failed:', error);
    res.status(500).json({
      error: error.message || 'Competitor analysis failed',
      code: error.code || 'COMPETITOR_ANALYSIS_FAILED'
    });
  }
});

// Generate A/B test variations
router.post('/ab-test/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { baseListing, numberOfVariations = 3 } = req.body;

    if (!baseListing) {
      return res.status(400).json({
        error: 'Base listing is required',
        code: 'MISSING_BASE_LISTING'
      });
    }

    const asoService = req.app.locals.asoOptimization;
    if (!asoService) {
      return res.status(500).json({
        error: 'ASO service not available',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const result = await asoService.generateABTestVariations(platform, baseListing, numberOfVariations);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('A/B test generation failed:', error);
    res.status(500).json({
      error: error.message || 'A/B test generation failed',
      code: error.code || 'AB_TEST_GENERATION_FAILED'
    });
  }
});

// Get ASO dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const asoService = req.app.locals.asoOptimization;
    if (!asoService) {
      return res.status(500).json({
        error: 'ASO service not available',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // This would return dashboard data
    const dashboardData = {
      totalOptimizations: 0,
      averageScore: 0,
      topKeywords: [],
      recentOptimizations: [],
      platformStats: {}
    };
    
    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Dashboard data failed:', error);
    res.status(500).json({
      error: error.message || 'Dashboard data failed',
      code: error.code || 'DASHBOARD_DATA_FAILED'
    });
  }
});

export default router;
