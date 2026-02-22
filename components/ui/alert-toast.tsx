"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

type AlertType = "success" | "error" | "warning" | "info" | "confirm";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    message: "",
    type: "info",
  });
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const showAlert = (options: AlertOptions): Promise<boolean> => {
    setAlertOptions(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    alertOptions.onConfirm?.();
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    alertOptions.onCancel?.();
    setIsOpen(false);
    resolvePromise?.(false);
  };

  const getIcon = () => {
    switch (alertOptions.type) {
      case "success":
        return <CheckCircleIcon className="size-6 text-emerald-500" />;
      case "error":
        return <XCircleIcon className="size-6 text-rose-500" />;
      case "warning":
        return <WarningIcon className="size-6 text-amber-500" />;
      case "confirm":
        return <WarningIcon className="size-6 text-blue-500" />;
      default:
        return <InfoIcon className="size-6 text-blue-500" />;
    }
  };

  const getTitle = () => {
    if (alertOptions.title) return alertOptions.title;
    
    switch (alertOptions.type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "confirm":
        return "Confirm Action";
      default:
        return "Information";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {getIcon()}
              <DialogTitle>{getTitle()}</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {alertOptions.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            {alertOptions.type === "confirm" ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {alertOptions.cancelText || "Cancel"}
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  {alertOptions.confirmText || "Confirm"}
                </Button>
              </>
            ) : (
              <Button onClick={handleConfirm} className="w-full">
                {alertOptions.confirmText || "OK"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}

// Helper functions for common use cases
export function useAlertHelpers() {
  const { showAlert } = useAlert();

  return {
    success: (message: string, title?: string) =>
      showAlert({ message, title, type: "success" }),
    
    error: (message: string, title?: string) =>
      showAlert({ message, title, type: "error" }),
    
    warning: (message: string, title?: string) =>
      showAlert({ message, title, type: "warning" }),
    
    info: (message: string, title?: string) =>
      showAlert({ message, title, type: "info" }),
    
    confirm: (message: string, title?: string, confirmText?: string, cancelText?: string) =>
      showAlert({ 
        message, 
        title, 
        type: "confirm",
        confirmText,
        cancelText,
      }),
  };
}
