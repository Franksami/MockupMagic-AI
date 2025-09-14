"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, Star, DollarSign, Tag, Users,
  CheckCircle, AlertCircle, Info, Sparkles
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassModal } from "@/components/ui/LiquidGlassContainer";
import { useWhop } from "@/components/providers/whop-provider";
import { cn } from "@/lib/utils";

interface TemplateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string; // Pre-selected template to submit
  onSuccess?: (templateId: string) => void;
  className?: string;
}

type SubmissionStep = 'select' | 'details' | 'pricing' | 'review' | 'submitting' | 'success' | 'error';

export function TemplateSubmissionModal({
  isOpen,
  onClose,
  templateId,
  onSuccess,
  className = ""
}: TemplateSubmissionModalProps) {
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || '');
  const [submissionData, setSubmissionData] = useState({
    title: '',
    description: '',
    shareType: 'free' as 'free' | 'premium' | 'exclusive',
    price: 0,
    storeCategories: [] as string[],
    tags: [] as string[],
    whopCommunityId: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { whopUser, isAuthenticated } = useWhop();

  // Get user's templates for selection
  const userTemplates = useQuery(
    api.templates.getUserTemplates,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id } : "skip"
  );

  // Submit template mutation
  const submitTemplate = useMutation(api.community.submitCommunityTemplate);

  const whopStoreCategories = [
    'digital-products', 'courses', 'communities', 'software',
    'templates', 'consulting', 'coaching', 'memberships',
    'discord-servers', 'crypto', 'fitness', 'gaming'
  ];

  const handleSubmit = async () => {
    if (!isAuthenticated || !whopUser) {
      setErrorMessage('Please authenticate to submit templates');
      return;
    }

    if (!selectedTemplateId) {
      setErrorMessage('Please select a template to submit');
      return;
    }

    setCurrentStep('submitting');
    setErrorMessage('');

    try {
      const result = await submitTemplate({
        templateId: selectedTemplateId as any, // Type conversion for Convex ID
        whopUserId: whopUser.id,
        title: submissionData.title,
        description: submissionData.description,
        shareType: submissionData.shareType,
        price: submissionData.shareType === 'free' ? undefined : submissionData.price,
        storeCategories: submissionData.storeCategories,
        tags: submissionData.tags,
        whopCommunityId: submissionData.whopCommunityId || undefined,
      });

      setCurrentStep('success');
      onSuccess?.(result);
    } catch (error) {
      setCurrentStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Submission failed');
    }
  };

  const resetModal = () => {
    setCurrentStep('select');
    setSubmissionData({
      title: '',
      description: '',
      shareType: 'free',
      price: 0,
      storeCategories: [],
      tags: [],
      whopCommunityId: '',
    });
    setSelectedTemplateId(templateId || '');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={currentStep !== 'submitting' ? handleClose : () => {}}
      className={cn("w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">
            Share Template with Whop Community
          </h2>
        </div>
      </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[
                  { step: 'select', label: 'Select' },
                  { step: 'details', label: 'Details' },
                  { step: 'pricing', label: 'Pricing' },
                  { step: 'review', label: 'Review' }
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === item.step || ['submitting', 'success', 'error'].includes(currentStep)
                        ? 'bg-purple-600 text-white'
                        : index < ['select', 'details', 'pricing', 'review'].indexOf(currentStep)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`ml-2 text-sm ${
                      currentStep === item.step ? 'text-white' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                    {index < 3 && (
                      <div className="w-8 h-0.5 bg-gray-700 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {/* Step 1: Template Selection */}
              {currentStep === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Select Template to Share
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Choose one of your templates to share with the Whop creator community
                    </p>
                  </div>

                  {userTemplates && userTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userTemplates.map((template: any) => (
                        <motion.button
                          key={template._id}
                          onClick={() => setSelectedTemplateId(template._id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTemplateId === template._id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded mb-3 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                          </div>
                          <h4 className="font-medium text-white mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-400 mb-2">{template.category}</p>
                          <div className="text-xs text-gray-500">
                            Used {template.usageCount} times
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No templates available to share</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Create some templates first, then come back to share them!
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep('details')}
                      disabled={!selectedTemplateId}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Template Details */}
              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Template Details
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Help other Whop creators discover your template
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Template Title *
                    </label>
                    <input
                      type="text"
                      value={submissionData.title}
                      onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="High-Converting Product Mockup for Digital Courses"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={submissionData.description}
                      onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe how this template helped your Whop store, conversion improvements, best use cases..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Whop Store Categories *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {whopStoreCategories.map(category => (
                        <label key={category} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={submissionData.storeCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubmissionData(prev => ({
                                  ...prev,
                                  storeCategories: [...prev.storeCategories, category]
                                }));
                              } else {
                                setSubmissionData(prev => ({
                                  ...prev,
                                  storeCategories: prev.storeCategories.filter(c => c !== category)
                                }));
                              }
                            }}
                            className="w-4 h-4 text-purple-500 rounded"
                          />
                          <span className="text-sm text-gray-300 capitalize">
                            {category.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={submissionData.tags.join(', ')}
                      onChange={(e) => setSubmissionData(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      }))}
                      placeholder="ecommerce, conversion, professional, modern"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep('select')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep('pricing')}
                      disabled={!submissionData.title || !submissionData.description || submissionData.storeCategories.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Monetization Strategy
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Choose how you want to share your template with the community
                    </p>
                  </div>

                  {/* Share Type Options */}
                  <div className="space-y-3">
                    {[
                      {
                        type: 'free',
                        title: 'Free Community Template',
                        description: 'Share for community recognition and followers',
                        benefits: ['Build your creator reputation', 'Gain followers', 'Community recognition'],
                        color: 'green'
                      },
                      {
                        type: 'premium',
                        title: 'Premium Template ($5-50)',
                        description: 'Earn revenue while helping other creators',
                        benefits: ['90% creator revenue share', 'Proven conversion data', 'Exclusive access'],
                        color: 'purple'
                      },
                      {
                        type: 'exclusive',
                        title: 'Pro Member Exclusive',
                        description: 'Only for Pro subscribers (builds Pro tier value)',
                        benefits: ['Enhance Pro tier value', 'Premium positioning', 'Exclusive community'],
                        color: 'pink'
                      }
                    ].map((option) => (
                      <motion.button
                        key={option.type}
                        onClick={() => setSubmissionData(prev => ({
                          ...prev,
                          shareType: option.type as any,
                          price: option.type === 'free' ? 0 : prev.price
                        }))}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          submissionData.shareType === option.type
                            ? `border-${option.color}-500 bg-${option.color}-500/10`
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white mb-1">{option.title}</h4>
                            <p className="text-sm text-gray-400 mb-3">{option.description}</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {option.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Pricing Input for Premium */}
                  {submissionData.shareType === 'premium' && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <label className="block text-sm text-purple-300 mb-2">
                        Template Price (USD) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={submissionData.price}
                          onChange={(e) => setSubmissionData(prev => ({
                            ...prev,
                            price: parseInt(e.target.value) || 0
                          }))}
                          className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="25"
                        />
                      </div>
                      <p className="text-xs text-purple-300 mt-2">
                        You'll earn 90% (${(submissionData.price * 0.9).toFixed(2)}) per sale
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep('details')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep('review')}
                      disabled={submissionData.shareType === 'premium' && submissionData.price < 5}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Review Submission
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Confirm your template submission details
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Template:</span>
                      <span className="text-white font-medium">{submissionData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Share Type:</span>
                      <span className={`font-medium ${
                        submissionData.shareType === 'free' ? 'text-green-400' :
                        submissionData.shareType === 'premium' ? 'text-purple-400' :
                        'text-pink-400'
                      }`}>
                        {submissionData.shareType.charAt(0).toUpperCase() + submissionData.shareType.slice(1)}
                      </span>
                    </div>
                    {submissionData.price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Price:</span>
                        <span className="text-green-400 font-medium">${submissionData.price}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-300">Categories:</span>
                      <span className="text-white text-sm">
                        {submissionData.storeCategories.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <strong>Community Guidelines:</strong>
                        <ul className="mt-2 space-y-1 text-blue-200">
                          <li>• Template will be reviewed by community moderators</li>
                          <li>• Must show proven conversion improvements</li>
                          <li>• Revenue sharing: 90% creator, 10% platform</li>
                          <li>• Can be featured for exceptional performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep('pricing')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Submit Template
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Success/Error/Loading States */}
              {currentStep === 'submitting' && (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">Submitting Template</h3>
                  <p className="text-gray-300">Adding your template to the community...</p>
                </motion.div>
              )}

              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Template Submitted!</h3>
                  <p className="text-gray-300 mb-6">
                    Your template is now pending review by community moderators.
                    You'll be notified once it's approved!
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              )}

              {currentStep === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Submission Failed</h3>
                  <p className="text-red-300 mb-6">{errorMessage}</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setCurrentStep('review')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
    </LiquidGlassModal>
  );
}