'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  MessageSquare,
  Phone,
  PhoneOff,
  Monitor,
  Settings,
  Copy,
  Check,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Crown,
  Circle,
  Square,
  ArrowUpLeft,
  Type,
  Palette,
  Move,
  MousePointer,
  Send,
  MoreVertical,
  X,
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { LiquidGlassContainer, LiquidGlassCard, LiquidGlassButton } from '@/components/ui/LiquidGlassContainer';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  cursorPosition?: { x: number; y: number };
  selectedTool?: string;
  lastActivity?: Date;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'tool';
}

interface CollaborationSession {
  id: string;
  name: string;
  createdAt: Date;
  participants: number;
  isActive: boolean;
  inviteCode: string;
}

interface CollaborationPanelProps {
  sessionId?: string;
  userId?: string;
  userName?: string;
  onSessionCreate?: (session: CollaborationSession) => void;
  onSessionJoin?: (sessionId: string) => void;
  onSessionLeave?: () => void;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  sessionId,
  userId = 'user-1',
  userName = 'You',
  onSessionCreate,
  onSessionJoin,
  onSessionLeave,
  className,
}) => {
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [selectedTool, setSelectedTool] = useState('cursor');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);

  // Simulate WebRTC connection
  useEffect(() => {
    if (sessionId) {
      setConnectionStatus('connecting');
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
        initializeSession();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [sessionId]);

  // Initialize mock session
  const initializeSession = () => {
    const mockSession: CollaborationSession = {
      id: sessionId || 'session-1',
      name: 'Design Review Session',
      createdAt: new Date(),
      participants: 3,
      isActive: true,
      inviteCode: 'MOCK-CODE-123',
    };
    setActiveSession(mockSession);

    // Mock collaborators
    const mockCollaborators: Collaborator[] = [
      {
        id: userId,
        name: userName,
        color: '#FA4616',
        role: 'owner',
        isOnline: true,
        cursorPosition: { x: 50, y: 50 },
        selectedTool: 'cursor',
      },
      {
        id: 'user-2',
        name: 'Alex Designer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        color: '#EC4899',
        role: 'editor',
        isOnline: true,
        isSpeaking: false,
        cursorPosition: { x: 200, y: 150 },
        selectedTool: 'move',
      },
      {
        id: 'user-3',
        name: 'Sarah PM',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        color: '#10B981',
        role: 'viewer',
        isOnline: true,
        cursorPosition: { x: 350, y: 200 },
        selectedTool: 'cursor',
      },
    ];
    setCollaborators(mockCollaborators);

    // Add system message
    addSystemMessage('Session started. 3 participants joined.');
  };

  // Simulate cursor movement
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(() => {
      setCollaborators(prev => prev.map(collab => {
        if (collab.id === userId) return collab;
        return {
          ...collab,
          cursorPosition: {
            x: Math.max(0, Math.min(500, (collab.cursorPosition?.x || 0) + (Math.random() - 0.5) * 50)),
            y: Math.max(0, Math.min(400, (collab.cursorPosition?.y || 0) + (Math.random() - 0.5) * 50)),
          },
          isSpeaking: Math.random() > 0.9,
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionStatus, userId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      userId: 'system',
      userName: 'System',
      content,
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId,
      userName,
      content: messageInput,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, message]);
    setMessageInput('');

    // Simulate response
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const responseUser = collaborators.find(c => c.id !== userId);
        if (responseUser) {
          const response: Message = {
            id: (Date.now() + 1).toString(),
            userId: responseUser.id,
            userName: responseUser.name,
            content: 'Looks good! 👍',
            timestamp: new Date(),
            type: 'text',
          };
          setMessages(prev => [...prev, response]);
        }
      }, 1500);
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (!isVideoOn) {
      addSystemMessage(`${userName} turned on video`);
    } else {
      addSystemMessage(`${userName} turned off video`);
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (!isAudioOn) {
      addSystemMessage(`${userName} unmuted`);
    } else {
      addSystemMessage(`${userName} muted`);
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (!isScreenSharing) {
      addSystemMessage(`${userName} started screen sharing`);
    } else {
      addSystemMessage(`${userName} stopped screen sharing`);
    }
  };

  const toggleCall = () => {
    setIsInCall(!isInCall);
    if (!isInCall) {
      addSystemMessage(`${userName} joined the call`);
      setIsAudioOn(true);
    } else {
      addSystemMessage(`${userName} left the call`);
      setIsVideoOn(false);
      setIsAudioOn(false);
      setIsScreenSharing(false);
    }
  };

  const copyInviteLink = () => {
    if (activeSession) {
      navigator.clipboard.writeText(`https://mockupmagic.ai/collab/${activeSession.inviteCode}`);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const changeUserRole = (userId: string, newRole: 'owner' | 'editor' | 'viewer') => {
    setCollaborators(prev => prev.map(collab =>
      collab.id === userId ? { ...collab, role: newRole } : collab
    ));
    addSystemMessage(`Changed ${collaborators.find(c => c.id === userId)?.name}'s role to ${newRole}`);
  };

  const tools = [
    { id: 'cursor', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'type', icon: Type, label: 'Text' },
    { id: 'draw', icon: Edit, label: 'Draw' },
    { id: 'shape', icon: Square, label: 'Shape' },
    { id: 'color', icon: Palette, label: 'Color' },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />;
      case 'editor': return <Edit className="w-3 h-3" />;
      case 'viewer': return <Eye className="w-3 h-3" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-400';
      case 'editor': return 'text-primary-400';
      case 'viewer': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn('w-full h-full flex gap-4', className)}>
      {/* Main Collaboration Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <LiquidGlassContainer variant="shallow" className="p-3">
          <div className="flex items-center justify-between">
            {/* Tools */}
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTool(tool.id)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    selectedTool === tool.id
                      ? 'bg-primary-500/30 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  )}
                  title={tool.label}
                >
                  <tool.icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>

            {/* Session Info */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Connected</span>
                  </>
                ) : connectionStatus === 'connecting' ? (
                  <>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Wifi className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                    <span className="text-xs text-yellow-400">Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Offline</span>
                  </>
                )}
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={toggleCall}
                  className={cn(
                    'p-2 rounded transition-all',
                    isInCall
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {isInCall ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleVideo}
                  disabled={!isInCall}
                  className={cn(
                    'p-2 rounded transition-all',
                    isVideoOn
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white',
                    !isInCall && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleAudio}
                  disabled={!isInCall}
                  className={cn(
                    'p-2 rounded transition-all',
                    isAudioOn
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white',
                    !isInCall && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleScreenShare}
                  disabled={!isInCall}
                  className={cn(
                    'p-2 rounded transition-all',
                    isScreenSharing
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white',
                    !isInCall && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>

              {/* Invite Button */}
              <LiquidGlassButton
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </LiquidGlassButton>
            </div>
          </div>
        </LiquidGlassContainer>

        {/* Canvas Area with Cursors */}
        <LiquidGlassContainer variant="medium" className="flex-1 relative overflow-hidden">
          {/* Mock Canvas */}
          <div className="absolute inset-0 bg-gray-900/30">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            {/* Collaborator Cursors */}
            <AnimatePresence>
              {collaborators.map((collab) => (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: collab.cursorPosition?.x || 0,
                    y: collab.cursorPosition?.y || 0,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', damping: 30 }}
                  className="absolute pointer-events-none"
                  style={{ color: collab.color }}
                >
                  <MousePointer className="w-4 h-4 fill-current" />
                  <div
                    className="absolute top-4 left-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: collab.color }}
                  >
                    {collab.name}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Center Message */}
            {connectionStatus === 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Collaborative canvas active</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {collaborators.length} participants connected
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Video Grid (when in call) */}
          {isInCall && (
            <div
              ref={videoGridRef}
              className="absolute top-4 right-4 grid grid-cols-2 gap-2 max-w-sm"
            >
              {collaborators.filter(c => c.isOnline).map((collab) => (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <LiquidGlassCard variant="shallow" className="p-2">
                    <div className="w-32 h-24 bg-gray-800 rounded flex items-center justify-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: collab.color }}
                      >
                        {collab.name[0]}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-white truncate">{collab.name}</span>
                      {collab.isSpeaking && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Mic className="w-3 h-3 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                  </LiquidGlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </LiquidGlassContainer>
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        {/* Participants */}
        {showParticipants && (
          <LiquidGlassContainer variant="shallow" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" />
                Participants ({collaborators.length})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: collab.color }}
                      >
                        {collab.name[0]}
                      </div>
                      {collab.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-white">{collab.name}</span>
                        {collab.id === userId && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                      <div className={cn('flex items-center gap-1 text-xs', getRoleColor(collab.role))}>
                        {getRoleIcon(collab.role)}
                        <span>{collab.role}</span>
                      </div>
                    </div>
                  </div>

                  {collab.id !== userId && (
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </LiquidGlassContainer>
        )}

        {/* Chat */}
        {showChat && (
          <LiquidGlassContainer variant="shallow" className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-400" />
                Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-2',
                    message.type === 'system' && 'justify-center'
                  )}
                >
                  {message.type === 'system' ? (
                    <div className="text-xs text-gray-500 italic">
                      {message.content}
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: collaborators.find(c => c.id === message.userId)?.color || '#666',
                        }}
                      >
                        {message.userName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-medium text-white">
                            {message.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{message.content}</p>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <LiquidGlassButton
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="px-3 py-2"
                >
                  <Send className="w-4 h-4" />
                </LiquidGlassButton>
              </div>
            </div>
          </LiquidGlassContainer>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <LiquidGlassContainer variant="deep" glow className="p-6 max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">Invite Collaborators</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Share Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`https://mockupmagic.ai/collab/${activeSession.inviteCode}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white"
                      />
                      <LiquidGlassButton onClick={copyInviteLink} className="px-3 py-2">
                        {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </LiquidGlassButton>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Invite Code</label>
                    <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                      <span className="text-xl font-mono text-white tracking-wider">
                        {activeSession.inviteCode}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Permissions</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="permission" defaultChecked className="text-primary-500" />
                        <Edit className="w-4 h-4 text-primary-400" />
                        <span className="text-sm text-white">Can edit</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="permission" className="text-primary-500" />
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white">Can view</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <LiquidGlassButton
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2"
                  >
                    Done
                  </LiquidGlassButton>
                </div>
              </LiquidGlassContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};