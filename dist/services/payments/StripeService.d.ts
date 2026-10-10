declare const _default: StripeService;
export default _default;
declare class StripeService {
    stripe: Stripe;
    webhookSecret: string;
    /**
     * Create a payment intent for one-time purchases
     */
    createPaymentIntent({ amount, currency, metadata, customerId }: {
        amount: any;
        currency: any;
        metadata?: {} | undefined;
        customerId?: null | undefined;
    }): Promise<{
        success: boolean;
        clientSecret: string | null;
        paymentIntentId: string;
        error?: never;
    } | {
        success: boolean;
        error: any;
        clientSecret?: never;
        paymentIntentId?: never;
    }>;
    /**
     * Hosted Stripe Checkout for one product. The payment intent it creates carries the same
     * metadata, so the existing payment_intent.succeeded webhook grants it.
     */
    createCheckoutSession({ amountCents, currency, productName, metadata, clientReferenceId, successUrl, cancelUrl }: {
        amountCents: any;
        currency: any;
        productName: any;
        metadata: any;
        clientReferenceId: any;
        successUrl: any;
        cancelUrl: any;
    }): Promise<{
        success: boolean;
        url: string | null;
        sessionId: string;
        error?: never;
    } | {
        success: boolean;
        error: any;
        url?: never;
        sessionId?: never;
    }>;
    /**
     * Create a customer in Stripe
     */
    createCustomer({ email, name, metadata }: {
        email: any;
        name: any;
        metadata?: {} | undefined;
    }): Promise<{
        success: boolean;
        customerId: string;
        customer: Stripe.Response<Stripe.Customer>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        customerId?: never;
        customer?: never;
    }>;
    /**
     * Retrieve a customer from Stripe
     */
    getCustomer(customerId: any): Promise<{
        success: boolean;
        customer: Stripe.Customer & {
            lastResponse: {
                headers: {
                    [key: string]: string;
                };
                requestId: string;
                statusCode: number;
                apiVersion?: string;
                idempotencyKey?: string;
                stripeAccount?: string;
            };
        };
        error?: never;
    } | {
        success: boolean;
        error: any;
        customer?: never;
    }>;
    /**
     * Create a subscription for recurring payments
     */
    createSubscription({ customerId, priceId, metadata }: {
        customerId: any;
        priceId: any;
        metadata?: {} | undefined;
    }): Promise<{
        success: boolean;
        subscriptionId: string;
        clientSecret: any;
        subscription: Stripe.Response<Stripe.Subscription>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        subscriptionId?: never;
        clientSecret?: never;
        subscription?: never;
    }>;
    /**
     * Create a price for a product
     */
    createPrice({ productId, unitAmount, currency, recurring, metadata }: {
        productId: any;
        unitAmount: any;
        currency: any;
        recurring?: null | undefined;
        metadata?: {} | undefined;
    }): Promise<{
        success: boolean;
        priceId: string;
        price: Stripe.Response<Stripe.Price>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        priceId?: never;
        price?: never;
    }>;
    /**
     * Create a product in Stripe
     */
    createProduct({ name, description, metadata, images }: {
        name: any;
        description: any;
        metadata?: {} | undefined;
        images?: never[] | undefined;
    }): Promise<{
        success: boolean;
        productId: string;
        product: Stripe.Response<Stripe.Product>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        productId?: never;
        product?: never;
    }>;
    /**
     * Retrieve a payment intent
     */
    getPaymentIntent(paymentIntentId: any): Promise<{
        success: boolean;
        paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        paymentIntent?: never;
    }>;
    /**
     * Cancel a subscription
     */
    cancelSubscription(subscriptionId: any, immediately?: boolean): Promise<{
        success: boolean;
        subscription: Stripe.Response<Stripe.Subscription>;
        error?: never;
    } | {
        success: boolean;
        error: any;
        subscription?: never;
    }>;
    /**
     * Process webhook events
     */
    processWebhook(rawBody: any, signature: any): Promise<{
        success: boolean;
        eventType: "account.application.authorized" | "account.application.deauthorized" | "account.external_account.created" | "account.external_account.deleted" | "account.external_account.updated" | "account.updated" | "application_fee.created" | "application_fee.refund.updated" | "application_fee.refunded" | "apps.install.created" | "apps.install.deleted" | "apps.install.updated" | "balance.available" | "balance_settings.updated" | "billing.alert.triggered" | "billing.credit_balance_transaction.created" | "billing.credit_grant.created" | "billing.credit_grant.updated" | "billing.meter.created" | "billing.meter.deactivated" | "billing.meter.reactivated" | "billing.meter.updated" | "billing_portal.configuration.created" | "billing_portal.configuration.updated" | "billing_portal.session.created" | "capability.updated" | "cash_balance.funds_available" | "charge.captured" | "charge.dispute.closed" | "charge.dispute.created" | "charge.dispute.funds_reinstated" | "charge.dispute.funds_withdrawn" | "charge.dispute.updated" | "charge.expired" | "charge.failed" | "charge.pending" | "charge.refund.updated" | "charge.refunded" | "charge.succeeded" | "charge.updated" | "checkout.session.async_payment_failed" | "checkout.session.async_payment_succeeded" | "checkout.session.completed" | "checkout.session.expired" | "climate.order.canceled" | "climate.order.created" | "climate.order.delayed" | "climate.order.delivered" | "climate.order.product_substituted" | "climate.product.created" | "climate.product.pricing_updated" | "coupon.created" | "coupon.deleted" | "coupon.updated" | "credit_note.created" | "credit_note.updated" | "credit_note.voided" | "customer.created" | "customer.deleted" | "customer.discount.created" | "customer.discount.deleted" | "customer.discount.updated" | "customer.source.created" | "customer.source.deleted" | "customer.source.expiring" | "customer.source.updated" | "customer.subscription.created" | "customer.subscription.deleted" | "customer.subscription.paused" | "customer.subscription.pending_update_applied" | "customer.subscription.pending_update_expired" | "customer.subscription.resumed" | "customer.subscription.trial_will_end" | "customer.subscription.updated" | "customer.tax_id.created" | "customer.tax_id.deleted" | "customer.tax_id.updated" | "customer.updated" | "customer_cash_balance_transaction.created" | "entitlements.active_entitlement_summary.updated" | "file.created" | "financial_connections.account.account_numbers_updated" | "financial_connections.account.created" | "financial_connections.account.deactivated" | "financial_connections.account.disconnected" | "financial_connections.account.expected_deactivation_date_updated" | "financial_connections.account.reactivated" | "financial_connections.account.refreshed_balance" | "financial_connections.account.refreshed_ownership" | "financial_connections.account.refreshed_transactions" | "financial_connections.account.supported_payment_method_types_updated" | "financial_connections.account.upcoming_account_number_expiry" | "financial_connections.account.upcoming_deactivation" | "financial_connections.authorization.expected_deactivation_date_updated" | "financial_connections.authorization.upcoming_deactivation" | "identity.verification_session.canceled" | "identity.verification_session.created" | "identity.verification_session.processing" | "identity.verification_session.redacted" | "identity.verification_session.requires_input" | "identity.verification_session.verified" | "invoice.created" | "invoice.deleted" | "invoice.finalization_failed" | "invoice.finalized" | "invoice.marked_uncollectible" | "invoice.overdue" | "invoice.overpaid" | "invoice.paid" | "invoice.payment_action_required" | "invoice.payment_attempt_required" | "invoice.payment_failed" | "invoice.payment_succeeded" | "invoice.sent" | "invoice.upcoming" | "invoice.updated" | "invoice.voided" | "invoice.will_be_due" | "invoice_payment.paid" | "invoiceitem.created" | "invoiceitem.deleted" | "issuing_authorization.created" | "issuing_authorization.request" | "issuing_authorization.updated" | "issuing_card.created" | "issuing_card.updated" | "issuing_cardholder.created" | "issuing_cardholder.updated" | "issuing_dispute.closed" | "issuing_dispute.created" | "issuing_dispute.funds_reinstated" | "issuing_dispute.funds_rescinded" | "issuing_dispute.submitted" | "issuing_dispute.updated" | "issuing_personalization_design.activated" | "issuing_personalization_design.deactivated" | "issuing_personalization_design.rejected" | "issuing_personalization_design.updated" | "issuing_token.created" | "issuing_token.updated" | "issuing_transaction.created" | "issuing_transaction.purchase_details_receipt_updated" | "issuing_transaction.updated" | "mandate.updated" | "payment_intent.amount_capturable_updated" | "payment_intent.canceled" | "payment_intent.created" | "payment_intent.partially_funded" | "payment_intent.payment_failed" | "payment_intent.processing" | "payment_intent.requires_action" | "payment_intent.succeeded" | "payment_link.created" | "payment_link.updated" | "payment_method.attached" | "payment_method.automatically_updated" | "payment_method.detached" | "payment_method.updated" | "payout.canceled" | "payout.created" | "payout.failed" | "payout.paid" | "payout.reconciliation_completed" | "payout.updated" | "person.created" | "person.deleted" | "person.updated" | "plan.created" | "plan.deleted" | "plan.updated" | "price.created" | "price.deleted" | "price.updated" | "product.created" | "product.deleted" | "product.updated" | "promotion_code.created" | "promotion_code.updated" | "quote.accepted" | "quote.canceled" | "quote.created" | "quote.finalized" | "radar.early_fraud_warning.created" | "radar.early_fraud_warning.updated" | "refund.created" | "refund.failed" | "refund.updated" | "reporting.report_run.failed" | "reporting.report_run.succeeded" | "reporting.report_type.updated" | "reserve.hold.created" | "reserve.hold.updated" | "reserve.plan.created" | "reserve.plan.disabled" | "reserve.plan.expired" | "reserve.plan.updated" | "reserve.release.created" | "review.closed" | "review.opened" | "setup_intent.canceled" | "setup_intent.created" | "setup_intent.requires_action" | "setup_intent.setup_failed" | "setup_intent.succeeded" | "sigma.scheduled_query_run.created" | "source.canceled" | "source.chargeable" | "source.failed" | "source.mandate_notification" | "source.refund_attributes_required" | "source.transaction.created" | "source.transaction.updated" | "subscription_schedule.aborted" | "subscription_schedule.canceled" | "subscription_schedule.completed" | "subscription_schedule.created" | "subscription_schedule.expiring" | "subscription_schedule.released" | "subscription_schedule.updated" | "tax.settings.updated" | "tax_rate.created" | "tax_rate.updated" | "terminal.reader.action_failed" | "terminal.reader.action_succeeded" | "terminal.reader.action_updated" | "test_helpers.test_clock.advancing" | "test_helpers.test_clock.created" | "test_helpers.test_clock.deleted" | "test_helpers.test_clock.internal_failure" | "test_helpers.test_clock.ready" | "topup.canceled" | "topup.created" | "topup.failed" | "topup.reversed" | "topup.succeeded" | "transfer.created" | "transfer.reversed" | "transfer.updated" | "treasury.credit_reversal.created" | "treasury.credit_reversal.posted" | "treasury.debit_reversal.completed" | "treasury.debit_reversal.created" | "treasury.debit_reversal.initial_credit_granted" | "treasury.financial_account.closed" | "treasury.financial_account.created" | "treasury.financial_account.features_status_updated" | "treasury.inbound_transfer.canceled" | "treasury.inbound_transfer.created" | "treasury.inbound_transfer.failed" | "treasury.inbound_transfer.succeeded" | "treasury.outbound_payment.canceled" | "treasury.outbound_payment.created" | "treasury.outbound_payment.expected_arrival_date_updated" | "treasury.outbound_payment.failed" | "treasury.outbound_payment.posted" | "treasury.outbound_payment.returned" | "treasury.outbound_payment.tracking_details_updated" | "treasury.outbound_transfer.canceled" | "treasury.outbound_transfer.created" | "treasury.outbound_transfer.expected_arrival_date_updated" | "treasury.outbound_transfer.failed" | "treasury.outbound_transfer.posted" | "treasury.outbound_transfer.returned" | "treasury.outbound_transfer.tracking_details_updated" | "treasury.received_credit.created" | "treasury.received_credit.failed" | "treasury.received_credit.succeeded" | "treasury.received_debit.created";
        error?: never;
    } | {
        success: boolean;
        error: any;
        eventType?: never;
    }>;
    /**
     * Handle successful payment intent
     */
    handlePaymentIntentSucceeded(paymentIntent: any): Promise<void>;
    /**
     * A full refund takes back what the payment granted. A partial refund is not reversed
     * automatically: the amount it should take back is a business decision, so it is logged.
     */
    handleChargeRefunded(charge: any): Promise<void>;
    /**
     * A dispute (chargeback) is reversed when it is opened. The bank can still decide in the
     * merchant's favour, but the coins are not kept while the dispute is open.
     */
    handleDisputeCreated(dispute: any): Promise<void>;
    /**
     * Handle failed payment intent
     */
    handlePaymentIntentFailed(paymentIntent: any): Promise<void>;
    /**
     * Handle subscription created
     */
    handleSubscriptionCreated(subscription: any): Promise<void>;
    /**
     * Handle subscription updated
     */
    handleSubscriptionUpdated(subscription: any): Promise<void>;
    /**
     * Handle subscription deleted
     */
    handleSubscriptionDeleted(subscription: any): Promise<void>;
    /**
     * Handle successful invoice payment
     */
    handleInvoicePaymentSucceeded(invoice: any): Promise<void>;
    /**
     * Handle failed invoice payment
     */
    handleInvoicePaymentFailed(invoice: any): Promise<void>;
    /**
     * Get publishable key for frontend
     */
    getPublishableKey(): string;
    /**
     * Validate webhook signature
     */
    validateWebhookSignature(rawBody: any, signature: any): boolean;
}
import Stripe from 'stripe';
//# sourceMappingURL=StripeService.d.ts.map