import type { Request, Response } from "express";
import subscriptionService from "../services/subscription.service";

export class SubscriptionController {
  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const subscription = await subscriptionService.getUserSubscription(
        req.user.userId
      );

      res.status(200).json({ subscription });
    } catch (error) {
      console.error("Error in getUserSubscription controller:", error);

      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async upgradeSubscription(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const { planId } = req.body;

      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }

      const result = await subscriptionService.upgradeSubscription(
        req.user.userId,
        planId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in upgradeSubscription controller:", error);

      if (
        (error as Error).message === "User not found" ||
        (error as Error).message === "Subscription plan not found"
      ) {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      await subscriptionService.cancelSubscription(req.user.userId);

      res.status(200).json({ message: "Subscription canceled successfully" });
    } catch (error) {
      console.error("Error in cancelSubscription controller:", error);

      if (
        (error as Error).message === "User not found" ||
        (error as Error).message === "No active subscription found"
      ) {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}

export default new SubscriptionController();
