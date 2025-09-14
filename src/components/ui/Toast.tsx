'use client';

/**
 * Toast Notification System
 * Provides user-friendly notifications for errors, warnings, and success messages
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { LiquidGlassContainer } from './LiquidGlassContainer';
import { type ErrorDetails } from '@/lib/error-classification';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  retryable?: boolean;
  onRetry?: () => void;
  errorDetails?: ErrorDetails;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  addErrorToast: (error: ErrorDetails, onRetry?: () => void) => string;
  addSuccessToast: (title: string, message?: string) => string;
  addWarningToast: (title: string, message?: string) => string;
  addInfoToast: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newToast: Toast = {
      id,
      duration: toast.duration ?? (toast.type === 'error' ? 8000 : 5000),
      ...toast,
    };

    setToasts(current => {
      const updated = [newToast, ...current];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addErrorToast = useCallback((errorDetails: ErrorDetails, onRetry?: () => void): string => {
    return addToast({
      type: 'error',
      title: getErrorTitle(errorDetails),
      message: errorDetails.userMessage,
      retryable: errorDetails.retryable && !!onRetry,
      onRetry,
      errorDetails,
      duration: errorDetails.retryable ? 10000 : 8000, // Longer duration for retryable errors
    });
  }, [addToast]);

  const addSuccessToast = useCallback((title: string, message?: string): string => {
    return addToast({
      type: 'success',
      title,
      message: message || '',
      duration: 4000,
    });
  }, [addToast]);

  const addWarningToast = useCallback((title: string, message?: string): string => {
    return addToast({
      type: 'warning',
      title,
      message: message || '',
      duration: 6000,
    });
  }, [addToast]);

  const addInfoToast = useCallback((title: string, message?: string): string => {
    return addToast({
      type: 'info',
      title,
      message: message || '',
      duration: 5000,
    });
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    addErrorToast,
    addSuccessToast,
    addWarningToast,
    addInfoToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/10';
      case 'error':
        return 'border-red-500/20 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/10';
      case 'info':
      default:
        return 'border-blue-500/20 bg-blue-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      layout
    >
      <LiquidGlassContainer
        variant="shallow"
        className={`p-4 ${getColorClasses()} border`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white mb-1">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="text-sm text-gray-300">
                {toast.message}
              </p>
            )}

            {toast.retryable && toast.onRetry && (
              <button
                onClick={toast.onRetry}
                className="mt-2 inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Try Again
              </button>
            )}

            {process.env.NODE_ENV === 'development' && toast.errorDetails && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Debug Info
                </summary>
                <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                  {JSON.stringify({
                    category: toast.errorDetails.category,
                    severity: toast.errorDetails.severity,
                    requestId: toast.errorDetails.requestId,
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </LiquidGlassContainer>
    </motion.div>
  );
}

function getErrorTitle(errorDetails: ErrorDetails): string {
  switch (errorDetails.category) {
    case 'authentication':
      return 'Authentication Required';
    case 'authorization':
      return 'Access Denied';
    case 'network':
      return 'Connection Issue';
    case 'timeout':
      return 'Request Timed Out';
    case 'external_service':
      return 'Service Unavailable';
    case 'database':
      return 'Data Error';
    case 'configuration':
      return 'Configuration Issue';
    case 'rate_limit':
      return 'Rate Limited';
    case 'validation':
      return 'Invalid Input';
    default:
      return 'Error Occurred';
  }
}

/**
 * Hook for easy error toast creation
 */
export function useErrorToast() {
  const { addErrorToast } = useToast();

  const showError = useCallback((error: unknown, onRetry?: () => void) => {
    const errorDetails = classifyError(error, 'user_action');
    return addErrorToast(errorDetails, onRetry);
  }, [addErrorToast]);

  return showError;
}