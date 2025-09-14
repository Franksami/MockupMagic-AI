"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "sparkles" | "pulse";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "spinner",
  text,
  className = ""
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (variant === "sparkles") {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className={`${sizeClasses[size]} text-primary-400`} />
        </motion.div>
        {text && (
          <p className={`text-gray-300 ${textSizeClasses[size]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`${sizeClasses[size]} bg-gradient-to-r from-primary-500 to-pink-500 rounded-full`}
        />
        {text && (
          <p className={`text-gray-300 ${textSizeClasses[size]} font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary-400`} />
      </motion.div>
      {text && (
        <p className={`text-gray-300 ${textSizeClasses[size]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangle" | "circle";
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "rectangle",
  lines = 1
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <motion.div
            key={i}
            className={`h-4 bg-gray-700 rounded animate-pulse ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: "h-4 w-full",
    rectangle: "h-32 w-full",
    circle: "h-12 w-12 rounded-full"
  };

  return (
    <motion.div
      className={`bg-gray-700 ${variantClasses[variant]} ${className}`}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}