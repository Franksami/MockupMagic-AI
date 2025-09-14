"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlayCircle, Clock, Users, Star, Award, BookOpen,
  TrendingUp, DollarSign, Zap, CheckCircle, Lock
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassGrid } from "@/components/ui/LiquidGlassContainer";
import { useWhop, useUserCredits } from "@/components/providers/whop-provider";
import { cn } from "@/lib/utils";

interface WhopCreatorCoursesProps {
  className?: string;
}

interface CourseCardProps {
  course: any; // Will be properly typed with Convex schema
  enrollment?: any;
  onEnroll: (courseId: string) => void;
  userTier: string;
}

export function WhopCreatorCourses({ className = "" }: WhopCreatorCoursesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'pro' | 'premium'>('all');

  const { whopUser, isAuthenticated } = useWhop();
  const { tier } = useUserCredits();

  // Get available courses
  const courses = useQuery(api.education.getAvailableCourses, {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    accessLevel: filterType === 'all' ? undefined : filterType,
    limit: 20
  });

  // Get user's enrollments
  const enrollments = useQuery(
    api.education.getUserEnrollments,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id } : "skip"
  );

  // Enroll in course mutation
  const enrollInCourse = useMutation(api.education.enrollInCourse);

  const courseCategories = [
    { key: 'all', label: 'All Courses' },
    { key: 'store-optimization', label: 'Store Optimization' },
    { key: 'mockup-design', label: 'Mockup Design' },
    { key: 'conversion-psychology', label: 'Conversion Psychology' },
    { key: 'whop-mastery', label: 'Whop Platform Mastery' }
  ];

  const handleEnrollment = async (courseId: string) => {
    if (!whopUser) return;

    try {
      await enrollInCourse({
        whopUserId: whopUser.id,
        courseId: courseId as any, // Type conversion for Convex ID
      });
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <LiquidGlassContainer className={cn("p-6 text-center", className)}>
        <div className="space-y-4">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Whop Creator Education</h3>
          <p className="text-gray-400">
            Master mockup design and store optimization with expert courses
          </p>
        </div>
      </LiquidGlassContainer>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-primary-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Whop Creator Masterclasses
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Learn from top-performing Whop creators. Master mockup design and store optimization
          strategies that drive real conversions.
        </p>
      </div>

      {/* Success Stats */}
      <LiquidGlassContainer className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">500+</div>
            <div className="text-sm text-gray-400">Creators Trained</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">+67%</div>
            <div className="text-sm text-gray-400">Avg Revenue Increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-400">$2.1M+</div>
            <div className="text-sm text-gray-400">Additional Creator Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">4.9/5</div>
            <div className="text-sm text-gray-400">Course Rating</div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Filters */}
      <LiquidGlassContainer className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Category Filter */}
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            {courseCategories.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  selectedCategory === category.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Access Level Filter */}
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            {[
              { key: 'all', label: 'All Courses' },
              { key: 'free', label: 'Free' },
              { key: 'pro', label: 'Pro Only' },
              { key: 'premium', label: 'Premium' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  filterType === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Course Grid */}
      <LiquidGlassGrid columns={3} gap="lg">
        {courses?.map((course: any) => {
          const enrollment = enrollments?.find((e: any) => e.courseId === course._id);
          return (
            <CourseCard
              key={course._id}
              course={course}
              enrollment={enrollment}
              onEnroll={handleEnrollment}
              userTier={tier}
            />
          );
        })}

        {/* Loading State */}
        {!courses && Array.from({ length: 6 }).map((_, i) => (
          <LiquidGlassCard key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="aspect-video bg-gray-700 rounded-lg"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          </LiquidGlassCard>
        ))}
      </LiquidGlassGrid>

      {/* Featured Course Spotlight */}
      <LiquidGlassContainer className="p-6 bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Featured Course</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Complete Whop Store Optimization Masterclass
            </h3>
            <p className="text-gray-300 mb-4">
              Learn the exact strategies used by 7-figure Whop creators to optimize their stores.
              Includes templates, case studies, and 1-on-1 feedback sessions.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                8 hours
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                247 enrolled
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                4.9 (89 reviews)
              </span>
            </div>
          </div>
          <div className="text-center ml-6">
            <div className="text-2xl font-bold text-white mb-1">$99</div>
            <div className="text-sm text-gray-400 mb-4">One-time payment</div>
            <button className="bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Enroll Now
            </button>
          </div>
        </div>
      </LiquidGlassContainer>
    </div>
  );
}

function CourseCard({ course, enrollment, onEnroll, userTier }: CourseCardProps) {
  const canAccess =
    course.accessLevel === 'free' ||
    (course.accessLevel === 'pro' && ['pro', 'growth'].includes(userTier)) ||
    (course.accessLevel === 'premium' && userTier === 'pro');

  const isEnrolled = !!enrollment;
  const progress = enrollment?.progress || 0;

  const getAccessBadge = () => {
    switch (course.accessLevel) {
      case 'free':
        return { text: 'Free', color: 'bg-green-500/20 text-green-300' };
      case 'pro':
        return { text: 'Pro Only', color: 'bg-primary-500/20 text-primary-300' };
      case 'premium':
        return { text: 'Premium', color: 'bg-pink-500/20 text-pink-300' };
      default:
        return { text: 'Available', color: 'bg-gray-500/20 text-gray-300' };
    }
  };

  const badge = getAccessBadge();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <LiquidGlassCard className="p-6 h-full">
        <div className="space-y-4">
          {/* Course Preview */}
          <div className="relative aspect-video bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle className="w-12 h-12 text-primary-400" />
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                {badge.text}
              </span>
            </div>

            {/* Difficulty */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                {course.difficulty}
              </span>
            </div>

            {/* Progress Overlay for Enrolled */}
            {isEnrolled && progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-white mt-1">{progress}% complete</div>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div>
            <h3 className="font-semibold text-white mb-2 line-clamp-2">{course.title}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-3">{course.description}</p>

            {/* Course Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(course.estimatedDuration / 60)}h {course.estimatedDuration % 60}m
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.enrollmentCount}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {course.avgRating.toFixed(1)} ({course.reviewCount})
              </span>
            </div>

            {/* Course Modules Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Course Modules:</h4>
              <div className="space-y-1">
                {course.modules.slice(0, 3).map((module: any, index: number) => (
                  <div key={module.id} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1">{module.title}</span>
                  </div>
                ))}
                {course.modules.length > 3 && (
                  <div className="text-xs text-gray-500 pl-6">
                    +{course.modules.length - 3} more modules
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between mb-4">
              <div>
                {course.price > 0 ? (
                  <div className="text-lg font-bold text-green-400">
                    ${course.price}
                  </div>
                ) : (
                  <div className="text-lg font-bold text-green-400">Free</div>
                )}
                <div className="text-xs text-gray-400">
                  {course.accessLevel === 'pro' ? 'Included with Pro' : 'One-time payment'}
                </div>
              </div>

              {/* Instructor */}
              <div className="text-right">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {course.instructor?.name || 'Instructor'}
                </div>
              </div>
            </div>

            {/* Action Button */}
            {isEnrolled ? (
              <div className="space-y-2">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Continue Learning
                </button>
                {progress === 100 && (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Course Completed
                  </div>
                )}
              </div>
            ) : canAccess ? (
              <button
                onClick={() => onEnroll(course._id)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {course.price > 0 ? `Enroll for $${course.price}` : 'Enroll Free'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full bg-gray-600 text-gray-400 py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {course.accessLevel === 'pro' ? 'Upgrade to Pro' : 'Premium Required'}
                </button>
                <div className="text-xs text-gray-500 text-center">
                  {course.accessLevel === 'pro'
                    ? 'Included with Growth or Pro subscription'
                    : 'Available with Pro subscription'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}