import type { Request, Response } from "express";
import authService from "../services/auth.service";
import type { UserCreateInput } from "../models/user.model";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const userInput: UserCreateInput = { email, password };

      try {
        const result = await authService.register(userInput);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error in register service:", error);

        if (
          (error as Error).message === "User with this email already exists"
        ) {
          res.status(409).json({ message: (error as Error).message });
        } else if ((error as any).code === "UnrecognizedClientException") {
          // AWS credential error
          res.status(500).json({
            message:
              "AWS authentication error. Please check your AWS credentials.",
            details:
              "The application cannot connect to AWS services. Contact the administrator.",
          });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    } catch (error) {
      console.error("Error in register controller:", error);

      if ((error as Error).message === "User with this email already exists") {
        res.status(409).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      try {
        const result = await authService.login(email, password);
        res.status(200).json(result);
      } catch (error) {
        console.error("Error in login service:", error);

        if ((error as Error).message === "Invalid email or password") {
          res.status(401).json({ message: (error as Error).message });
        } else if ((error as any).code === "UnrecognizedClientException") {
          // AWS credential error
          res.status(500).json({
            message:
              "AWS authentication error. Please check your AWS credentials.",
            details:
              "The application cannot connect to AWS services. Contact the administrator.",
          });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    } catch (error) {
      console.error("Error in login controller:", error);

      if ((error as Error).message === "Invalid email or password") {
        res.status(401).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      console.log("User in request:", req.user);

      try {
        const user = await authService.getUserById(req.user.userId);
        res.status(200).json({ user });
      } catch (error) {
        console.error("Error in me service:", error);

        if ((error as Error).message === "User not found") {
          res.status(404).json({ message: (error as Error).message });
        } else if ((error as any).code === "UnrecognizedClientException") {
          // AWS credential error
          res.status(500).json({
            message:
              "AWS authentication error. Please check your AWS credentials.",
            details:
              "The application cannot connect to AWS services. Contact the administrator.",
          });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    } catch (error) {
      console.error("Error in me controller:", error);

      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}

export default new AuthController();
