import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const JWT_SECRET = (process.env.JWT_SECRET as string) || "your-secret-key";
// Ensure `JWT_EXPIRES_IN` can be a valid time string (like "24h", "1d", etc.)
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string) || "24h";

export interface TokenPayload {
  userId: string;
  email: string;
  subscriptionId?: string;
}

// Explicitly cast the `expiresIn` osption to the correct type
export const generateToken = (payload: TokenPayload): string => {
  // Casting to StringValue
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};

export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};
