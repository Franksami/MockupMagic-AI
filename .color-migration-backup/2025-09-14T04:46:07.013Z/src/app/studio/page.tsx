import React, { Suspense } from 'react';
import StudioPageContent from './StudioPageContent';

function StudioPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-full">
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-purple-300 font-medium">Loading MockupMagic AI...</span>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioPageFallback />}>
      <StudioPageContent />
    </Suspense>
  );
}