'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConvexAuth, useQuery as useConvexQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { Activity, Wifi, WifiOff, Zap, Clock, Package } from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const { isAuthenticated } = useConvexAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data for now - will be replaced with real Convex queries
  const credits = 1000;
  const queueSize = 0;
  const version = 'v2.0.0';

  // Update connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between border-t bg-background/95 backdrop-blur px-4 text-xs",
        className
      )}
    >
      {/* Left Section - Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">Disconnected</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isAuthenticated ? 'Authenticated' : 'Guest Mode'}
          </span>
        </div>
      </div>

      {/* Center Section - Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-primary" />
          <span>
            Credits: <span className="font-medium text-primary">{credits.toLocaleString()}</span>
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span>
            Queue: <span className="font-medium">{queueSize}</span>
          </span>
        </div>

        {queueSize > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Processing...</span>
            </div>
          </>
        )}
      </div>

      {/* Right Section - Time and Version */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{formatTime(currentTime)}</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <span className="text-muted-foreground font-mono">{version}</span>
      </div>
    </div>
  );
}