"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award, Star, CheckCircle, Clock, Users,
  Trophy, Target, Zap, Download, Share2,
  BookOpen, TrendingUp, DollarSign
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassGrid } from "@/components/ui/LiquidGlassContainer";
import { useWhop, useUserCredits } from "@/components/providers/whop-provider";
import { cn } from "@/lib/utils";

interface CertificationDashboardProps {
  className?: string;
}

interface CertificationProgram {
  id: string;
  title: string;
  description: string;
  price: number;
  requirements: string[];
  benefits: string[];
  badgeDesign: string;
  estimatedDuration: number; // hours
  passingScore: number; // percentage
  whopCreatorFocus: boolean;
}

const CERTIFICATION_PROGRAMS: CertificationProgram[] = [
  {
    id: 'whop-mockup-specialist',
    title: 'Certified Whop Mockup Specialist',
    description: 'Master the art of creating high-converting mockups specifically for Whop stores',
    price: 199,
    requirements: [
      'Complete Store Optimization Masterclass',
      'Submit 5 approved community templates',
      'Achieve 30%+ conversion improvement in own store',
      'Pass certification exam (85%+ score)'
    ],
    benefits: [
      'Official certification badge for Whop profile',
      'Featured in creator spotlight',
      'Higher revenue share on template sales (95% vs 90%)',
      'Access to exclusive Pro creator mastermind',
      'Direct line to MockupMagic team for collaboration'
    ],
    badgeDesign: 'gradient-gold',
    estimatedDuration: 20,
    passingScore: 85,
    whopCreatorFocus: true
  },
  {
    id: 'conversion-optimizer',
    title: 'Certified Conversion Optimizer',
    description: 'Become an expert in psychology-driven design that converts visitors to customers',
    price: 149,
    requirements: [
      'Complete Conversion Psychology course',
      'Demonstrate 50%+ conversion improvement',
      'Submit case study with verified results',
      'Pass advanced certification exam (90%+ score)'
    ],
    benefits: [
      'Conversion Expert badge',
      'Consulting opportunities ($200/hour rate)',
      'Featured in ROI case studies',
      'Early access to new templates',
      'Affiliate partnership opportunities'
    ],
    badgeDesign: 'gradient-blue',
    estimatedDuration: 15,
    passingScore: 90,
    whopCreatorFocus: true
  }
];

export function CertificationDashboard({ className = "" }: CertificationDashboardProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { whopUser, isAuthenticated } = useWhop();
  const { tier } = useUserCredits();

  // Get user's certification progress
  const certificationProgress = useQuery(
    api.certification.getUserCertificationProgress,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id } : "skip"
  );

  // Get user's creator profile for requirements checking
  const creatorProfile = useQuery(
    api.community.getCreatorProfile,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id } : "skip"
  );

  const enrollInCertification = useMutation(api.certification.enrollInCertification);

  const handleEnroll = async (programId: string) => {
    if (!whopUser) return;

    try {
      await enrollInCertification({
        whopUserId: whopUser.id,
        programId,
      });
    } catch (error) {
      console.error('Certification enrollment failed:', error);
    }
  };

  const checkRequirements = (program: CertificationProgram) => {
    if (!creatorProfile) return { met: 0, total: program.requirements.length };

    let metRequirements = 0;

    // Check course completion
    if (program.requirements.some(req => req.includes('Store Optimization Masterclass'))) {
      // Would check course completion
      metRequirements += 1;
    }

    // Check template submissions
    if (program.requirements.some(req => req.includes('community templates'))) {
      if (creatorProfile.stats?.templatesCount >= 5) {
        metRequirements += 1;
      }
    }

    // Check conversion improvements
    if (program.requirements.some(req => req.includes('conversion improvement'))) {
      // Would check store analytics
      metRequirements += 1;
    }

    return {
      met: metRequirements,
      total: program.requirements.length
    };
  };

  if (!isAuthenticated) {
    return (
      <LiquidGlassContainer className={cn("p-6 text-center", className)}>
        <div className="space-y-4">
          <Award className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Certification Programs</h3>
          <p className="text-gray-400">
            Become a certified Whop creator and unlock exclusive benefits
          </p>
        </div>
      </LiquidGlassContainer>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
          Whop Creator Certification
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Validate your expertise, gain community credibility, and unlock exclusive opportunities
          in the Whop creator ecosystem.
        </p>
      </div>

      {/* Certification Value Proposition */}
      <LiquidGlassContainer className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Industry Recognition</h3>
            <p className="text-sm text-gray-400">
              Official badge displayed on your Whop profile and community presence
            </p>
          </div>
          <div>
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Higher Earnings</h3>
            <p className="text-sm text-gray-400">
              95% revenue share on templates + consulting opportunities at $200/hour
            </p>
          </div>
          <div>
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Exclusive Community</h3>
            <p className="text-sm text-gray-400">
              Access to Pro creator mastermind and direct collaboration opportunities
            </p>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Current Certifications */}
      {certificationProgress && certificationProgress.length > 0 && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Your Certifications
          </h3>
          <div className="space-y-4">
            {certificationProgress.map((cert: any) => (
              <div key={cert._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    cert.status === 'certified' ? 'bg-yellow-500/20' : 'bg-gray-700'
                  }`}>
                    <Award className={`w-6 h-6 ${
                      cert.status === 'certified' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{cert.programTitle}</h4>
                    <p className="text-sm text-gray-400">
                      {cert.status === 'certified' ? 'Certified' :
                       cert.status === 'in_progress' ? `${cert.progress}% complete` :
                       'Not started'}
                    </p>
                  </div>
                </div>

                {cert.status === 'certified' && cert.certificateId && (
                  <div className="flex gap-2">
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="text-primary-400 hover:text-primary-300 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </LiquidGlassContainer>
      )}

      {/* Available Certification Programs */}
      <LiquidGlassGrid columns={2} gap="lg">
        {CERTIFICATION_PROGRAMS.map((program) => {
          const requirements = checkRequirements(program);
          const isEligible = requirements.met >= requirements.total * 0.75; // 75% of requirements
          const isEnrolled = certificationProgress?.some((cert: any) => cert.programId === program.id);

          return (
            <motion.div
              key={program.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <LiquidGlassCard className="p-6 h-full">
                <div className="space-y-4">
                  {/* Program Header */}
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      program.badgeDesign === 'gradient-gold'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-gradient-to-br from-blue-400 to-primary-500'
                    }`}>
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{program.title}</h3>
                    <p className="text-sm text-gray-400">{program.description}</p>
                  </div>

                  {/* Program Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-700">
                    <div className="text-center">
                      <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <div className="text-sm text-white">{program.estimatedDuration}h</div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center">
                      <Target className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <div className="text-sm text-white">{program.passingScore}%</div>
                      <div className="text-xs text-gray-500">Pass Rate</div>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <div className="text-sm text-white">${program.price}</div>
                      <div className="text-xs text-gray-500">Investment</div>
                    </div>
                  </div>

                  {/* Requirements Progress */}
                  <div>
                    <h4 className="font-medium text-white mb-2">Requirements Progress</h4>
                    <div className="space-y-2">
                      {program.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 ${
                            index < requirements.met ? 'text-green-400' : 'text-gray-500'
                          }`} />
                          <span className={
                            index < requirements.met ? 'text-gray-300' : 'text-gray-500'
                          }>
                            {requirement}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{requirements.met}/{requirements.total}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${(requirements.met / requirements.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Benefits Preview */}
                  <div>
                    <h4 className="font-medium text-white mb-2">Certification Benefits</h4>
                    <ul className="space-y-1">
                      {program.benefits.slice(0, 3).map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-primary-400" />
                          {benefit}
                        </li>
                      ))}
                      {program.benefits.length > 3 && (
                        <li className="text-xs text-gray-500 pl-5">
                          +{program.benefits.length - 3} more benefits
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {isEnrolled ? (
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Continue Certification
                    </button>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleEnroll(program.id)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                      Start Certification - ${program.price}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full bg-gray-600 text-gray-400 py-3 px-4 rounded-lg cursor-not-allowed"
                      >
                        Complete Requirements First
                      </button>
                      <div className="text-xs text-gray-500 text-center">
                        {requirements.total - requirements.met} requirements remaining
                      </div>
                    </div>
                  )}
                </div>
              </LiquidGlassCard>
            </motion.div>
          );
        })}
      </LiquidGlassGrid>

      {/* Certification ROI */}
      <LiquidGlassContainer className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Certification ROI Calculator
            </h3>
            <p className="text-gray-300 mb-4">
              See how certification pays for itself through higher earnings
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-2">Before Certification</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Template Revenue Share:</span>
                    <span className="text-white">90%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Template Sales:</span>
                    <span className="text-white">$500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Monthly Earnings:</span>
                    <span className="text-white">$450</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">After Certification</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Template Revenue Share:</span>
                    <span className="text-green-400">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Template Sales:</span>
                    <span className="text-green-400">$800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Monthly Earnings:</span>
                    <span className="text-green-400 font-medium">$760</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700">
                    <span className="text-white font-medium">Additional Income:</span>
                    <span className="text-green-400 font-bold">+$310/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center ml-6">
            <div className="text-3xl font-bold text-green-400 mb-1">1.6x</div>
            <div className="text-sm text-gray-400 mb-4">Earnings Multiplier</div>
            <div className="text-xs text-green-300">
              Certification pays for itself in 8 weeks
            </div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Community Success Stories */}
      <LiquidGlassContainer className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Certified Creator Success Stories
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Marcus Chen</h4>
                <p className="text-sm text-green-300">Certified Whop Mockup Specialist</p>
              </div>
            </div>
            <p className="text-sm text-green-200 mb-2">
              "Certification helped me land 3 consulting gigs at $200/hour. Made back the investment
              in 2 weeks and now earning $2K+ monthly from templates alone."
            </p>
            <div className="text-xs text-green-300">+340% earnings increase</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-primary-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Sarah Rodriguez</h4>
                <p className="text-sm text-blue-300">Certified Conversion Optimizer</p>
              </div>
            </div>
            <p className="text-sm text-blue-200 mb-2">
              "The conversion psychology training transformed my approach. My store went from
              2.1% to 4.7% conversion rate. Now helping other creators achieve similar results."
            </p>
            <div className="text-xs text-blue-300">+124% conversion improvement</div>
          </div>
        </div>
      </LiquidGlassContainer>
    </div>
  );
}