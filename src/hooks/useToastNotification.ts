import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

// Custom toast notification hook that extends the existing toast functionality
export function useToastNotification() {
  const { toast, dismiss } = useToast();

  // Success toast with green styling
  const showSuccess = useCallback((message: string, title?: string) => {
    return toast({
      title: title || "Success",
      description: message,
      className: "bg-green-50 border-green-200 text-green-800",
      duration: 3000,
    });
  }, [toast]);

  // Error toast with red styling
  const showError = useCallback((message: string, title?: string) => {
    return toast({
      title: title || "Error",
      description: message,
      variant: "destructive",
      duration: 5000,
    });
  }, [toast]);

  // Info toast with blue styling
  const showInfo = useCallback((message: string, title?: string) => {
    return toast({
      title: title || "Information",
      description: message,
      className: "bg-blue-50 border-blue-200 text-blue-800",
      duration: 4000,
    });
  }, [toast]);

  // Warning toast with yellow styling
  const showWarning = useCallback((message: string, title?: string) => {
    return toast({
      title: title || "Warning",
      description: message,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      duration: 4500,
    });
  }, [toast]);

  // Loading toast with spinner
  const showLoading = useCallback((message: string, title?: string) => {
    return toast({
      title: title || "Loading",
      description: message,
      className: "bg-gray-50 border-gray-200",
      duration: Infinity, // Don't auto-dismiss
    });
  }, [toast]);

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  };
}

export default useToastNotification; 