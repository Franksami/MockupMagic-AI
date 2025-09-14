'use client';

import React from 'react';
import { AIWorkspace } from '@/components/workspace/AIWorkspace';
import { motion } from 'framer-motion';

export default function WorkspacePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-64px)]" // Subtract header height
    >
      <AIWorkspace projectId="demo-project" />
    </motion.div>
  );
}