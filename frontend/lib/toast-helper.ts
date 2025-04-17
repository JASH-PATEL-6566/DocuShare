// Let's create a helper file to make toast usage more consistent

import { toast as showToast } from "@/components/ui/use-toast";

// Helper functions for common toast types
export const toast = {
  success: (title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: "default",
    });
  },

  error: (title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: "destructive",
    });
  },

  info: (title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: "default",
    });
  },

  warning: (title: string, description?: string) => {
    return showToast({
      title,
      description,
      variant: "destructive",
    });
  },

  // For custom toast configurations
  custom: (options: any) => {
    return showToast(options);
  },
};
