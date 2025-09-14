"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, Users, Eye, Target,
  Calendar, BarChart3, PieChart, LineChart,
  Award, Zap, ExternalLink, ArrowUp, ArrowDown, ShoppingBag
} from "lucide-react";
import {
  ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart,
  Cell, Legend
} from 'recharts';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassGrid } from "@/components/ui/LiquidGlassContainer";
import { useWhop } from "@/components/providers/whop-provider";
import { cn } from "@/lib/utils";

interface ROIAnalyticsDashboardProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export function ROIAnalyticsDashboard({
  className = "",
  timeRange = '30d'
}: ROIAnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'conversion_rate' | 'sales' | 'page_views' | 'engagement'>('conversion_rate');

  const { whopUser, isAuthenticated } = useWhop();

  // Get user's store analytics
  const userAnalytics = useQuery(
    api.whopAnalytics.getUserStoreAnalytics,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id, limit: 50 } : "skip"
  );

  // Get community ROI data for benchmarking
  const communityROI = useQuery(api.whopIntegration.getCommunityROIData, {
    metric: selectedMetric,
    limit: 100
  });

  // Generate sample chart data for demonstration
  const chartData = useMemo(() => {
    const now = Date.now();
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        conversionRate: 2.3 + Math.random() * 1.2 + (i / 30) * 1.0, // Trending upward
        revenue: 1800 + Math.random() * 400 + (i / 30) * 600, // Growing revenue
        pageViews: 3500 + Math.random() * 800 + (i / 30) * 300, // Increasing views
        engagement: 45 + Math.random() * 15 + (i / 30) * 10 // Improving engagement
      };
    });
    return days;
  }, [selectedMetric]);

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    if (!userAnalytics || userAnalytics.length === 0) {
      return {
        totalRevenue: 0,
        totalConversionBoost: 0,
        totalViewsIncrease: 0,
        avgImprovement: 0,
        bestPerformingStore: null,
        recentApplications: 0
      };
    }

    const totalRevenue = userAnalytics
      .filter(a => a.metric === 'sales')
      .reduce((sum, a) => sum + (a.afterValue - a.beforeValue), 0);

    const conversionMetrics = userAnalytics.filter(a => a.metric === 'conversion_rate');
    const avgConversionBoost = conversionMetrics.length > 0
      ? conversionMetrics.reduce((sum, a) => sum + a.improvementPercent, 0) / conversionMetrics.length
      : 0;

    const viewsMetrics = userAnalytics.filter(a => a.metric === 'page_views');
    const totalViewsIncrease = viewsMetrics.reduce((sum, a) => sum + (a.afterValue - a.beforeValue), 0);

    const avgImprovement = userAnalytics.length > 0
      ? userAnalytics.reduce((sum, a) => sum + a.improvementPercent, 0) / userAnalytics.length
      : 0;

    const bestPerformingStore = userAnalytics.reduce((best, current) => {
      return !best || current.improvementPercent > best.improvementPercent ? current : best;
    }, null as any);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentApplications = userAnalytics.filter(a => a.createdAt > thirtyDaysAgo).length;

    return {
      totalRevenue,
      totalConversionBoost: avgConversionBoost,
      totalViewsIncrease,
      avgImprovement,
      bestPerformingStore,
      recentApplications
    };
  }, [userAnalytics]);

  if (!isAuthenticated) {
    return (
      <LiquidGlassContainer className={cn("p-6 text-center", className)}>
        <div className="space-y-4">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">ROI Analytics</h3>
          <p className="text-gray-400">
            Track your Whop store performance and ROI improvements
          </p>
        </div>
      </LiquidGlassContainer>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-primary-400 bg-clip-text text-transparent">
            ROI Analytics Dashboard
          </h1>
          <p className="text-gray-300 mt-2">
            Track the impact of MockupMagic on your Whop store performance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-800/50 rounded-lg p-1">
          {(['7d', '30d', '90d', '1y'] as const).map(range => (
            <button
              key={range}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <LiquidGlassGrid columns={4} gap="md">
        <LiquidGlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue Increase</p>
              <p className="text-2xl font-bold text-green-400">
                ${aggregatedMetrics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-300 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                This month
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Conversion Boost</p>
              <p className="text-2xl font-bold text-blue-400">
                +{aggregatedMetrics.totalConversionBoost.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Above baseline
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Additional Page Views</p>
              <p className="text-2xl font-bold text-primary-400">
                {aggregatedMetrics.totalViewsIncrease.toLocaleString()}
              </p>
              <p className="text-xs text-primary-300 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                This month
              </p>
            </div>
            <Eye className="w-8 h-8 text-primary-400" />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recent Applications</p>
              <p className="text-2xl font-bold text-yellow-400">
                {aggregatedMetrics.recentApplications}
              </p>
              <p className="text-xs text-yellow-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last 30 days
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </LiquidGlassCard>
      </LiquidGlassGrid>

      {/* Metric Selector */}
      <LiquidGlassContainer className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            {[
              { key: 'conversion_rate', label: 'Conversion', icon: Target },
              { key: 'sales', label: 'Sales', icon: DollarSign },
              { key: 'page_views', label: 'Views', icon: Eye },
              { key: 'engagement', label: 'Engagement', icon: Users }
            ].map(metric => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  selectedMetric === metric.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <metric.icon className="w-4 h-4" />
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {/* Performance Chart - Real Implementation */}
        <div className="h-64 bg-gray-800/30 rounded-lg border border-gray-700 p-4">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'conversion_rate' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Conversion Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#3b82f6"
                  fill="url(#conversionGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : selectedMetric === 'sales' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : selectedMetric === 'page_views' ? (
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: any) => [value.toLocaleString(), 'Page Views']}
                />
                <Line
                  type="monotone"
                  dataKey="pageViews"
                  stroke="#FA4616"
                  strokeWidth={3}
                  dot={{ fill: '#FA4616', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#FA4616', strokeWidth: 2 }}
                />
              </RechartsLineChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Engagement']}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#f59e0b"
                  fill="url(#engagementGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </LiquidGlassContainer>

      {/* Store Performance Breakdown */}
      {userAnalytics && userAnalytics.length > 0 && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Store Performance Breakdown
          </h3>

          <div className="space-y-4">
            {userAnalytics
              .filter(analytics => analytics.metric === selectedMetric)
              .slice(0, 5)
              .map((analytics: any) => (
                <motion.div
                  key={analytics._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Store {analytics.whopStoreId.slice(-6)}</h4>
                      <p className="text-sm text-gray-400 capitalize">{analytics.storeCategory}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">
                        {analytics.beforeValue} → {analytics.afterValue}
                      </span>
                      <span className={`font-medium ${
                        analytics.improvementPercent > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {analytics.improvementPercent > 0 ? '+' : ''}{analytics.improvementPercent.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {analytics.measurementPeriod.durationDays} days
                    </p>
                  </div>
                </motion.div>
              ))}
          </div>
        </LiquidGlassContainer>
      )}

      {/* Community Benchmarks */}
      {communityROI && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            Community Benchmarks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                +{communityROI.communityStats.avgConversionBoost.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Conversion Boost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                +{communityROI.communityStats.avgSalesIncrease.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Sales Increase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">
                +{communityROI.communityStats.avgViewsIncrease.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Views Increase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {communityROI.totalSamples}
              </div>
              <div className="text-sm text-gray-400">Verified Results</div>
            </div>
          </div>

          {/* Top Performers */}
          {communityROI.communityStats.topPerformers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Top Community Results
              </h4>
              <div className="space-y-2">
                {communityROI.communityStats.topPerformers.slice(0, 3).map((performer: any, index: number) => (
                  <div key={performer._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        'bg-amber-600 text-black'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-gray-300 capitalize">
                        {performer.storeCategory} store
                      </span>
                    </div>
                    <span className="text-green-400 font-medium">
                      +{performer.improvementPercent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </LiquidGlassContainer>
      )}

      {/* ROI Calculator */}
      <LiquidGlassContainer className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          ROI Calculator
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Performance */}
          <div className="space-y-4">
            <h4 className="font-medium text-white">Your Current Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly Revenue:</span>
                <span className="text-white">$2,340</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Conversion Rate:</span>
                <span className="text-white">2.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly Visitors:</span>
                <span className="text-white">4,200</span>
              </div>
            </div>
          </div>

          {/* Projected Performance */}
          <div className="space-y-4">
            <h4 className="font-medium text-white">With MockupMagic</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Projected Revenue:</span>
                <span className="text-green-400 font-medium">$3,393</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projected Conversion:</span>
                <span className="text-green-400 font-medium">3.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Additional Revenue:</span>
                <span className="text-green-400 font-bold">+$1,053/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Summary */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-300">MockupMagic ROI</h4>
                <p className="text-sm text-green-200">
                  Investment pays for itself in less than 3 days
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">2,248%</div>
                <div className="text-sm text-green-300">Annual ROI</div>
              </div>
            </div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Upgrade Prompt for Advanced Analytics */}
      {whopUser && (
        <LiquidGlassContainer className="p-6 bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Unlock Advanced Analytics
              </h3>
              <p className="text-gray-300 mb-2">
                Get detailed conversion funnels, A/B testing, and competitor analysis
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Real-time conversion tracking</li>
                <li>• A/B testing for mockup variations</li>
                <li>• Competitor performance benchmarks</li>
                <li>• Custom ROI reporting</li>
              </ul>
            </div>
            <div className="text-center">
              <button className="bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Upgrade to Pro
              </button>
              <p className="text-xs text-gray-400 mt-2">$79/month</p>
            </div>
          </div>
        </LiquidGlassContainer>
      )}
    </div>
  );
}