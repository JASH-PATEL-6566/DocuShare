import { dynamoDbHelpers, TABLES } from "../config/dynamodb"
import { stripeHelpers } from "../config/stripe"
import type { SubscriptionPlan, SubscriptionResponse } from "../models/subscription.model"

export class SubscriptionService {
  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      // Get subscription plan from DynamoDB
      const plan = (await dynamoDbHelpers.getItem(TABLES.SUBSCRIPTION_PLANS, { planId })) as SubscriptionPlan

      if (!plan) {
        throw new Error("Subscription plan not found")
      }

      return plan
    } catch (error) {
      console.error("Error getting subscription plan:", error)
      throw error
    }
  }

  async getUserSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      // Get user
      const user = await dynamoDbHelpers.getItem(TABLES.USERS, { userId })

      if (!user) {
        throw new Error("User not found")
      }

      // Get subscription plan
      const plan = await this.getSubscriptionPlan(user.subscriptionId)

      // Return subscription response
      const subscriptionResponse: SubscriptionResponse = {
        planId: plan.planId,
        name: plan.name,
        features: plan.features,
        status: "active", // Default status
        endDate: user.subscriptionExpiry || "",
      }

      return subscriptionResponse
    } catch (error) {
      console.error("Error getting user subscription:", error)
      throw error
    }
  }

  async upgradeSubscription(userId: string, planId: string): Promise<{ checkoutUrl: string }> {
    try {
      // Get user
      const user = await dynamoDbHelpers.getItem(TABLES.USERS, { userId })

      if (!user) {
        throw new Error("User not found")
      }

      // Get subscription plan
      const plan = await this.getSubscriptionPlan(planId)

      if (!plan) {
        throw new Error("Subscription plan not found")
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId

      if (!stripeCustomerId) {
        const customer = await stripeHelpers.createCustomer(user.email, user.email)
        stripeCustomerId = customer.id

        // Update user with Stripe customer ID
        await dynamoDbHelpers.updateItem(TABLES.USERS, { userId }, "SET stripeCustomerId = :stripeCustomerId", {
          ":stripeCustomerId": stripeCustomerId,
        })
      }

      // Create checkout session
      const session = await stripeHelpers.createCheckoutSession(
        stripeCustomerId,
        plan.planId, // Assuming planId is also the Stripe price ID
        `${process.env.FRONTEND_URL}/subscription/success`,
        `${process.env.FRONTEND_URL}/subscription/cancel`,
      )

      return { checkoutUrl: session.url! }
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      throw error
    }
  }

  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      // Get user
      const user = await dynamoDbHelpers.getItem(TABLES.USERS, { userId })

      if (!user) {
        throw new Error("User not found")
      }

      if (!user.stripeSubscriptionId) {
        throw new Error("No active subscription found")
      }

      // Cancel subscription in Stripe
      await stripeHelpers.cancelSubscription(user.stripeSubscriptionId)

      // Update user subscription status
      await dynamoDbHelpers.updateItem(
        TABLES.USERS,
        { userId },
        "SET subscriptionId = :subscriptionId, subscriptionStatus = :subscriptionStatus",
        {
          ":subscriptionId": "free",
          ":subscriptionStatus": "canceled",
        },
      )

      return true
    } catch (error) {
      console.error("Error canceling subscription:", error)
      throw error
    }
  }
}

export default new SubscriptionService()
