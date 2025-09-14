'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Send,
  Loader2,
  Wand2,
  Zap,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Image as ImageIcon,
  Palette,
  Settings
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'style' | 'prompt' | 'setting' | 'enhancement';
  title: string;
  description: string;
  value: any;
  icon: React.ElementType;
  confidence: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Suggestion[];
}

interface AIAssistantPanelProps {
  uploadedImage?: File;
  currentSettings?: any;
  onSuggestionApply?: (suggestion: Suggestion) => void;
  onPromptGenerate?: (prompt: string) => void;
  className?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  uploadedImage,
  currentSettings,
  onSuggestionApply,
  onPromptGenerate,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-generate initial suggestions based on uploaded image
  useEffect(() => {
    if (uploadedImage && activeSuggestions.length === 0) {
      generateSmartSuggestions();
    }
  }, [uploadedImage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateSmartSuggestions = () => {
    // Simulate AI-powered suggestions based on image analysis
    const suggestions: Suggestion[] = [
      {
        id: '1',
        type: 'style',
        title: 'Modern Gradient Background',
        description: 'Apply a trendy gradient background that complements your product',
        value: { background: 'gradient', colors: ['#667eea', '#764ba2'] },
        icon: Palette,
        confidence: 0.92,
      },
      {
        id: '2',
        type: 'prompt',
        title: 'Professional Product Shot',
        description: 'Studio lighting with subtle shadows for e-commerce',
        value: 'Professional product photography, studio lighting, subtle shadows, clean white background, commercial quality',
        icon: ImageIcon,
        confidence: 0.88,
      },
      {
        id: '3',
        type: 'enhancement',
        title: 'Auto-Enhance Colors',
        description: 'Boost vibrancy and contrast for eye-catching results',
        value: { enhance: true, vibrancy: 1.2, contrast: 1.1 },
        icon: Sparkles,
        confidence: 0.85,
      },
      {
        id: '4',
        type: 'setting',
        title: 'Premium Quality',
        description: 'Generate at highest resolution for professional use',
        value: { quality: 'premium', resolution: '4K' },
        icon: Settings,
        confidence: 0.90,
      },
    ];

    setActiveSuggestions(suggestions);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: generateContextualSuggestions(inputValue),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    // Simulate intelligent responses based on input
    const responses = [
      "I've analyzed your request and generated some suggestions to enhance your mockup. The recommendations are based on current design trends and your product type.",
      "Great idea! I recommend using a minimalist approach with soft shadows to make your product stand out. Would you like me to adjust the settings?",
      "Based on your image, I suggest using a lifestyle setting with natural lighting. This will create a more relatable and engaging mockup.",
      "I understand what you're looking for. Let me optimize the settings for maximum visual impact while maintaining professional quality.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateContextualSuggestions = (input: string): Suggestion[] => {
    // Generate context-aware suggestions based on conversation
    return [
      {
        id: Date.now().toString(),
        type: 'prompt',
        title: 'Custom Prompt',
        description: 'Generated based on your request',
        value: `${input}, professional quality, high resolution`,
        icon: MessageSquare,
        confidence: 0.87,
      },
    ];
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions = [
    { icon: Wand2, label: 'Magic Enhance', action: 'enhance' },
    { icon: Lightbulb, label: 'Suggest Ideas', action: 'suggest' },
    { icon: Zap, label: 'Quick Generate', action: 'generate' },
  ];

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      <LiquidGlassContainer
        variant="medium"
        glow
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-6 h-6 text-purple-400" />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex gap-2">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                      onClick={() => {
                        if (action.action === 'suggest') {
                          generateSmartSuggestions();
                        }
                      }}
                    >
                      <action.icon className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Smart Suggestions */}
              {activeSuggestions.length > 0 && (
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">Smart Suggestions</h4>
                    <button
                      onClick={generateSmartSuggestions}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeSuggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="group"
                      >
                        <LiquidGlassCard
                          variant="shallow"
                          className="p-3 cursor-pointer hover:bg-purple-500/10 transition-all"
                          onClick={() => onSuggestionApply?.(suggestion)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <suggestion.icon className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-white">{suggestion.title}</h5>
                                <div className="flex items-center gap-1">
                                  <div className="text-xs text-gray-400">
                                    {Math.round(suggestion.confidence * 100)}%
                                  </div>
                                  <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                      style={{ width: `${suggestion.confidence * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                            </div>
                          </div>
                        </LiquidGlassCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">
                      Ask me anything about your mockup!
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Try: "Make it more professional" or "Suggest a color scheme"
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] p-3 rounded-lg',
                            message.role === 'user'
                              ? 'bg-purple-500/20 text-white'
                              : 'bg-gray-800/50 text-gray-200'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              {message.suggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  onClick={() => onSuggestionApply?.(suggestion)}
                                  className="flex items-center gap-2 w-full p-2 rounded hover:bg-purple-500/10 transition-colors"
                                >
                                  <suggestion.icon className="w-4 h-4 text-purple-400" />
                                  <span className="text-xs text-gray-300">{suggestion.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-sm text-white">U</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for suggestions or describe what you want..."
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    disabled={isLoading}
                  />
                  <LiquidGlassButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </LiquidGlassButton>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Powered by AI • Learns from your preferences
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LiquidGlassContainer>
    </div>
  );
};