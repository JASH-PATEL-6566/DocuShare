export interface SubscriptionPlan {
  planId: string
  name: string
  features: {
    storageLimit: string
    downloadLimit: string
    linkExpiry: string
    passwordProtection: boolean
  }
  price: number
  createdAt: string
}

export interface UserSubscription {
  userId: string
  planId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  startDate: string
  endDate: string
  status: "active" | "canceled" | "expired"
}

export interface SubscriptionCreateInput {
  userId: string
  planId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export interface SubscriptionUpdateInput {
  planId?: string
  stripeSubscriptionId?: string
  endDate?: string
  status?: "active" | "canceled" | "expired"
}

export interface SubscriptionResponse {
  planId: string
  name: string
  features: {
    storageLimit: string
    downloadLimit: string
    linkExpiry: string
    passwordProtection: boolean
  }
  status: "active" | "canceled" | "expired"
  endDate: string
}
