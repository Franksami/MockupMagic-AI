# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Development with Whop proxy integration
npm run dev                    # Start dev server with Whop proxy on port 3000

# Backend database development
npm run convex                 # Start Convex development server
npm run convex:build          # Deploy Convex functions to production

# Build and deployment
npm run build                  # Build Next.js app and deploy Convex functions
npm run start                  # Start production server

# Code quality and validation
npm run typecheck             # Run TypeScript type checking
npm run lint                  # Run ESLint code analysis
```

### Testing Commands
```bash
# Comprehensive Playwright testing suite
npm run test                  # Run all Playwright tests
npm run test:components       # Component-specific tests
npm run test:performance      # Performance and Core Web Vitals tests
npm run test:browser          # Cross-browser compatibility tests

# Browser-specific testing
npm run test:chrome           # Chrome/Chromium only
npm run test:firefox          # Firefox only
npm run test:safari           # Safari/WebKit only

# Development testing modes
npm run test:headed           # Run tests with visible browser
npm run test:debug            # Debug mode with DevTools
npm run test:report           # View test results report
npm run test:ci               # CI-optimized test run
```

## Architecture Overview

**MockupMagic AI** is an AI-powered mockup generation platform built for Whop sellers and digital creators.

### Tech Stack Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    MOCKUPMAGIC STACK                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Next.js 15 + React 19 + TypeScript             │
│  Styling: Tailwind CSS + Framer Motion + Radix UI          │
│  State: TanStack React Query + React Context               │
│  Backend: Convex (Real-time DB + Functions)                │
│  AI: Replicate (SDXL) + OpenAI                            │
│  Platform: Whop SDK (Auth + Billing + Integration)         │
│  Testing: Playwright (E2E + Performance + Cross-browser)   │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Provider Architecture
The app uses a layered provider structure in `src/app/layout.tsx`:
```tsx
<WhopProvider>                    // Whop authentication and user management
  <ConvexClientProvider>          // Real-time database client
    <ReactQueryProvider>          // Server state management and caching
      <FrostedUIProvider>         // Custom liquid glass UI system
        {children}
      </FrostedUIProvider>
    </ReactQueryProvider>
  </ConvexClientProvider>
</WhopProvider>
```

### Database Schema (Convex)
The Convex schema (`convex/schema.ts`) includes 15+ production-ready tables:

**Core Tables:**
- `users` - Enhanced user management with Whop integration, credits, subscription tiers
- `mockups` - AI-generated mockup tracking with comprehensive metadata
- `templates` - Mockup templates with categories and usage analytics
- `generationJobs` - Advanced queue system for AI processing
- `files` - File storage management with user associations

**Business Tables:**
- `projects` - User project organization and sharing
- `billingEvents` - Payment processing and credit purchases
- `analytics` - Usage tracking and performance metrics
- `whopIntegrations` - Platform sync and store metrics
- `communityTemplates` - Template marketplace (Phase 2)
- `courses` - Educational content system (Phase 2)

## Key Development Patterns

### Authentication Flow
- **Production**: Uses Whop SDK iframe validation with `@whop-apps/sdk`
- **Development**: Automatic fallback with mock user data (Pro tier, 1000 credits)
- **Context**: `useWhop()` hook provides user state and authentication status
- **Integration**: Automatic Convex user sync with subscription and billing data

### File Handling System
- **Upload**: `/api/upload` → Convex storage → Database reference
- **Storage**: Convex `_storage` with metadata in `files` table
- **Download**: `/api/download?id={storageId}` → Stream from Convex storage
- **Progress**: Real-time upload progress using XMLHttpRequest
- **Validation**: File type, size limits based on subscription tier

### AI Generation Pipeline
- **Trigger**: `/api/generate` POST with product data and settings
- **Processing**: Replicate SDXL integration with advanced prompt engineering
- **Queue**: Sophisticated job queue with priority, retry logic, and status tracking
- **Webhooks**: `/api/webhooks/replicate` for async progress updates
- **Polling**: Real-time status updates via TanStack Query

### Component Organization
```
src/components/
├── ui/                      # Reusable UI primitives (LiquidGlass system)
├── providers/               # Context providers (Whop, Frosted UI)
├── templates/               # Template browsing and selection
├── generation/              # AI generation workflow components
├── upload/                  # File upload and drag-drop functionality
├── billing/                 # Credit system and purchase modals
├── analytics/               # ROI tracking and performance dashboards
├── community/               # Template marketplace and sharing
├── whop/                   # Whop platform integration components
└── gamification/           # Achievement system and leaderboards
```

### API Route Structure
```
src/app/api/
├── generate/               # AI mockup generation (POST: start, GET: status)
├── upload/                 # File upload to Convex storage
├── download/               # File serving from Convex storage
├── auth/whop/             # Whop authentication endpoint
├── webhooks/              # Replicate + Whop payment webhooks
├── templates/             # Template management
├── purchase-credits/      # Credit purchase flow
├── health/                # Health check and monitoring
└── security/audit/        # Security validation
```

## Development Guidelines

### Whop Integration Requirements
- Use `@whop-apps/dev-proxy` for local development with iframe context
- Always check authentication state with `useWhop()` hook before API calls
- Handle subscription tiers: `starter`, `growth`, `pro` with different feature access
- Credit system integration for all AI operations

### Convex Development Patterns
- **Functions**: Use `convex/functions/` directory for organized backend logic
- **Schema**: All tables defined in `convex/schema.ts` with proper indexing
- **Development**: `npm run convex` for local backend development
- **Deployment**: `npm run convex:build` for production deployment
- **File Storage**: Use `storage.generateUploadUrl()` and `storage.getUrl()` patterns

### TypeScript Configuration
- Path aliases: `@/*` maps to `src/*`, `@/convex/*` maps to `convex/*`
- Strict TypeScript with comprehensive type checking
- Exclude test files and utilities from build
- **Note**: `typescript.ignoreBuildErrors: true` in next.config.ts for faster development

### UI/UX Patterns
- **Design System**: Custom "Liquid Glass" components with glassmorphism effects
- **Animations**: Framer Motion for micro-interactions and state transitions
- **Responsive**: Mobile-first design with Tailwind CSS
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Loading States**: Comprehensive loading and error states for all async operations

### Testing Strategy
- **E2E Testing**: Playwright with comprehensive browser matrix
- **Component Testing**: Playwright Component Testing for isolated component validation
- **Performance**: Lighthouse integration with Core Web Vitals monitoring
- **Cross-Browser**: Chrome, Firefox, Safari, Edge support with mobile variants
- **Accessibility**: Automated accessibility testing in Playwright configuration

## Common Development Scenarios

### Adding New API Endpoints
1. Create route file in `src/app/api/[endpoint]/route.ts`
2. Add authentication with `authenticateUser()`
3. Add Convex operations using `api.functions.*` pattern
4. Add comprehensive error handling and validation
5. Update TypeScript interfaces if needed

### Adding New Convex Functions
1. Create/update files in `convex/functions/`
2. Export mutations/queries/actions with proper validation
3. Update schema if new tables/fields needed
4. Use proper indexing for query performance
5. Test with `npm run convex` locally

### Adding New UI Components
1. Use existing LiquidGlass component system for consistency
2. Follow Radix UI patterns for accessibility
3. Add Framer Motion animations for state transitions
4. Include proper TypeScript types and props
5. Add to appropriate component category directory

### File Upload Integration
- Use `/api/upload` endpoint for file persistence
- Files stored in Convex `_storage` with metadata in `files` table
- Real progress tracking with XMLHttpRequest
- Storage IDs used for generation API calls

### Authentication Development
- Development mode auto-bypasses iframe requirements
- Mock user data includes Pro tier with 1000 credits
- Production requires Whop app iframe context
- Use `useWhop()` hook for authentication state

## Production Deployment

### Environment Variables Required
```bash
# Whop Integration
NEXT_PUBLIC_WHOP_APP_ID=        # Your Whop app ID
WHOP_API_KEY=                   # Whop API key for backend operations

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=         # Convex deployment URL
CONVEX_DEPLOY_KEY=              # Convex deployment key

# AI Services
REPLICATE_API_TOKEN=            # Replicate API token for SDXL
OPENAI_API_KEY=                 # OpenAI API key for additional AI features

# App Configuration
NEXT_PUBLIC_APP_URL=            # Your app's public URL for webhooks
```

### Deployment Process
1. **Convex Deployment**: `npm run convex:build` deploys backend functions
2. **Next.js Build**: `npm run build` builds frontend and triggers Convex deployment
3. **Vercel Integration**: Automatic deployment on push to main branch
4. **Environment Setup**: Configure all required environment variables in deployment platform

## Known Issues and Workarounds

### TypeScript Warnings
- Some existing prompt engineering and queue manager files have type mismatches
- These are non-blocking for development and functionality
- `ignoreBuildErrors: true` in next.config.ts prevents build failures

### Local Development
- Whop authentication requires iframe context in production
- Development mode provides automatic bypass with mock user data
- Use port 3000 for Whop proxy integration
- Convex functions run independently on their own development server

### File Size Limits
- Starter tier: 10MB max file size
- Growth tier: 25MB max file size
- Pro tier: 50MB max file size
- Enforced both client-side and server-side