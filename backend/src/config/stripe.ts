import Stripe from "stripe";
import { config } from "dotenv";

config();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

// Subscription plan IDs
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  PREMIUM: "premium",
  BUSINESS: "business",
};

// Helper functions for common Stripe operations
export const stripeHelpers = {
  // Create a checkout session for subscription
  createCheckoutSession: async (
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) => {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  // Create a customer in Stripe
  createCustomer: async (email: string, name: string) => {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });

      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // Get subscription details
  getSubscription: async (subscriptionId: string) => {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string) => {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  },
};
