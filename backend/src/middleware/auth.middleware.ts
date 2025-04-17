// import type { Request, Response, NextFunction } from "express"
// import { verifyToken, extractTokenFromHeader } from "../utils/jwt"

// // Extend Express Request type to include user
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: string
//         email: string
//         subscriptionId?: string
//       }
//     }
//   }
// }

// export const authenticate = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Extract token from Authorization header
//     const token = extractTokenFromHeader(req.headers.authorization)

//     if (!token) {
//       return res.status(401).json({ message: "Authentication required" })
//     }

//     // Verify token
//     const decoded = verifyToken(token)

//     if (!decoded) {
//       return res.status(401).json({ message: "Invalid or expired token" })
//     }

//     // Attach user to request
//     req.user = {
//       userId: decoded.userId,
//       email: decoded.email,
//       subscriptionId: decoded.subscriptionId,
//     }

//     next()
//   } catch (error) {
//     console.error("Authentication error:", error)
//     return res.status(401).json({ message: "Authentication failed" })
//   }
// }
import type { RequestHandler } from "express";
import { verifyToken, extractTokenFromHeader } from "../utils/jwt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        subscriptionId?: string;
      };
    }
  }
}

export const authenticate: RequestHandler = (req, res, next): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      subscriptionId: decoded.subscriptionId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
