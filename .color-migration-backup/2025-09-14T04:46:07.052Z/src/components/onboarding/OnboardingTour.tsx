'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  PlayCircle,
  SkipForward,
  Target,
  Upload,
  Palette,
  Sparkles,
  Download,
  Users,
  Trophy,
  Lightbulb,
  Info,
  Book,
  MessageCircle,
  Keyboard,
  MousePointer,
  ArrowRight,
  Zap,
  Gift,
  Star
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ElementType;
  action?: () => void;
  tips?: string[];
  shortcuts?: { key: string; description: string }[];
}

interface HelpTopic {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  videoUrl?: string;
  relatedTopics?: string[];
}

interface OnboardingTourProps {
  isFirstVisit?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isFirstVisit = true,
  onComplete,
  onSkip,
  className,
}) => {
  const [showTour, setShowTour] = useState(isFirstVisit);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MockupMagic AI! 🎨',
      description: 'Create stunning product mockups with AI in seconds. Let\'s take a quick tour to get you started.',
      placement: 'center',
      icon: Sparkles,
      tips: [
        'This tour takes only 2 minutes',
        'You can restart it anytime from the help menu',
        'Press ESC to skip at any point'
      ],
    },
    {
      id: 'upload',
      title: 'Upload Your Product Image',
      description: 'Drag and drop your product image here, or click to browse. We support PNG, JPG, and WebP formats up to 10MB.',
      target: '.drag-drop-zone',
      placement: 'bottom',
      icon: Upload,
      tips: [
        'For best results, use a transparent background',
        'You can upload multiple images at once',
        'Batch processing is available for pro users'
      ],
    },
    {
      id: 'templates',
      title: 'Choose a Template',
      description: 'Browse through 1000+ professional templates. Use filters to find the perfect match for your product.',
      target: '.template-selector',
      placement: 'right',
      icon: Palette,
      tips: [
        'Templates are organized by category',
        'Star your favorites for quick access',
        'Custom templates available for teams'
      ],
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get smart suggestions and let AI help you create the perfect mockup. Just describe what you want!',
      target: '.ai-assistant',
      placement: 'left',
      icon: Sparkles,
      tips: [
        'Try: "Make it more professional"',
        'AI learns from your preferences',
        'Voice commands coming soon'
      ],
      shortcuts: [
        { key: 'Cmd+K', description: 'Open AI assistant' },
        { key: 'Cmd+Enter', description: 'Apply suggestion' },
      ],
    },
    {
      id: 'preview',
      title: 'Live Preview',
      description: 'See your mockup come to life in real-time. Zoom, rotate, and adjust until it\'s perfect.',
      target: '.preview-canvas',
      placement: 'top',
      icon: Target,
      tips: [
        'Use mouse wheel to zoom',
        'Hold Shift to constrain proportions',
        'Double-click to reset view'
      ],
      shortcuts: [
        { key: 'Space', description: 'Pan mode' },
        { key: 'R', description: 'Rotate' },
        { key: 'Cmd+0', description: 'Reset zoom' },
      ],
    },
    {
      id: 'collaboration',
      title: 'Real-time Collaboration',
      description: 'Invite team members to collaborate in real-time. See their cursors, chat, and work together seamlessly.',
      target: '.collaboration-panel',
      placement: 'left',
      icon: Users,
      tips: [
        'Share a link to invite collaborators',
        'Set permissions for each member',
        'Video chat integrated'
      ],
    },
    {
      id: 'export',
      title: 'Export Your Mockup',
      description: 'Download in multiple formats and resolutions. Perfect for social media, presentations, or print.',
      target: '.export-button',
      placement: 'top',
      icon: Download,
      tips: [
        'Export up to 4K resolution',
        'Batch export available',
        'Direct social media sharing'
      ],
    },
    {
      id: 'achievements',
      title: 'Unlock Achievements',
      description: 'Earn badges and climb the leaderboard as you create amazing mockups. Check your progress here!',
      target: '.achievements',
      placement: 'bottom',
      icon: Trophy,
      tips: [
        'Complete milestones for rewards',
        'Compete with other creators',
        'Exclusive perks for top performers'
      ],
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'You\'re ready to create amazing mockups. Remember, help is always just a click away.',
      placement: 'center',
      icon: CheckCircle,
      tips: [
        'Press ? for keyboard shortcuts',
        'Join our Discord community',
        'Check out video tutorials'
      ],
    },
  ];

  const helpTopics: HelpTopic[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: PlayCircle,
      content: 'Learn the basics of MockupMagic AI and create your first mockup in minutes.',
      videoUrl: 'https://youtube.com/watch?v=demo',
      relatedTopics: ['upload', 'templates', 'export'],
    },
    {
      id: 'upload',
      title: 'Uploading Images',
      icon: Upload,
      content: 'Supported formats: PNG, JPG, WebP. Max size: 10MB. For best results, use transparent backgrounds.',
      relatedTopics: ['batch-processing', 'image-requirements'],
    },
    {
      id: 'templates',
      title: 'Using Templates',
      icon: Palette,
      content: 'Browse 1000+ professional templates. Filter by category, style, or color. Save favorites for quick access.',
      relatedTopics: ['custom-templates', 'template-editor'],
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      icon: Sparkles,
      content: 'Our AI assistant helps you create perfect mockups. Describe what you want, and AI will suggest the best options.',
      relatedTopics: ['ai-prompts', 'smart-suggestions'],
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      icon: Users,
      content: 'Work together in real-time. Share projects, see live cursors, chat, and video call with your team.',
      relatedTopics: ['permissions', 'sharing', 'comments'],
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      content: 'Speed up your workflow with keyboard shortcuts. Press ? anytime to see the full list.',
      relatedTopics: ['productivity-tips', 'customization'],
    },
    {
      id: 'export-options',
      title: 'Export & Download',
      icon: Download,
      content: 'Export in multiple formats (PNG, JPG, PDF). Choose resolution up to 4K. Batch export available.',
      relatedTopics: ['social-media', 'print-ready', 'batch-export'],
    },
    {
      id: 'achievements',
      title: 'Achievements & Rewards',
      icon: Trophy,
      content: 'Earn badges, climb leaderboards, and unlock exclusive features as you create more mockups.',
      relatedTopics: ['leaderboard', 'milestones', 'rewards'],
    },
  ];

  const shortcuts = [
    { category: 'General', items: [
      { key: '?', description: 'Show keyboard shortcuts' },
      { key: 'Cmd+K', description: 'Open AI assistant' },
      { key: 'Cmd+S', description: 'Save project' },
      { key: 'Cmd+Z', description: 'Undo' },
      { key: 'Cmd+Shift+Z', description: 'Redo' },
    ]},
    { category: 'Canvas', items: [
      { key: 'Space', description: 'Pan mode' },
      { key: 'V', description: 'Select tool' },
      { key: 'R', description: 'Rotate' },
      { key: 'Cmd+0', description: 'Reset zoom' },
      { key: 'Cmd++', description: 'Zoom in' },
      { key: 'Cmd+-', description: 'Zoom out' },
    ]},
    { category: 'Collaboration', items: [
      { key: 'C', description: 'Toggle chat' },
      { key: 'Cmd+Enter', description: 'Send message' },
      { key: 'Cmd+Shift+V', description: 'Start video call' },
      { key: 'Cmd+Shift+M', description: 'Toggle microphone' },
    ]},
  ];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTour) {
        handleSkip();
      }
      if (e.key === '?' && !showTour) {
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showTour]);

  useEffect(() => {
    setProgress((currentStep / (tourSteps.length - 1)) * 100);
  }, [currentStep]);

  const handleNext = () => {
    const currentStepId = tourSteps[currentStep].id;
    setCompletedSteps(prev => new Set(prev).add(currentStepId));

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTour(false);
    onSkip?.();
  };

  const handleComplete = () => {
    setShowTour(false);
    onComplete?.();
    // Save completion to localStorage
    localStorage.setItem('onboarding_completed', 'true');
  };

  const handleRestartTour = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setShowTour(true);
    setShowHelp(false);
  };

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

            {/* Spotlight Effect */}
            {currentTourStep.target && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="absolute bg-transparent border-4 border-purple-500/50 rounded-lg"
                  style={{
                    // This would be calculated based on the target element
                    top: '20%',
                    left: '30%',
                    width: '40%',
                    height: '30%',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  }}
                />
              </motion.div>
            )}

            {/* Tour Step Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                'absolute pointer-events-auto',
                currentTourStep.placement === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                currentTourStep.placement === 'top' && 'top-20 left-1/2 -translate-x-1/2',
                currentTourStep.placement === 'bottom' && 'bottom-20 left-1/2 -translate-x-1/2',
                currentTourStep.placement === 'left' && 'left-20 top-1/2 -translate-y-1/2',
                currentTourStep.placement === 'right' && 'right-20 top-1/2 -translate-y-1/2'
              )}
            >
              <LiquidGlassContainer variant="deep" glow className="p-6 max-w-md">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Step {currentStep + 1} of {tourSteps.length}</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <currentTourStep.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {currentTourStep.title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {currentTourStep.description}
                    </p>
                  </div>
                </div>

                {/* Tips */}
                {currentTourStep.tips && currentTourStep.tips.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">Pro Tips</span>
                    </div>
                    <ul className="space-y-1">
                      {currentTourStep.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Shortcuts */}
                {currentTourStep.shortcuts && currentTourStep.shortcuts.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Keyboard className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">Shortcuts</span>
                    </div>
                    <div className="space-y-1">
                      {currentTourStep.shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 font-mono">
                            {shortcut.key}
                          </kbd>
                          <span className="text-gray-400">{shortcut.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSkip}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Skip Tour
                  </button>

                  <div className="flex items-center gap-2">
                    <LiquidGlassButton
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className="px-3 py-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </LiquidGlassButton>

                    <LiquidGlassButton
                      onClick={handleNext}
                      className="px-4 py-1.5"
                    >
                      {currentStep === tourSteps.length - 1 ? (
                        <>
                          Complete
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </LiquidGlassButton>
                  </div>
                </div>
              </LiquidGlassContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Button (Always Visible) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg text-white"
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Help Center Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
            >
              <LiquidGlassContainer variant="deep" glow className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-purple-400" />
                      Help Center
                    </h2>
                    <button
                      onClick={() => setShowHelp(false)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="mt-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for help..."
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <LiquidGlassCard
                      variant="shallow"
                      className="p-4 cursor-pointer hover:bg-purple-500/10 transition-all"
                      onClick={handleRestartTour}
                    >
                      <PlayCircle className="w-8 h-8 text-purple-400 mb-2" />
                      <h4 className="text-white font-medium">Restart Tour</h4>
                      <p className="text-xs text-gray-400 mt-1">Take the guided tour again</p>
                    </LiquidGlassCard>

                    <LiquidGlassCard
                      variant="shallow"
                      className="p-4 cursor-pointer hover:bg-purple-500/10 transition-all"
                      onClick={() => setShowShortcuts(true)}
                    >
                      <Keyboard className="w-8 h-8 text-purple-400 mb-2" />
                      <h4 className="text-white font-medium">Shortcuts</h4>
                      <p className="text-xs text-gray-400 mt-1">Keyboard shortcuts reference</p>
                    </LiquidGlassCard>

                    <LiquidGlassCard
                      variant="shallow"
                      className="p-4 cursor-pointer hover:bg-purple-500/10 transition-all"
                    >
                      <MessageCircle className="w-8 h-8 text-purple-400 mb-2" />
                      <h4 className="text-white font-medium">Contact Support</h4>
                      <p className="text-xs text-gray-400 mt-1">Get help from our team</p>
                    </LiquidGlassCard>
                  </div>

                  {/* Help Topics */}
                  <h3 className="text-lg font-semibold text-white mb-4">Help Topics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredTopics.map((topic) => (
                      <LiquidGlassCard
                        key={topic.id}
                        variant="shallow"
                        className="p-4 cursor-pointer hover:bg-purple-500/10 transition-all"
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <topic.icon className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">{topic.title}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2">{topic.content}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500 mt-1" />
                        </div>
                      </LiquidGlassCard>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <a href="#" className="hover:text-white transition-colors">Documentation</a>
                      <a href="#" className="hover:text-white transition-colors">Video Tutorials</a>
                      <a href="#" className="hover:text-white transition-colors">Community</a>
                    </div>
                    <div className="text-sm text-gray-500">
                      Press ? for shortcuts
                    </div>
                  </div>
                </div>
              </LiquidGlassContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <LiquidGlassContainer variant="deep" glow className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Keyboard className="w-6 h-6 text-purple-400" />
                    Keyboard Shortcuts
                  </h3>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                  {shortcuts.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-medium text-purple-400 mb-3">{category.category}</h4>
                      <div className="space-y-2">
                        {category.items.map((shortcut) => (
                          <div key={shortcut.key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">{shortcut.description}</span>
                            <kbd className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white font-mono">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </LiquidGlassContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};