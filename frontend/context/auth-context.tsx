"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  logout as apiLogout,
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface User {
  userId: string;
  email: string;
  subscriptionId: string;
  subscriptionExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Function to fetch current user data
  const refreshUser = async () => {
    console.log("Auth: Refreshing user data");
    setAuthError(null);

    try {
      // Check for token in sessionStorage
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

      if (!token) {
        console.log("Auth: No token found during refresh");
        setUser(null);
        return;
      }

      console.log("Auth: Token found, fetching user data");
      const userData = await getCurrentUser();
      console.log("Auth: User data fetched successfully");
      setUser(userData.user);

      toast({
        title: "Session refreshed",
        description: "Your session has been refreshed successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Auth: Error refreshing user data:", error);

      // Set auth error message
      setAuthError(error.message || "Failed to authenticate user");

      // For 500 errors, we'll keep the token and assume it's a temporary backend issue
      if (error.status === 500) {
        console.warn(
          "Auth: Backend server error (500), keeping token for retry"
        );
        toast({
          variant: "destructive",
          title: "Server error",
          description:
            "The server encountered an error. Please try again later.",
        });
      } else {
        // For other errors, clear the token
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("token");
        }
        setUser(null);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: error.message || "Failed to authenticate user.",
        });
      }
    }
  };

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      console.log("Auth: Initial auth check");

      try {
        await refreshUser();
      } catch (error) {
        console.error("Auth: Initial auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Auth: Login attempt");
    setAuthError(null);

    try {
      const data = await apiLogin(email, password);
      console.log("Auth: Login successful, token received");

      // Store token in sessionStorage
      if (data.token && typeof window !== "undefined") {
        sessionStorage.setItem("token", data.token);
        setUser(data.user);
      }

      toast({
        title: "Login successful",
        description: "Welcome back to DocuShare!",
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error("Auth: Login error:", error);
      setAuthError(error.message || "Login failed");

      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password.",
      });

      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    console.log("Auth: Register attempt");
    setAuthError(null);

    try {
      const data = await apiRegister(email, password);
      console.log("Auth: Registration successful, token received");

      // Store token in sessionStorage
      if (data.token && typeof window !== "undefined") {
        sessionStorage.setItem("token", data.token);
        setUser(data.user);
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error("Auth: Registration error:", error);
      setAuthError(error.message || "Registration failed");

      toast({
        variant: "destructive",
        title: "Registration failed",
        description:
          error.message || "There was a problem creating your account.",
      });

      throw error;
    }
  };

  const logout = () => {
    console.log("Auth: Logging out, clearing token");
    setAuthError(null);
    apiLogout();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
    }
    setUser(null);

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
      variant: "default",
    });

    router.push("/");
  };

  // Consider a user authenticated if they have a token, even if we couldn't fetch their data
  const hasToken =
    typeof window !== "undefined" && !!sessionStorage.getItem("token");
  const isAuthenticated = !!user || hasToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
