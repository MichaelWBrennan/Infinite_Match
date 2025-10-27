/**
 * Stripe Payment Service
 * Handles Stripe payment processing, webhooks, and subscription management
 */

import Stripe from 'stripe';
import { AppConfig } from '../../core/config/index.js';
import { Logger } from '../../core/logger/index.js';
import PurchaseLedger from './PurchaseLedger.js';

const logger = new Logger('StripeService');

class StripeService {
  constructor() {
    this.stripe = new Stripe(AppConfig.payments.stripe.secretKey, {
      apiVersion: AppConfig.payments.stripe.apiVersion,
    });
    this.webhookSecret = AppConfig.payments.stripe.webhookSecret;
  }

  /**
   * Create a payment intent for one-time purchases
   */
  async createPaymentIntent({ amount, currency, metadata = {}, customerId = null }) {
    try {
      const paymentIntentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || AppConfig.payments.stripe.currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);
      
      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Failed to create payment intent', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer({ email, name, metadata = {} }) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info('Customer created', {
        customerId: customer.id,
        email: customer.email,
      });

      return {
        success: true,
        customerId: customer.id,
        customer,
      };
    } catch (error) {
      logger.error('Failed to create customer', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve a customer from Stripe
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return {
          success: false,
          error: 'Customer has been deleted',
        };
      }

      return {
        success: true,
        customer,
      };
    } catch (error) {
      logger.error('Failed to retrieve customer', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription({ customerId, priceId, metadata = {} }) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        expand: ['latest_invoice.payment_intent'],
      });

      logger.info('Subscription created', {
        subscriptionId: subscription.id,
        customerId,
        priceId,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscription,
      };
    } catch (error) {
      logger.error('Failed to create subscription', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a price for a product
   */
  async createPrice({ productId, unitAmount, currency, recurring = null, metadata = {} }) {
    try {
      const priceData = {
        product: productId,
        unit_amount: Math.round(unitAmount * 100), // Convert to cents
        currency: currency || AppConfig.payments.stripe.currency,
        metadata,
      };

      if (recurring) {
        priceData.recurring = recurring;
      }

      const price = await this.stripe.prices.create(priceData);

      logger.info('Price created', {
        priceId: price.id,
        productId,
        unitAmount: price.unit_amount,
        currency: price.currency,
      });

      return {
        success: true,
        priceId: price.id,
        price,
      };
    } catch (error) {
      logger.error('Failed to create price', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a product in Stripe
   */
  async createProduct({ name, description, metadata = {}, images = [] }) {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
        metadata,
        images,
      });

      logger.info('Product created', {
        productId: product.id,
        name: product.name,
      });

      return {
        success: true,
        productId: product.id,
        product,
      };
    } catch (error) {
      logger.error('Failed to create product', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        paymentIntent,
      };
    } catch (error) {
      logger.error('Failed to retrieve payment intent', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !immediately,
        ...(immediately && { status: 'canceled' }),
      });

      logger.info('Subscription canceled', {
        subscriptionId,
        immediately,
        status: subscription.status,
      });

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      logger.error('Failed to cancel subscription', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process webhook events
   */
  async processWebhook(rawBody, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      logger.info('Webhook event received', {
        type: event.type,
        id: event.id,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      return {
        success: true,
        eventType: event.type,
      };
    } catch (error) {
      logger.error('Webhook processing failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle successful payment intent
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    const { id, amount, currency, metadata } = paymentIntent;
    
    await PurchaseLedger.recordPurchase({
      transactionId: id,
      productId: metadata.productId || 'unknown',
      amount: amount / 100, // Convert from cents
      currency,
      platform: 'stripe',
      playerId: metadata.playerId,
      paymentIntentId: id,
    });

    logger.info('Payment intent succeeded', {
      paymentIntentId: id,
      amount: amount / 100,
      currency,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle failed payment intent
   */
  async handlePaymentIntentFailed(paymentIntent) {
    const { id, amount, currency, metadata } = paymentIntent;
    
    logger.warn('Payment intent failed', {
      paymentIntentId: id,
      amount: amount / 100,
      currency,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    const { id, customer, metadata } = subscription;
    
    await PurchaseLedger.recordSubscriptionEvent({
      eventType: 'created',
      subscriptionId: id,
      customerId: customer,
      playerId: metadata.playerId,
    });

    logger.info('Subscription created', {
      subscriptionId: id,
      customerId: customer,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    const { id, status, metadata } = subscription;
    
    await PurchaseLedger.recordSubscriptionEvent({
      eventType: 'updated',
      subscriptionId: id,
      status,
      playerId: metadata.playerId,
    });

    logger.info('Subscription updated', {
      subscriptionId: id,
      status,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    const { id, metadata } = subscription;
    
    await PurchaseLedger.recordSubscriptionEvent({
      eventType: 'deleted',
      subscriptionId: id,
      playerId: metadata.playerId,
    });

    logger.info('Subscription deleted', {
      subscriptionId: id,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle successful invoice payment
   */
  async handleInvoicePaymentSucceeded(invoice) {
    const { id, amount_paid, currency, subscription, metadata } = invoice;
    
    if (subscription) {
      await PurchaseLedger.recordSubscriptionEvent({
        eventType: 'payment_succeeded',
        subscriptionId: subscription,
        amount: amount_paid / 100,
        currency,
        playerId: metadata.playerId,
      });
    }

    logger.info('Invoice payment succeeded', {
      invoiceId: id,
      amount: amount_paid / 100,
      currency,
      subscriptionId: subscription,
      playerId: metadata.playerId,
    });
  }

  /**
   * Handle failed invoice payment
   */
  async handleInvoicePaymentFailed(invoice) {
    const { id, amount_due, currency, subscription, metadata } = invoice;
    
    if (subscription) {
      await PurchaseLedger.recordSubscriptionEvent({
        eventType: 'payment_failed',
        subscriptionId: subscription,
        amount: amount_due / 100,
        currency,
        playerId: metadata.playerId,
      });
    }

    logger.warn('Invoice payment failed', {
      invoiceId: id,
      amount: amount_due / 100,
      currency,
      subscriptionId: subscription,
      playerId: metadata.playerId,
    });
  }

  /**
   * Get publishable key for frontend
   */
  getPublishableKey() {
    return AppConfig.payments.stripe.publishableKey;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(rawBody, signature) {
    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch (error) {
      logger.error('Webhook signature validation failed', { error: error.message });
      return false;
    }
  }
}

export default new StripeService();