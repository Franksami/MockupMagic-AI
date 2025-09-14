"use client";

import React, { createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface FrostedUIContextType {
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
  showLoadingOverlay: (show: boolean, message?: string) => void;
}

const FrostedUIContext = createContext<FrostedUIContextType | undefined>(undefined);

interface FrostedUIProviderProps {
  children: React.ReactNode;
}

export function FrostedUIProvider({ children }: FrostedUIProviderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
    timestamp: number;
  }>>([]);

  const [loadingOverlay, setLoadingOverlay] = React.useState<{
    show: boolean;
    message?: string;
  }>({ show: false });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = React.useCallback((
    message: string, 
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification = { id, message, type, timestamp: Date.now() };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showLoadingOverlay = React.useCallback((show: boolean, message?: string) => {
    setLoadingOverlay({ show, message });
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const contextValue: FrostedUIContextType = {
    showNotification,
    showLoadingOverlay,
  };

  return (
    <FrostedUIContext.Provider value={contextValue}>
      {children}

      {/* Only render UI overlays when mounted to prevent hydration issues */}
      {mounted && (
        <>
          {/* Notifications */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            <AnimatePresence>
              {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={clsx(
                "max-w-sm p-4 rounded-lg shadow-lg backdrop-blur-md border cursor-pointer",
                "transition-all duration-200 hover:shadow-xl",
                {
                  "bg-green-500/20 border-green-500/50 text-green-100": notification.type === "success",
                  "bg-red-500/20 border-red-500/50 text-red-100": notification.type === "error",
                  "bg-blue-500/20 border-blue-500/50 text-blue-100": notification.type === "info",
                }
              )}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="flex items-center space-x-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  {
                    "bg-green-400": notification.type === "success",
                    "bg-red-400": notification.type === "error",
                    "bg-blue-400": notification.type === "info",
                  }
                )} />
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {loadingOverlay.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20"
                >
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <div className="text-white">
                      <p className="font-medium">Loading...</p>
                      {loadingOverlay.message && (
                        <p className="text-sm text-white/80">{loadingOverlay.message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </FrostedUIContext.Provider>
  );
}

export function useFrostedUI() {
  const context = useContext(FrostedUIContext);
  if (context === undefined) {
    throw new Error("useFrostedUI must be used within a FrostedUIProvider");
  }
  return context;
}

// Utility components for common frosted glass effects

interface FrostedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function FrostedCard({ 
  children, 
  className = "", 
  onClick,
  hover = true 
}: FrostedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={clsx(
        "bg-white/10 backdrop-blur-md rounded-lg border border-white/20",
        "shadow-lg transition-all duration-200",
        hover && "hover:shadow-xl hover:bg-white/15",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface FrostedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function FrostedButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
}: FrostedButtonProps) {
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      disabled={disabled || loading}
      onClick={handleClick}
      type="button"
      style={{ pointerEvents: disabled || loading ? 'none' : 'auto' }}
      className={clsx(
        "relative backdrop-blur-md rounded-lg border font-medium transition-all duration-200",
        "flex items-center justify-center space-x-2 outline-none focus:ring-2 focus:ring-blue-500/50",
        {
          // Variants
          "bg-blue-500/20 border-blue-500/50 text-blue-100 hover:bg-blue-500/30 active:bg-blue-500/40": variant === "primary",
          "bg-gray-500/20 border-gray-500/50 text-gray-100 hover:bg-gray-500/30 active:bg-gray-500/40": variant === "secondary",
          "bg-transparent border-transparent text-gray-300 hover:bg-white/10 active:bg-white/20": variant === "ghost",

          // Sizes
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-base": size === "md",
          "px-6 py-3 text-lg": size === "lg",

          // States
          "opacity-50 cursor-not-allowed": disabled || loading,
          "cursor-pointer hover:shadow-lg": !disabled && !loading,
        },
        className
      )}
    >
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </motion.button>
  );
}

interface FrostedInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export function FrostedInput({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  disabled = false,
}: FrostedInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={clsx(
        "w-full px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20",
        "text-white placeholder-white/50 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}