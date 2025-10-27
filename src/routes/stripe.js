/**
 * Stripe API Routes
 * Handles Stripe payment processing endpoints
 */

import express from 'express';
import { body, validationResult, query } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import StripeService from '../services/payments/StripeService.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';

const router = express.Router();
const logger = new Logger('StripeRoutes');

// Validation middleware
const validatePaymentIntent = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('productId').isString().withMessage('Product ID is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

const validateCustomer = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

const validateSubscription = [
  body('customerId').isString().withMessage('Customer ID is required'),
  body('priceId').isString().withMessage('Price ID is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

const validateProduct = [
  body('name').isString().withMessage('Product name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('images').optional().isArray().withMessage('Images must be an array'),
];

const validatePrice = [
  body('productId').isString().withMessage('Product ID is required'),
  body('unitAmount').isFloat({ min: 0.01 }).withMessage('Unit amount must be greater than 0'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('recurring').optional().isObject().withMessage('Recurring must be an object'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

// Helper function for consistent error handling
const handleRouteError = (res, error, operation, requestId) => {
  logger.error(`Failed to ${operation}`, { error: error.message });
  res.status(500).json({
    success: false,
    error: `Failed to ${operation}`,
    requestId,
  });
};

// Get Stripe publishable key
router.get('/publishable-key', security.sessionValidation, (req, res) => {
  try {
    const publishableKey = StripeService.getPublishableKey();
    res.json({
      success: true,
      publishableKey,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get publishable key', req.requestId);
  }
});

// Create payment intent
router.post('/payment-intent', security.sessionValidation, validatePaymentIntent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { amount, currency, productId, metadata = {} } = req.body;
    const playerId = req.user?.playerId;

    // Add player ID to metadata
    const enrichedMetadata = {
      ...metadata,
      playerId,
      productId,
    };

    const result = await StripeService.createPaymentIntent({
      amount,
      currency,
      metadata: enrichedMetadata,
      customerId: req.user?.stripeCustomerId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create payment intent', req.requestId);
  }
});

// Create customer
router.post('/customer', security.sessionValidation, validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { email, name, metadata = {} } = req.body;
    const playerId = req.user?.playerId;

    // Add player ID to metadata
    const enrichedMetadata = {
      ...metadata,
      playerId,
    };

    const result = await StripeService.createCustomer({
      email,
      name,
      metadata: enrichedMetadata,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    // TODO: Store customer ID in user profile
    // await updateUserProfile(playerId, { stripeCustomerId: result.customerId });

    res.json({
      success: true,
      customerId: result.customerId,
      customer: result.customer,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create customer', req.requestId);
  }
});

// Get customer
router.get('/customer/:customerId', security.sessionValidation, async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await StripeService.getCustomer(customerId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      customer: result.customer,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get customer', req.requestId);
  }
});

// Create subscription
router.post('/subscription', security.sessionValidation, validateSubscription, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { customerId, priceId, metadata = {} } = req.body;
    const playerId = req.user?.playerId;

    // Add player ID to metadata
    const enrichedMetadata = {
      ...metadata,
      playerId,
    };

    const result = await StripeService.createSubscription({
      customerId,
      priceId,
      metadata: enrichedMetadata,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      subscription: result.subscription,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create subscription', req.requestId);
  }
});

// Cancel subscription
router.post('/subscription/:subscriptionId/cancel', security.sessionValidation, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { immediately = false } = req.body;

    const result = await StripeService.cancelSubscription(subscriptionId, immediately);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      subscription: result.subscription,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'cancel subscription', req.requestId);
  }
});

// Create product
router.post('/product', security.sessionValidation, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { name, description, metadata = {}, images = [] } = req.body;

    const result = await StripeService.createProduct({
      name,
      description,
      metadata,
      images,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      productId: result.productId,
      product: result.product,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create product', req.requestId);
  }
});

// Create price
router.post('/price', security.sessionValidation, validatePrice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        requestId: req.requestId,
      });
    }

    const { productId, unitAmount, currency, recurring = null, metadata = {} } = req.body;

    const result = await StripeService.createPrice({
      productId,
      unitAmount,
      currency,
      recurring,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      priceId: result.priceId,
      price: result.price,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'create price', req.requestId);
  }
});

// Get payment intent
router.get('/payment-intent/:paymentIntentId', security.sessionValidation, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const result = await StripeService.getPaymentIntent(paymentIntentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      paymentIntent: result.paymentIntent,
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get payment intent', req.requestId);
  }
});

// Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature',
      });
    }

    const result = await StripeService.processWebhook(req.body, signature);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      eventType: result.eventType,
    });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
});

// Get purchase history
router.get('/purchases', security.sessionValidation, async (req, res) => {
  try {
    const playerId = req.user?.playerId;
    const { limit = 50, offset = 0 } = req.query;

    // This would typically query your database for purchase history
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      purchases: [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: 0,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    handleRouteError(res, error, 'get purchase history', req.requestId);
  }
});

export default router;