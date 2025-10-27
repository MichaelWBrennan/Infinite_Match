/**
 * Stripe Payment Frontend Integration
 * Handles Stripe payment processing on the client side
 */

import { loadStripe } from '@stripe/stripe-js';

class StripePaymentManager {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.isInitialized = false;
    this.apiBaseUrl = '/api/stripe';
  }

  /**
   * Initialize Stripe with publishable key
   */
  async initialize() {
    try {
      // Get publishable key from server
      const response = await fetch(`${this.apiBaseUrl}/publishable-key`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get Stripe publishable key');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get publishable key');
      }

      // Initialize Stripe
      this.stripe = await loadStripe(data.publishableKey);
      
      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      this.isInitialized = true;
      console.log('Stripe initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return false;
    }
  }

  /**
   * Create a payment intent for one-time purchases
   */
  async createPaymentIntent({ amount, currency, productId, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          currency,
          productId,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer({ email, name, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          name,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create customer');
      }

      return {
        customerId: data.customerId,
        customer: data.customer,
      };
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription({ customerId, priceId, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId,
          priceId,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      return {
        subscriptionId: data.subscriptionId,
        clientSecret: data.clientSecret,
        subscription: data.subscription,
      };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Process payment with Stripe Elements
   */
  async processPayment({ amount, currency, productId, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await this.createPaymentIntent({
        amount,
        currency,
        productId,
        metadata,
      });

      // Confirm payment with Stripe
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        paymentIntent,
        paymentIntentId,
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscription({ customerId, priceId, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      // Create subscription
      const { clientSecret, subscriptionId } = await this.createSubscription({
        customerId,
        priceId,
        metadata,
      });

      // Confirm payment with Stripe
      const { error, subscription } = await this.stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        subscription,
        subscriptionId,
      };
    } catch (error) {
      console.error('Subscription processing failed:', error);
      throw error;
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntentStatus(paymentIntentId) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment-intent/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get payment intent status');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get payment intent status');
      }

      return data.paymentIntent;
    } catch (error) {
      console.error('Failed to get payment intent status:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          immediately,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      return data.subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory({ limit = 50, offset = 0 } = {}) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/purchases?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get purchase history');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get purchase history');
      }

      return data;
    } catch (error) {
      console.error('Failed to get purchase history:', error);
      throw error;
    }
  }

  /**
   * Show payment modal
   */
  async showPaymentModal({ amount, currency, productId, productName, metadata = {} }) {
    if (!this.isInitialized) {
      throw new Error('Stripe not initialized');
    }

    // Create payment modal HTML
    const modalHtml = `
      <div id="stripe-payment-modal" class="stripe-payment-modal">
        <div class="stripe-payment-content">
          <div class="stripe-payment-header">
            <h3>Complete Payment</h3>
            <button class="stripe-payment-close" onclick="this.closest('.stripe-payment-modal').remove()">&times;</button>
          </div>
          <div class="stripe-payment-body">
            <div class="stripe-payment-product">
              <h4>${productName}</h4>
              <p class="stripe-payment-price">${currency.toUpperCase()} ${amount.toFixed(2)}</p>
            </div>
            <div id="stripe-payment-element" class="stripe-payment-element">
              <!-- Stripe Elements will be inserted here -->
            </div>
            <div class="stripe-payment-actions">
              <button id="stripe-payment-submit" class="stripe-payment-button">
                Pay ${currency.toUpperCase()} ${amount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize Stripe Elements
    const elements = this.stripe.elements({
      clientSecret: '', // Will be set when payment intent is created
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#f39c12',
          colorBackground: '#ffffff',
          colorText: '#333333',
          colorDanger: '#df1b41',
          fontFamily: 'Fredoka, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
      },
    });

    const paymentElement = elements.create('payment');
    paymentElement.mount('#stripe-payment-element');

    // Handle form submission
    const submitButton = document.getElementById('stripe-payment-submit');
    submitButton.addEventListener('click', async () => {
      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        // Create payment intent
        const { clientSecret } = await this.createPaymentIntent({
          amount,
          currency,
          productId,
          metadata,
        });

        // Update elements with client secret
        elements.update({ clientSecret });

        // Confirm payment
        const { error } = await this.stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success`,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        // Success - close modal
        document.getElementById('stripe-payment-modal').remove();
        
        // Trigger success event
        window.dispatchEvent(new CustomEvent('stripe-payment-success', {
          detail: { amount, currency, productId, productName }
        }));

      } catch (error) {
        console.error('Payment failed:', error);
        submitButton.disabled = false;
        submitButton.textContent = `Pay ${currency.toUpperCase()} ${amount.toFixed(2)}`;
        
        // Show error message
        alert(`Payment failed: ${error.message}`);
      }
    });

    return {
      elements,
      paymentElement,
    };
  }

  /**
   * Check if Stripe is initialized
   */
  isReady() {
    return this.isInitialized && this.stripe !== null;
  }
}

// Create global instance
window.StripePaymentManager = new StripePaymentManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await window.StripePaymentManager.initialize();
});

export default StripePaymentManager;