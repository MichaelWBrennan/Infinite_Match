export default StripePaymentManager;
declare class StripePaymentManager {
    stripe: import("@stripe/stripe-js").Stripe | null;
    elements: any;
    paymentElement: any;
    isInitialized: boolean;
    apiBaseUrl: string;
    /**
     * Initialize Stripe with publishable key
     */
    initialize(): Promise<boolean>;
    /**
     * Create a payment intent for one-time purchases
     */
    createPaymentIntent({ amount, currency, productId, metadata }: {
        amount: any;
        currency: any;
        productId: any;
        metadata?: {} | undefined;
    }): Promise<{
        clientSecret: any;
        paymentIntentId: any;
    }>;
    /**
     * Create a customer
     */
    createCustomer({ email, name, metadata }: {
        email: any;
        name: any;
        metadata?: {} | undefined;
    }): Promise<{
        customerId: any;
        customer: any;
    }>;
    /**
     * Create a subscription
     */
    createSubscription({ customerId, priceId, metadata }: {
        customerId: any;
        priceId: any;
        metadata?: {} | undefined;
    }): Promise<{
        subscriptionId: any;
        clientSecret: any;
        subscription: any;
    }>;
    /**
     * Process payment with Stripe Elements
     */
    processPayment({ amount, currency, productId, metadata }: {
        amount: any;
        currency: any;
        productId: any;
        metadata?: {} | undefined;
    }): Promise<{
        success: boolean;
        paymentIntent: any;
        paymentIntentId: any;
    }>;
    /**
     * Process subscription payment
     */
    processSubscription({ customerId, priceId, metadata }: {
        customerId: any;
        priceId: any;
        metadata?: {} | undefined;
    }): Promise<{
        success: boolean;
        subscription: any;
        subscriptionId: any;
    }>;
    /**
     * Get payment intent status
     */
    getPaymentIntentStatus(paymentIntentId: any): Promise<any>;
    /**
     * Cancel subscription
     */
    cancelSubscription(subscriptionId: any, immediately?: boolean): Promise<any>;
    /**
     * Get purchase history
     */
    getPurchaseHistory({ limit, offset }?: {
        limit?: number | undefined;
        offset?: number | undefined;
    }): Promise<any>;
    /**
     * Show payment modal
     */
    showPaymentModal({ amount, currency, productId, productName, metadata }: {
        amount: any;
        currency: any;
        productId: any;
        productName: any;
        metadata?: {} | undefined;
    }): Promise<{
        elements: import("@stripe/stripe-js").StripeElements;
        paymentElement: import("@stripe/stripe-js").StripePaymentElement;
    }>;
    /**
     * Check if Stripe is initialized
     */
    isReady(): boolean;
}
//# sourceMappingURL=stripe-payment.d.ts.map