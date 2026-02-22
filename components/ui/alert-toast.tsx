"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
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
  SpinnerGap,
} from "@phosphor-icons/react";
import { toast } from "sonner";

type AlertType = "success" | "error" | "warning" | "info" | "confirm";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  action?: () => Promise<void>;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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

  const handleConfirm = async () => {
    if (alertOptions.action) {
      setIsConfirming(true);
      try {
        await alertOptions.action();
        setIsOpen(false);
        resolvePromise?.(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsConfirming(false);
      }
    } else {
      alertOptions.onConfirm?.();
      setIsOpen(false);
      resolvePromise?.(true);
    }
  };

  const handleCancel = () => {
    if (isConfirming) return;
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
                  disabled={isConfirming}
                >
                  {alertOptions.cancelText || "Cancel"}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                  disabled={isConfirming}
                >
                  {isConfirming && (
                    <SpinnerGap className="size-4 animate-spin mr-2" />
                  )}
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
    success: (message: string, title?: string) => {
      // Use Sonner toast instead of custom modal
      toast.success(title || "Success", { description: message });
    },

    error: (message: string, title?: string) => {
      toast.error(title || "Error", { description: message });
    },

    warning: (message: string, title?: string) => {
      toast.warning(title || "Warning", { description: message });
    },

    info: (message: string, title?: string) => {
      toast.info(title || "Info", { description: message });
    },

    // Maintain custom modal for confirms since they require interactive promises
    confirm: (
      message: string,
      title?: string,
      confirmText?: string,
      cancelText?: string,
      action?: () => Promise<void>,
    ) =>
      showAlert({
        message,
        title,
        type: "confirm",
        confirmText,
        cancelText,
        action,
      }),
  };
}
