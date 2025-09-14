'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Trophy,
  TrendingUp,
  Star,
  Crown,
  Flame,
  Award,
  Medal,
  Target,
  Zap,
  ChevronUp,
  ChevronDown,
  Calendar,
  DollarSign,
  Users,
  Hash,
  Filter,
  Search,
  Clock,
  Sparkles
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  username: string;
  avatar?: string;
  score: number;
  change?: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  achievements: number;
  streak?: number;
  revenue?: number;
  growth?: number;
  joinDate: Date;
  isCurrentUser?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  icon: React.ElementType;
  deadline?: Date;
  completed: boolean;
}

interface LeaderboardProps {
  currentUserId?: string;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentUserId,
  onUserSelect,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'revenue' | 'achievements' | 'streak' | 'growth'>('revenue');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFollowing, setShowOnlyFollowing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Generate mock leaderboard data
  useEffect(() => {
    const generateMockData = () => {
      const mockUsers: LeaderboardEntry[] = Array.from({ length: 500 }, (_, i) => {
        const rank = i + 1;
        const isTop = rank <= 10;
        const score = Math.max(10000 - (rank * 150) + Math.random() * 500, 0);

        return {
          id: `user-${i}`,
          rank,
          previousRank: rank + Math.floor(Math.random() * 5 - 2),
          username: `Creator${rank}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
          score: Math.floor(score),
          change: Math.floor(Math.random() * 100 - 50),
          tier: isTop ? 'diamond' :
                rank <= 20 ? 'platinum' :
                rank <= 50 ? 'gold' :
                rank <= 100 ? 'silver' : 'bronze',
          achievements: Math.floor(Math.random() * 50 + 10),
          streak: Math.floor(Math.random() * 365),
          revenue: Math.floor(score * 10),
          growth: Math.random() * 200 - 50,
          joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          isCurrentUser: currentUserId ? `user-${i}` === currentUserId : i === 42,
        };
      });

      setLeaderboardData(mockUsers);
      setIsLoading(false);
    };

    const timer = setTimeout(generateMockData, 1000);
    return () => clearTimeout(timer);
  }, [currentUserId, selectedCategory, timeframe]);

  // Generate milestones
  useEffect(() => {
    const mockMilestones: Milestone[] = [
      {
        id: '1',
        title: 'Revenue Champion',
        description: 'Reach $10,000 in monthly revenue',
        target: 10000,
        current: 7500,
        reward: '🏆 Diamond Badge',
        icon: DollarSign,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '2',
        title: 'Consistency King',
        description: 'Maintain a 30-day creation streak',
        target: 30,
        current: 22,
        reward: '🔥 Flame Badge',
        icon: Flame,
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '3',
        title: 'Achievement Hunter',
        description: 'Unlock 25 achievements',
        target: 25,
        current: 25,
        reward: '⭐ Star Creator',
        icon: Star,
        completed: true,
      },
      {
        id: '4',
        title: 'Community Builder',
        description: 'Get 1000 mockup likes',
        target: 1000,
        current: 450,
        reward: '💫 Influence Badge',
        icon: Users,
        completed: false,
      },
    ];

    setMilestones(mockMilestones);
  }, []);

  // Filter and sort leaderboard data
  const filteredData = useMemo(() => {
    let filtered = [...leaderboardData];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply following filter
    if (showOnlyFollowing) {
      // Mock following list
      filtered = filtered.filter(entry => entry.rank <= 20 || entry.isCurrentUser);
    }

    // Sort by selected category
    switch (selectedCategory) {
      case 'revenue':
        filtered.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        break;
      case 'achievements':
        filtered.sort((a, b) => b.achievements - a.achievements);
        break;
      case 'streak':
        filtered.sort((a, b) => (b.streak || 0) - (a.streak || 0));
        break;
      case 'growth':
        filtered.sort((a, b) => (b.growth || 0) - (a.growth || 0));
        break;
    }

    return filtered;
  }, [leaderboardData, searchQuery, showOnlyFollowing, selectedCategory]);

  // Virtual scrolling for leaderboard
  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <Hash className="w-4 h-4 text-gray-500" />;
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-500 text-xs">
          <ChevronUp className="w-3 h-3" />
          <span>{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center text-red-500 text-xs">
          <ChevronDown className="w-3 h-3" />
          <span>{Math.abs(change)}</span>
        </div>
      );
    }
    return <div className="text-gray-500 text-xs">-</div>;
  };

  const formatScore = (score: number, category: string) => {
    switch (category) {
      case 'revenue':
        return `$${(score / 1000).toFixed(1)}K`;
      case 'streak':
        return `${score}d`;
      case 'growth':
        return `${score > 0 ? '+' : ''}${score.toFixed(1)}%`;
      default:
        return score.toLocaleString();
    }
  };

  const categories = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'streak', label: 'Streak', icon: Flame },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
  ];

  const timeframes = [
    { id: 'daily', label: 'Today' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'all-time', label: 'All Time' },
  ];

  return (
    <div className={cn('w-full h-full flex flex-col gap-4', className)}>
      {/* Milestones Section */}
      <LiquidGlassContainer variant="shallow" glow className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Active Milestones
          </h3>
          <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.slice(0, 4).map((milestone) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <LiquidGlassCard
                variant="shallow"
                className={cn(
                  'p-3',
                  milestone.completed && 'border-green-500/30 bg-green-500/5'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    milestone.completed ? 'bg-green-500/20' : 'bg-purple-500/20'
                  )}>
                    <milestone.icon className={cn(
                      'w-4 h-4',
                      milestone.completed ? 'text-green-400' : 'text-purple-400'
                    )} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{milestone.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{milestone.description}</p>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">
                          {milestone.current} / {milestone.target}
                        </span>
                        <span className="text-purple-400">
                          {Math.round((milestone.current / milestone.target) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            milestone.completed
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${(milestone.current / milestone.target) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{milestone.reward}</span>
                      {milestone.deadline && !milestone.completed && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.ceil((milestone.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
                        </span>
                      )}
                      {milestone.completed && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Completed!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          ))}
        </div>
      </LiquidGlassContainer>

      {/* Leaderboard Section */}
      <LiquidGlassContainer variant="medium" glow className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Leaderboard
            </h2>
            <div className="flex items-center gap-2">
              <LiquidGlassButton
                onClick={() => setShowOnlyFollowing(!showOnlyFollowing)}
                className={cn(
                  'px-3 py-1.5 text-sm',
                  showOnlyFollowing && 'bg-purple-500/30'
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Following
              </LiquidGlassButton>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                  selectedCategory === category.id
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={cn(
                    'px-3 py-1 rounded text-xs transition-all',
                    timeframe === tf.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="pl-10 pr-4 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto p-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Trophy className="w-12 h-12 text-purple-400" />
              </motion.div>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const entry = filteredData[virtualItem.index];
                const isTop3 = virtualItem.index < 3;

                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: virtualItem.index * 0.02 }}
                      className="mb-2"
                    >
                      <LiquidGlassCard
                        variant="shallow"
                        className={cn(
                          'p-3 cursor-pointer hover:bg-purple-500/10 transition-all',
                          entry.isCurrentUser && 'border-purple-500/50 bg-purple-500/10',
                          isTop3 && 'border-yellow-500/30'
                        )}
                        onClick={() => onUserSelect?.(entry.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="flex items-center gap-2 min-w-[60px]">
                            {getRankIcon(virtualItem.index + 1)}
                            <span className={cn(
                              'font-bold',
                              isTop3 ? 'text-white text-lg' : 'text-gray-300 text-sm'
                            )}>
                              {virtualItem.index + 1}
                            </span>
                            {getRankChange(virtualItem.index + 1, entry.previousRank)}
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {entry.username[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{entry.username}</span>
                                {entry.isCurrentUser && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-400 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{entry.achievements} achievements</span>
                                {entry.streak && entry.streak > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    {entry.streak}d
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {formatScore(
                                selectedCategory === 'revenue' ? entry.revenue || 0 :
                                selectedCategory === 'achievements' ? entry.achievements :
                                selectedCategory === 'streak' ? entry.streak || 0 :
                                entry.growth || 0,
                                selectedCategory
                              )}
                            </div>
                            {entry.change !== undefined && (
                              <div className={cn(
                                'text-xs',
                                entry.change > 0 ? 'text-green-400' : 'text-red-400'
                              )}>
                                {entry.change > 0 ? '+' : ''}{entry.change}
                              </div>
                            )}
                          </div>

                          {/* Tier Badge */}
                          <div className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            entry.tier === 'diamond' && 'bg-cyan-500/20 text-cyan-400',
                            entry.tier === 'platinum' && 'bg-purple-500/20 text-purple-400',
                            entry.tier === 'gold' && 'bg-yellow-500/20 text-yellow-400',
                            entry.tier === 'silver' && 'bg-gray-500/20 text-gray-300',
                            entry.tier === 'bronze' && 'bg-orange-500/20 text-orange-400'
                          )}>
                            {entry.tier}
                          </div>
                        </div>
                      </LiquidGlassCard>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{filteredData.length} creators</span>
            <span>Updated 2 minutes ago</span>
          </div>
        </div>
      </LiquidGlassContainer>
    </div>
  );
};