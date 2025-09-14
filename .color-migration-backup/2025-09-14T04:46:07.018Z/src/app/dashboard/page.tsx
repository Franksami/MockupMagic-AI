'use client';

import React from 'react';
import { useWhop } from '@/components/providers/whop-provider';
import { motion } from 'framer-motion';
import {
  Wand2,
  TrendingUp,
  Package,
  CreditCard,
  Activity,
  Users,
  Download,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { whopUser, isAuthenticated } = useWhop();

  const stats = [
    {
      label: 'Total Mockups',
      value: '127',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Credits Remaining',
      value: '1,000',
      change: '-23',
      trend: 'down',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Active Projects',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: Activity,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Community Shares',
      value: '34',
      change: '+8',
      trend: 'up',
      icon: Users,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const recentMockups = [
    { id: '1', name: 'E-book Cover', created: '2 hours ago', status: 'completed' },
    { id: '2', name: 'Course Thumbnail', created: '5 hours ago', status: 'completed' },
    { id: '3', name: 'Product Bundle', created: '1 day ago', status: 'processing' },
    { id: '4', name: 'Social Media Post', created: '2 days ago', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border"
      >
        <div className="relative z-10 p-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{whopUser?.name ? `, ${whopUser.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here\'s an overview of your MockupMagic AI activity
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={cn(
                      "text-xs font-medium",
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">from last week</span>
                  </div>
                </div>
                <div className={cn(
                  "rounded-lg p-3 bg-gradient-to-br",
                  stat.color
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Mockups */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border bg-card"
        >
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Mockups</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentMockups.map((mockup) => (
              <div key={mockup.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{mockup.name}</p>
                    <p className="text-xs text-muted-foreground">{mockup.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    mockup.status === 'completed'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  )}>
                    {mockup.status}
                  </span>
                  <button className="p-1 hover:bg-accent rounded">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border bg-card"
        >
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">Generate New Mockup</p>
                <p className="text-xs text-muted-foreground">Start creating with AI</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">Browse Templates</p>
                <p className="text-xs text-muted-foreground">Explore community designs</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">View Analytics</p>
                <p className="text-xs text-muted-foreground">Track your ROI</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Weekly Activity</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Chart visualization coming soon...</p>
        </div>
      </motion.div>
    </div>
  );
}