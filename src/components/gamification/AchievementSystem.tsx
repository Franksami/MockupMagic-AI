'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Zap,
  Gift,
  Sparkles,
  DollarSign,
  Users,
  Calendar,
  Flame,
  Lock,
  Unlock,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'creation' | 'revenue' | 'social' | 'streak' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  reward?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  value: number;
  currentValue: number;
  icon: React.ElementType;
  reward: string;
  achieved: boolean;
  achievedAt?: Date;
}

interface UserStats {
  totalMockups: number;
  totalRevenue: number;
  totalDownloads: number;
  totalLikes: number;
  currentStreak: number;
  longestStreak: number;
  memberSince: Date;
  level: number;
  experience: number;
  nextLevelExp: number;
}

interface AchievementSystemProps {
  userStats: UserStats;
  achievements?: Achievement[];
  milestones?: Milestone[];
  onClaimReward?: (achievementId: string) => void;
  className?: string;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Creation Achievements
  {
    id: 'first-mockup',
    title: 'First Steps',
    description: 'Create your first mockup',
    icon: Sparkles,
    category: 'creation',
    tier: 'bronze',
    points: 10,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: 'mockup-10',
    title: 'Getting Started',
    description: 'Create 10 mockups',
    icon: Target,
    category: 'creation',
    tier: 'silver',
    points: 50,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: 'mockup-100',
    title: 'Mockup Master',
    description: 'Create 100 mockups',
    icon: Trophy,
    category: 'creation',
    tier: 'gold',
    points: 200,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: 'mockup-1000',
    title: 'Legendary Creator',
    description: 'Create 1,000 mockups',
    icon: Crown,
    category: 'creation',
    tier: 'diamond',
    points: 1000,
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
  },

  // Revenue Achievements
  {
    id: 'first-sale',
    title: 'First Sale',
    description: 'Make your first sale on Whop',
    icon: DollarSign,
    category: 'revenue',
    tier: 'bronze',
    points: 25,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    reward: '5 Bonus Credits',
  },
  {
    id: 'revenue-100',
    title: 'Rising Star',
    description: 'Earn $100 in revenue',
    icon: TrendingUp,
    category: 'revenue',
    tier: 'silver',
    points: 100,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
    reward: '20 Bonus Credits',
  },
  {
    id: 'revenue-1k',
    title: 'Business Builder',
    description: 'Earn $1,000 in revenue',
    icon: Award,
    category: 'revenue',
    tier: 'gold',
    points: 500,
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
    reward: 'Pro Plan Upgrade',
  },
  {
    id: 'revenue-10k',
    title: 'Revenue Champion',
    description: 'Earn $10,000 in revenue',
    icon: Medal,
    category: 'revenue',
    tier: 'platinum',
    points: 2000,
    progress: 0,
    maxProgress: 10000,
    unlocked: false,
    reward: 'Enterprise Features',
  },

  // Social Achievements
  {
    id: 'popular-1',
    title: 'Getting Noticed',
    description: 'Get 100 downloads on your mockups',
    icon: Users,
    category: 'social',
    tier: 'bronze',
    points: 30,
    progress: 0,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: 'popular-2',
    title: 'Community Favorite',
    description: 'Get 1,000 likes on your mockups',
    icon: Star,
    category: 'social',
    tier: 'silver',
    points: 150,
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
  },

  // Streak Achievements
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: '7 day creation streak',
    icon: Flame,
    category: 'streak',
    tier: 'bronze',
    points: 50,
    progress: 0,
    maxProgress: 7,
    unlocked: false,
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: '30 day creation streak',
    icon: Calendar,
    category: 'streak',
    tier: 'gold',
    points: 300,
    progress: 0,
    maxProgress: 30,
    unlocked: false,
  },
];

const REVENUE_MILESTONES: Milestone[] = [
  {
    id: 'milestone-1',
    title: 'Seed',
    description: 'Your journey begins',
    value: 0,
    currentValue: 0,
    icon: Sparkles,
    reward: 'Welcome Badge',
    achieved: true,
    achievedAt: new Date(),
  },
  {
    id: 'milestone-2',
    title: 'Sprout',
    description: 'First $100 in revenue',
    value: 100,
    currentValue: 0,
    icon: TrendingUp,
    reward: '10 Bonus Credits',
    achieved: false,
  },
  {
    id: 'milestone-3',
    title: 'Tree',
    description: 'Reach $1,000 in revenue',
    value: 1000,
    currentValue: 0,
    icon: Award,
    reward: 'Pro Features',
    achieved: false,
  },
  {
    id: 'milestone-4',
    title: 'Champion',
    description: 'Reach $10,000 in revenue',
    value: 10000,
    currentValue: 0,
    icon: Trophy,
    reward: 'Enterprise Access',
    achieved: false,
  },
  {
    id: 'milestone-5',
    title: 'Legend',
    description: 'Reach $100,000 in revenue',
    value: 100000,
    currentValue: 0,
    icon: Crown,
    reward: 'Lifetime Premium',
    achieved: false,
  },
];

const tierColors = {
  bronze: 'from-orange-600 to-orange-400',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-primary-400 to-primary-300',
  diamond: 'from-cyan-400 to-cyan-300',
};

const categoryIcons = {
  creation: Sparkles,
  revenue: DollarSign,
  social: Users,
  streak: Flame,
  special: Gift,
};

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userStats,
  achievements = DEFAULT_ACHIEVEMENTS,
  milestones = REVENUE_MILESTONES,
  onClaimReward,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [celebratingAchievement, setCelebratingAchievement] = useState<string | null>(null);

  // Update achievement progress based on user stats
  const updatedAchievements = achievements.map(achievement => {
    let progress = 0;

    switch (achievement.id) {
      case 'first-mockup':
      case 'mockup-10':
      case 'mockup-100':
      case 'mockup-1000':
        progress = Math.min(userStats.totalMockups, achievement.maxProgress);
        break;
      case 'first-sale':
        progress = userStats.totalRevenue > 0 ? 1 : 0;
        break;
      case 'revenue-100':
      case 'revenue-1k':
      case 'revenue-10k':
        progress = Math.min(userStats.totalRevenue, achievement.maxProgress);
        break;
      case 'popular-1':
        progress = Math.min(userStats.totalDownloads, achievement.maxProgress);
        break;
      case 'popular-2':
        progress = Math.min(userStats.totalLikes, achievement.maxProgress);
        break;
      case 'streak-7':
      case 'streak-30':
        progress = Math.min(userStats.currentStreak, achievement.maxProgress);
        break;
    }

    return {
      ...achievement,
      progress,
      unlocked: progress >= achievement.maxProgress,
    };
  });

  // Update milestone progress
  const updatedMilestones = milestones.map(milestone => ({
    ...milestone,
    currentValue: userStats.totalRevenue,
    achieved: userStats.totalRevenue >= milestone.value,
  }));

  // Filter achievements
  const filteredAchievements = updatedAchievements.filter(achievement => {
    if (selectedCategory && achievement.category !== selectedCategory) return false;
    if (showUnlockedOnly && !achievement.unlocked) return false;
    return true;
  });

  // Calculate total points
  const totalPoints = updatedAchievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  // Calculate level progress
  const levelProgress = (userStats.experience / userStats.nextLevelExp) * 100;

  const handleAchievementClick = (achievement: Achievement) => {
    if (achievement.unlocked && achievement.reward && !celebratingAchievement) {
      setCelebratingAchievement(achievement.id);
      onClaimReward?.(achievement.id);
      setTimeout(() => setCelebratingAchievement(null), 3000);
    }
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* User Stats Overview */}
      <LiquidGlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Your Progress</h2>
            <p className="text-gray-400">Level {userStats.level} Creator</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-400">{totalPoints}</div>
            <p className="text-sm text-gray-400">Total Points</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Level {userStats.level}</span>
            <span>{userStats.experience} / {userStats.nextLevelExp} XP</span>
            <span>Level {userStats.level + 1}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{userStats.totalMockups}</div>
            <p className="text-xs text-gray-400">Mockups Created</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${userStats.totalRevenue}</div>
            <p className="text-xs text-gray-400">Total Revenue</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{userStats.currentStreak}</div>
            <p className="text-xs text-gray-400">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{userStats.totalDownloads}</div>
            <p className="text-xs text-gray-400">Downloads</p>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Revenue Milestones */}
      <LiquidGlassCard variant="medium" className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Creator Milestones</h3>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700" />

          {updatedMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center gap-4 mb-6 last:mb-0"
            >
              {/* Icon */}
              <div className={cn(
                'relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all',
                milestone.achieved
                  ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110'
                  : 'bg-gray-800 border-2 border-gray-700'
              )}>
                {milestone.achieved ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={cn(
                      'font-semibold',
                      milestone.achieved ? 'text-white' : 'text-gray-500'
                    )}>
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-gray-400">{milestone.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-lg font-bold',
                      milestone.achieved ? 'text-green-400' : 'text-gray-500'
                    )}>
                      ${milestone.currentValue} / ${milestone.value}
                    </div>
                    {milestone.reward && (
                      <p className="text-xs text-primary-400">{milestone.reward}</p>
                    )}
                  </div>
                </div>
                {!milestone.achieved && (
                  <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(milestone.currentValue / milestone.value) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </LiquidGlassCard>

      {/* Achievements */}
      <LiquidGlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Achievements</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm transition-colors',
                showUnlockedOnly
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {showUnlockedOnly ? 'Show All' : 'Unlocked Only'}
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg whitespace-nowrap transition-all',
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            All
          </button>
          {Object.keys(categoryIcons).map(category => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all',
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{category}</span>
              </button>
            );
          })}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => handleAchievementClick(achievement)}
                className={cn(
                  'relative cursor-pointer',
                  achievement.unlocked && achievement.reward && 'hover:scale-105 transition-transform'
                )}
              >
                <LiquidGlassContainer
                  variant="shallow"
                  glow={achievement.unlocked}
                  className={cn(
                    'p-4',
                    !achievement.unlocked && 'opacity-60'
                  )}
                >
                  {/* Tier Badge */}
                  <div className={cn(
                    'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center',
                    `bg-gradient-to-br ${tierColors[achievement.tier]}`
                  )}>
                    <Star className="w-4 h-4 text-white" />
                  </div>

                  {/* Icon */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      achievement.unlocked
                        ? `bg-gradient-to-br ${tierColors[achievement.tier]}`
                        : 'bg-gray-800'
                    )}>
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{achievement.title}</h4>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                      <span>{achievement.points} pts</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          'h-full',
                          achievement.unlocked
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : `bg-gradient-to-r ${tierColors[achievement.tier]}`
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  {achievement.reward && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary-400">
                          <Gift className="w-3 h-3 inline mr-1" />
                          {achievement.reward}
                        </span>
                        {achievement.unlocked && (
                          <span className="text-xs text-green-400">Claim</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Celebration Animation */}
                  {celebratingAchievement === achievement.id && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1 }}
                    >
                      <Sparkles className="absolute top-2 left-2 w-6 h-6 text-yellow-400 animate-ping" />
                      <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-400 animate-ping animation-delay-200" />
                      <Sparkles className="absolute bottom-2 left-2 w-6 h-6 text-yellow-400 animate-ping animation-delay-400" />
                      <Sparkles className="absolute bottom-2 right-2 w-6 h-6 text-yellow-400 animate-ping animation-delay-600" />
                    </motion.div>
                  )}
                </LiquidGlassContainer>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LiquidGlassCard>
    </div>
  );
};