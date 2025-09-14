# MockupMagic AI

AI-powered mockup generation tool built for Whop sellers and digital creators.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          MOCKUPMAGIC ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │
│  │   CLIENT    │      │   GATEWAY   │      │   BACKEND   │                 │
│  │             │      │             │      │             │                 │
│  │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │                 │
│  │ │ Next.js │◄├──────┤►│  Whop   │◄├──────┤►│ Convex  │ │                 │
│  │ │   App   │ │      │ │   SDK   │ │      │ │   DB    │ │                 │
│  │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │                 │
│  │             │      │             │      │             │                 │
│  │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │                 │
│  │ │Frosted  │ │      │ │  Auth   │ │      │ │Replicate│ │                 │
│  │ │   UI    │ │      │ │ Manager │ │      │ │   API   │ │                 │
│  │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │                 │
│  │             │      │             │      │             │                 │
│  │ ┌─────────┐ │      │ ┌─────────┐ │      │ ┌─────────┐ │                 │
│  │ │ React   │ │      │ │Webhook  │ │      │ │  File   │ │                 │
│  │ │ Query   │ │      │ │ Handler │ │      │ │ Storage │ │                 │
│  │ └─────────┘ │      │ └─────────┘ │      │ └─────────┘ │                 │
│  └─────────────┘      └─────────────┘      └─────────────┘                 │
│                                                                                │
│  Data Flow:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │ User Upload → Convex Storage → AI Queue → Replicate → Result Cache │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Features

- 🎨 AI-powered mockup generation using Replicate/SDXL
- 🔥 Real-time database with Convex
- 🛍️ Native Whop integration for sellers
- 📱 Responsive design with Tailwind CSS
- 🎯 Template system with categories
- 📊 Analytics and usage tracking
- 💳 Stripe integration for billing
- 🔄 Queue system for AI generation jobs

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Server state management

### Backend
- **Convex** - Real-time database and backend functions
- **Replicate** - AI model hosting (SDXL)
- **OpenAI** - Additional AI capabilities

### Integration
- **Whop SDK** - Platform integration
- **Stripe** - Payment processing

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Convex account
- Replicate account
- Whop developer account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mockupmagic-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys and configuration:
   - `NEXT_PUBLIC_WHOP_APP_ID` - Your Whop app ID
   - `WHOP_API_KEY` - Whop API key
   - `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
   - `CONVEX_DEPLOY_KEY` - Convex deployment key
   - `REPLICATE_API_TOKEN` - Replicate API token
   - `OPENAI_API_KEY` - OpenAI API key

4. **Start Convex development server**
   ```bash
   npm run convex
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript definitions

convex/                 # Backend functions
├── functions/          # Convex functions
├── schema.ts           # Database schema
└── _generated/         # Auto-generated files
```

### Available Scripts

- `npm run dev` - Start development server with Whop proxy
- `npm run build` - Build for production and deploy Convex
- `npm run convex` - Start Convex development server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Database Schema

The project uses a comprehensive Convex schema including:

- **Users** - User profiles and subscription management
- **Mockups** - AI-generated mockup tracking
- **Templates** - Mockup templates and configurations
- **Projects** - User project organization
- **Generation Jobs** - AI processing queue
- **Analytics** - Usage and performance tracking
- **Whop Integrations** - Platform sync and metrics
- **Billing Events** - Payment and subscription tracking
- **Feature Flags** - Experiment and rollout management

## Deployment

### Convex Deployment
```bash
npm run convex:build
```

### Vercel Deployment
The project is configured for easy Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

[Add your license here]

## Status

🚧 **In Development** - Core features are being implemented.

### Completed
- ✅ Project setup and configuration
- ✅ Database schema design
- ✅ Basic UI structure
- ✅ Convex integration setup

### In Progress  
- 🔄 UI components and templates
- 🔄 File upload system
- 🔄 AI generation pipeline

### Planned
- ⏳ Whop SDK integration
- ⏳ Stripe billing integration
- ⏳ Advanced analytics
- ⏳ Mobile optimization