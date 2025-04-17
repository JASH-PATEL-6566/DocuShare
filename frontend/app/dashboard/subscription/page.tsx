"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { fetchSubscription, upgradeSubscription, cancelSubscription } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Check } from "lucide-react"

interface SubscriptionPlan {
  planId: string
  name: string
  features: {
    storageLimit: string
    downloadLimit: string
    linkExpiry: string
    passwordProtection: boolean
  }
  status: string
  endDate?: string
}

export default function SubscriptionPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    async function loadSubscription() {
      setIsLoading(true)
      try {
        const data = await fetchSubscription()
        setSubscription(data.subscription)
      } catch (error) {
        console.error("Error loading subscription:", error)
        toast({
          variant: "destructive",
          title: "Error loading subscription",
          description: "There was a problem loading your subscription details.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [toast])

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true)
    try {
      const data = await upgradeSubscription(planId)
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      toast({
        variant: "destructive",
        title: "Upgrade failed",
        description: "There was a problem upgrading your subscription.",
      })
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await cancelSubscription()
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      })
      // Refresh subscription data
      const data = await fetchSubscription()
      setSubscription(data.subscription)
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: "There was a problem cancelling your subscription.",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plan</p>
                  <p className="text-2xl font-bold">{subscription?.name || "Free Plan"}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Status</p>
                  <p className="capitalize font-semibold">{subscription?.status || "active"}</p>
                </div>
              </div>
              {subscription?.endDate && (
                <div>
                  <p className="font-medium">Renewal Date</p>
                  <p>{new Date(subscription.endDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="font-medium">Features</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Storage: {subscription?.features.storageLimit || "1GB"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Downloads: {subscription?.features.downloadLimit || "Limited"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Link Expiry: {subscription?.features.linkExpiry || "7 days"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Password Protection: {subscription?.features.passwordProtection ? "Yes" : "Basic"}
                  </li>
                </ul>
              </div>
            </CardContent>
            {subscription?.status === "active" && subscription?.planId !== "free" && (
              <CardFooter>
                <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className={subscription?.planId === "free" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Basic file sharing for individuals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $0
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      1GB Storage
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      7-day Link Expiry
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Basic Password Protection
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled={subscription?.planId === "free"}>
                    {subscription?.planId === "free" ? "Current Plan" : "Downgrade"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className={subscription?.planId === "premium" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>Premium</CardTitle>
                  <CardDescription>Advanced features for professionals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $9.99
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      10GB Storage
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      30-day Link Expiry
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Advanced Password Protection
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Download & View Limits
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Access Tracking
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {subscription?.planId === "premium" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleUpgrade("premium")} disabled={isUpgrading}>
                      {isUpgrading ? "Processing..." : "Upgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card className={subscription?.planId === "business" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>Business</CardTitle>
                  <CardDescription>Enterprise-grade security for teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $29.99
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      100GB Storage
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Custom Link Expiry
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Enterprise-grade Security
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Advanced Analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Priority Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {subscription?.planId === "business" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleUpgrade("business")} disabled={isUpgrading}>
                      {isUpgrading ? "Processing..." : "Upgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
