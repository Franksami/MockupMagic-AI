"use client";

import { useWhop } from '@/components/providers/whop-provider';
import { useUserCredits, useUserPermissions } from '@/components/providers/whop-provider';
import { motion } from "framer-motion";
import { LiquidGlassCard, LiquidGlassButton } from "@/components/ui/LiquidGlassContainer";
import { 
  Wand2, 
  Users, 
  Zap, 
  Download, 
  Clock, 
  Star,
  BarChart3,
  Activity,
  Target,
  Settings,
  History
} from "lucide-react";

export default function DashboardPage() {
  const { whopUser, convexUser, isLoading, isAuthenticated, error, login, logout } = useWhop();
  const { credits, tier } = useUserCredits();
  const permissions = useUserPermissions();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 glass-button text-orange-300">
            <motion.div 
              className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="font-medium">Loading Dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-card p-8 max-w-md">
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to MockupMagic</h1>
            <p className="text-gray-300 mb-6">Please sign in to access your dashboard</p>
            <LiquidGlassButton
              onClick={login}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Sign In with Whop
            </LiquidGlassButton>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-card p-8 max-w-md">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Authentication Error</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <LiquidGlassButton
              onClick={login}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
            >
              Try Again
            </LiquidGlassButton>
          </div>
        </motion.div>
      </div>
    );
  }

  const stats = [
    {
      title: "Credits Remaining",
      value: credits.toLocaleString(),
      change: "Active",
      icon: Zap,
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400"
    },
    {
      title: "Subscription Tier",
      value: tier.charAt(0).toUpperCase() + tier.slice(1),
      change: "Current",
      icon: Star,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400"
    },
    {
      title: "Max Concurrent Jobs",
      value: permissions.maxConcurrentJobs.toString(),
      change: "Limit",
      icon: Activity,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400"
    },
    {
      title: "Max File Size",
      value: `${permissions.maxFileSize}MB`,
      change: "Limit",
      icon: Download,
      color: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400"
    }
  ];

  const recentActivity = [
    { id: 1, action: "Generated mockup", time: "2 minutes ago", status: "completed" },
    { id: 2, action: "Downloaded design", time: "1 hour ago", status: "completed" },
    { id: 3, action: "Started generation", time: "3 hours ago", status: "processing" },
    { id: 4, action: "Uploaded image", time: "5 hours ago", status: "completed" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-orange-500/5" />
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(255, 140, 0, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(250, 70, 22, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Welcome back, <span className="text-orange-300 font-semibold">{whopUser?.name || whopUser?.email || 'User'}</span>!
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <LiquidGlassButton
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white glass-button"
              >
                Sign Out
              </LiquidGlassButton>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <LiquidGlassCard variant="medium" glow className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <span className="text-sm text-gray-400">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-300 text-sm">{stat.title}</p>
              </LiquidGlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <LiquidGlassCard variant="medium" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-400' : 
                      activity.status === 'processing' ? 'bg-orange-400' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-sm">{activity.time}</p>
                    </div>
                    {activity.status === 'processing' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="w-4 h-4 text-orange-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </LiquidGlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <LiquidGlassCard variant="medium" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="space-y-4">
                <LiquidGlassButton className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold">
                  <Wand2 className="w-5 h-5 mr-2" />
                  Create New Mockup
                </LiquidGlassButton>
                <LiquidGlassButton className="w-full py-3 glass-button text-white">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </LiquidGlassButton>
                <LiquidGlassButton className="w-full py-3 glass-button text-white">
                  <History className="w-5 h-5 mr-2" />
                  View History
                </LiquidGlassButton>
                <LiquidGlassButton className="w-full py-3 glass-button text-white">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </LiquidGlassButton>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8"
        >
          <LiquidGlassCard variant="medium" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">Account Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Name</dt>
                  <dd className="mt-1 text-lg text-white">{whopUser?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Email</dt>
                  <dd className="mt-1 text-lg text-white">{whopUser?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Subscription Tier</dt>
                  <dd className="mt-1 text-lg text-white capitalize">{tier}</dd>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Credits Remaining</dt>
                  <dd className="mt-1 text-lg text-white">{credits.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Max File Size</dt>
                  <dd className="mt-1 text-lg text-white">{permissions.maxFileSize}MB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Max Concurrent Jobs</dt>
                  <dd className="mt-1 text-lg text-white">{permissions.maxConcurrentJobs}</dd>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </div>
  );
}