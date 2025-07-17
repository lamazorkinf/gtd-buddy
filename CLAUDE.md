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
- Priority levels: "baja", "media", "alta"
- Energy levels for task filtering
- Context-based organization (replaced legacy "projects")
- Weekly review system
- 2-minute rule support (isQuickAction)

**Authentication & Subscription Flow:**
- Firebase Auth with email/password and Google OAuth
- Trial period system (7 days for new users)
  - New users automatically get `subscriptionStatus: "trial"`
  - Trial starts on first login/signup (`trialStartDate`)
  - Trial expires after 7 days (`subscriptionEndDate`)
  - Users can only have one trial period per account
  - Use `/api/start-trial` to manually activate trial
- Subscription status verification throughout app
- Test users (role: "test") bypass all restrictions
- Auth context provides user, loading, and subscription status

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

**Custom Theming:**
- GTD-specific color palette in tailwind.config.ts
- Colors named by purpose: clarity, action, focus, lightness, confidence, neutral
- Spanish language UI

**Data Migration:**
- Legacy `projectId` automatically migrated to `contextId` in use-tasks hook
- Firestore timestamps converted to Date objects in hooks

**Subscription Logic:**
- `checkSubscriptionStatus()` utility handles trial/active/expired logic
- Dashboard access controlled by subscription status
- Test users and admins bypass restrictions

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

### Build Configuration Notes

- TypeScript and ESLint errors ignored during builds (next.config.mjs)
- Images unoptimized for deployment compatibility
- Tailwind configured for multiple content directories
- Uses absolute imports with `@/*` path mapping