'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidGlassContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'shallow' | 'medium' | 'deep';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  interactive?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  noise?: boolean;
  refraction?: boolean;
  morph?: boolean;
  floatAnimation?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({
  children,
  className,
  variant = 'medium',
  color = 'default',
  interactive = false,
  shimmer = false,
  glow = false,
  noise = true,
  refraction = false,
  morph = false,
  floatAnimation = true,
  as: Component = 'div',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: '50%', y: '50%' });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !interactive) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setMousePosition({ x: `${x}%`, y: `${y}%` });
    };

    const container = containerRef.current;
    if (container && interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive]);

  const glassClasses = cn(
    'liquid-glass-2025',
    'liquid-glass',
    {
      'liquid-glass-shallow': variant === 'shallow',
      'liquid-glass-medium': variant === 'medium',
      'liquid-glass-deep': variant === 'deep',
      'liquid-glass-primary': color === 'primary',
      'liquid-glass-success': color === 'success',
      'liquid-glass-warning': color === 'warning',
      'liquid-glass-danger': color === 'danger',
      'liquid-glass-interactive': interactive,
      'liquid-glass-shimmer': shimmer,
      'liquid-glass-glow': glow,
      'liquid-glass-noise': noise,
      'liquid-glass-refraction': refraction,
      'liquid-morph': morph,
    },
    className
  );

  const style = {
    '--mouse-x': mousePosition.x,
    '--mouse-y': mousePosition.y,
  } as React.CSSProperties;

  const animationVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={glassClasses}
      style={style}
      variants={floatAnimation ? animationVariants : undefined}
      initial={floatAnimation ? "initial" : undefined}
      animate={floatAnimation ? "animate" : undefined}
      exit={floatAnimation ? "exit" : undefined}
      whileHover={
        interactive
          ? {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      whileTap={
        interactive
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
};

// Specialized Liquid Glass Components

export const LiquidGlassCard: React.FC<LiquidGlassContainerProps> = (props) => {
  return (
    <LiquidGlassContainer
      {...props}
      className={cn('liquid-card', props.className)}
      noise={true}
      shimmer={true}
    />
  );
};

export const LiquidGlassButton: React.FC<
  LiquidGlassContainerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, onClick, ...props }) => {
  return (
    <motion.button
      className={cn('liquid-button', className)}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const LiquidGlassModal: React.FC<
  LiquidGlassContainerProps & { isOpen: boolean; onClose: () => void }
> = ({ children, isOpen, onClose, className, ...props }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LiquidGlassContainer
              {...props}
              className={cn('liquid-modal', className)}
              variant="deep"
              refraction={true}
            >
              {children}
            </LiquidGlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Performance-optimized Liquid Glass with React.memo
export const LiquidGlassOptimized = React.memo(LiquidGlassContainer);

// Liquid Glass Grid System
export const LiquidGlassGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, columns = 3, gap = 'md', className }) => {
  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapSizes[gap],
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};