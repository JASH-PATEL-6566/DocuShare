import type { Request, Response } from "express";
import userService from "../services/user.service";
import type { UserUpdateInput } from "../models/user.model";

export class UserController {
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const { email, password } = req.body;
      const userInput: UserUpdateInput = {};

      if (email) userInput.email = email;
      if (password) userInput.password = password;

      const updatedUser = await userService.updateUser(
        req.user.userId,
        userInput
      );

      res.status(200).json({ user: updatedUser });
    } catch (error) {
      console.error("Error in updateUser controller:", error);

      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      await userService.deleteUser(req.user.userId);

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error in deleteUser controller:", error);

      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}

export default new UserController();
