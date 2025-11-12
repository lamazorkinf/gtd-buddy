# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary development workflow:**
- `npm run dev` - Start development server (Next.js 15.2.4)
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

**Package manager:** Uses npm with pnpm-lock.yaml (consider using pnpm for consistency)

## Project Architecture

### Tech Stack
- **Framework:** Next.js 15 with React 19 (App Router)
- **UI:** Radix UI components with Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth with Google provider
- **Payment:** MercadoPago integration
- **Animations:** Framer Motion
- **State Management:** React Context + Custom hooks

### Key Architectural Patterns

**GTD (Getting Things Done) System Implementation:**
- Tasks categorized as: "Inbox", "Próximas acciones", "Multitarea", "A la espera", "Algún día"
- Context-based organization (replaced legacy "projects")
- 2-minute rule support (isQuickAction)
- Subtasks support for "Multitarea" projects
- Due dates with time support
- Estimated time in minutes

**Authentication & Subscription Flow:**
- Firebase Auth with email/password and Google OAuth
- Trial period system (7 days for new users)
  - New users automatically get `subscriptionStatus: "trial"`
  - Trial starts on first login/signup (`trialStartDate`)
  - Trial expires after 7 days (`subscriptionEndDate`)
  - Users can only have one trial period per account
  - Use `/api/start-trial` to manually activate trial
- MercadoPago subscription management
  - Subscription cancellation maintains access until period end
  - `pending_cancellation` status tracks scheduled cancellations
  - Uses MercadoPago `end_date` to prevent auto-renewal
- Subscription status verification throughout app
- Test users (role: "test") bypass all restrictions
- Auth context provides user, loading, and subscription status
- Toast notifications for subscription events (success, failure, pending)

**Data Architecture:**
- User document in Firestore contains subscription info
- Tasks collection with userId filtering
- Contexts collection for GTD contexts
- Subtasks embedded within task documents
- Server-side API routes for external integrations

### File Structure Conventions

**Components organization:**
- `/components/ui/` - Reusable UI components (Radix + shadcn/ui)
- `/components/dashboard/` - Dashboard-specific components
- `/components/gtd/` - GTD methodology components
- `/components/tasks/` - Task management components
- `/components/transitions/` - Animation wrappers

**Business logic:**
- `/hooks/` - Custom React hooks (use-tasks, use-contexts, etc.)
- `/lib/` - Utility functions and configurations
- `/contexts/` - React context providers
- `/types/` - TypeScript type definitions

**API structure:**
- `/app/api/` - Next.js API routes
- Firebase Admin SDK for server-side operations
- Bearer token authentication for API routes

### Important Implementation Details

**Design System - Modern Glassmorphism:**
- Centralized theme configuration in `lib/theme.ts`
- Glassmorphism effects with `backdrop-blur-xl bg-white/40`
- Consistent color palette for GTD categories (blue, green, purple, orange, amber)
- Modal overlays use `bg-black/20 backdrop-blur-sm` for visibility
- All modals (Dialog, AlertDialog, ModalTransition) follow same styling pattern
- Page transitions: fade-only with 0.15s duration for smoothness
- Spanish language UI

**Data Migration:**
- Legacy `projectId` automatically migrated to `contextId` in use-tasks hook
- Firestore timestamps converted to Date objects in hooks

**Subscription Logic:**
- `checkSubscriptionStatus()` utility handles trial/active/expired/pending_cancellation logic
- Dashboard access controlled by subscription status
- Users with `pending_cancellation` maintain access until `subscriptionEndDate`
- Test users and admins bypass restrictions
- Toaster component in layout.tsx for global notifications

**Firebase Configuration:**
- Client-side config uses NEXT_PUBLIC_ env variables
- Server-side uses FIREBASE_SERVICE_ACCOUNT JSON
- Firestore security rules should restrict user data access

### Environment Variables Required

**Firebase (required):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON string for admin SDK)

**MercadoPago (required for subscriptions):**
- `MP_ACCESS_TOKEN` - MercadoPago access token
- `MP_PLAN_ID` - MercadoPago subscription plan ID

**Application:**
- `NEXT_PUBLIC_APP_URL` - Application base URL for redirects

**WhatsApp Integration (optional - for WhatsApp bot features):**
- `EVOLUTION_API_URL` - Evolution API base URL
- `EVOLUTION_API_KEY` - Evolution API authentication key
- `EVOLUTION_INSTANCE_NAME` - Your Evolution API instance name
- `OPENAI_API_KEY` - OpenAI API key for Whisper (audio transcription) and GPT-4 (task analysis)

### WhatsApp Integration

**Overview:**
The application integrates with WhatsApp via Evolution API to allow users to create tasks by sending text messages or voice notes. The system uses OpenAI's Whisper for audio transcription and GPT-4 for intelligent task processing.

**Architecture:**
```
WhatsApp → Evolution API → Webhook (/api/whatsapp/webhook) →
  → OpenAI Processing (transcription + analysis) →
  → Firestore (task creation)
```

**Key Features:**
1. **Account Linking System:**
   - Users generate a 6-digit code in the dashboard (Profile > WhatsApp tab)
   - Send the code to WhatsApp bot to link their account
   - Stored in `whatsappLinks` collection with userId mapping
   - Codes expire after 15 minutes

2. **Message Processing (Fase 1 - Captura Básica):**
   - Text messages: Direct processing to create tasks
   - Audio messages: Transcribed using Whisper API then processed
   - All messages create tasks in user's personal workspace (teamId: null)

3. **AI-Powered Task Analysis (Fase 2 - Procesamiento Inteligente):**
   - GPT-4 extracts: title, description, context, due date, estimated time, category, quick action flag
   - Natural language date parsing ("mañana", "próximo lunes", "en 3 días")
   - Context detection from keywords (e.g., "@compras" → compras context)
   - GTD category suggestion (default: "Inbox" for quick captures)
   - 2-minute rule detection (isQuickAction)
   - Confidence scoring (0-1) for AI suggestions

4. **Response System:**
   - Automatic confirmation messages sent back to WhatsApp
   - Shows extracted task details (title, category, context, date, time estimate)
   - Error messages for invalid codes, expired subscriptions, etc.

5. **Interactive Commands:**
   - `/ayuda` or `/help` - Shows available commands (no auth required)
   - `/menu` - Interactive button menu for quick actions
   - `/inbox` - View tasks in Inbox (up to 10)
   - `/hoy` - View tasks due today with times
   - `/proximas` - View next actions
   - Button responses automatically converted to commands
   - All commands (except /ayuda) require authenticated linked account

**Firestore Collections:**
- `whatsappLinks`: Stores WhatsApp number ↔ Firebase UID mappings
  - Fields: userId, whatsappNumber, linkCode, linkCodeExpiry, isActive, createdAt, updatedAt
- `tasks`: Tasks created from WhatsApp have standard Task schema
  - Source identified by description: "Creado desde WhatsApp por [name]"

**Implementation Files:**
- `/types/whatsapp.ts` - TypeScript types for WhatsApp integration
- `/lib/whatsapp-utils.ts` - Utility functions for account linking
- `/lib/openai-utils.ts` - OpenAI Whisper & GPT-4 integration
- `/app/api/whatsapp/webhook/route.ts` - Webhook endpoint for Evolution API
- `/components/profile/whatsapp-linking.tsx` - UI for account linking

**Subscription Requirements:**
- WhatsApp features only available to users with active/trial/test subscriptions
- Subscription check happens before processing each message
- Users with expired subscriptions receive notification to renew

**Security:**
- Webhook authenticated via Evolution API key header
- Phone numbers normalized to international format
- Link codes expire after 15 minutes
- Only active links can create tasks

### Build Configuration Notes

- TypeScript and ESLint errors ignored during builds (next.config.mjs)
- Images unoptimized for deployment compatibility
- Tailwind configured for multiple content directories
- Uses absolute imports with `@/*` path mapping
