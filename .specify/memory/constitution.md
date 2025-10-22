<!--
==============================================================================
SYNC IMPACT REPORT
==============================================================================
Version: 0.0.0 → 1.0.0
Date: 2025-10-14

MAJOR version bump rationale: Initial constitution establishment for GTD Buddy project

Modified Principles:
- NEW: All principles established for first time

Added Sections:
- Core Principles (5 principles)
- Security & Compliance
- Quality Assurance
- Governance

Templates Status:
- ✅ plan-template.md: Constitution Check section aligned
- ✅ spec-template.md: Requirements sections aligned with principles
- ✅ tasks-template.md: Task categorization aligned with quality principles

Follow-up TODOs:
- None - all placeholders filled

==============================================================================
-->

# GTD Buddy Constitution

## Core Principles

### I. GTD Methodology Fidelity

The application MUST faithfully implement David Allen's Getting Things Done (GTD) methodology without deviation from core principles. This is NON-NEGOTIABLE.

**Rules:**
- All tasks MUST be categorized using the five standard GTD lists: "Inbox", "Próximas acciones" (Next Actions), "Multitarea" (Projects/Multi-step), "A la espera" (Waiting For), "Algún día" (Someday/Maybe)
- Context-based organization MUST be supported for filtering and organizing next actions
- The 2-minute rule MUST be supported through the `isQuickAction` flag
- Multi-step projects MUST support subtasks to track component actions
- Tasks MUST support due dates with time precision and estimated time in minutes
- NO artificial constructs (priority levels, energy levels, tags outside GTD contexts) shall be added without explicit user request and constitutional amendment

**Rationale:** GTD Buddy exists to help users implement GTD correctly. Deviating from the methodology confuses users and defeats the product's purpose. The methodology has been validated over decades; our job is faithful implementation, not reinvention.

### II. User Data Sovereignty

User task data MUST remain under the user's control and secured through proper authentication and authorization. Data privacy is NON-NEGOTIABLE.

**Rules:**
- All Firestore operations MUST filter by authenticated `userId`
- Firestore security rules MUST enforce row-level security preventing cross-user data access
- User authentication state MUST be verified before any data operations
- Server-side operations MUST use Firebase Admin SDK with proper token verification
- API routes MUST implement Bearer token authentication
- NO user data shall be shared, sold, or used for purposes beyond providing the GTD service
- Data exports MUST be available to users on request

**Rationale:** Trust is fundamental. Users store sensitive personal and professional information in their task lists. Any breach or unauthorized access destroys user trust and violates ethical obligations.

### III. Subscription-Based Business Model Integrity

The freemium subscription model with trial periods MUST be implemented fairly, transparently, and without dark patterns. Business practices MUST respect users.

**Rules:**
- New users MUST receive a 7-day trial period with full access
- Trial period can only be granted ONCE per user account (no trial abuse)
- Subscription status MUST be checked at application boundaries (dashboard, API routes)
- `pending_cancellation` status MUST maintain access until the paid period ends
- Test users (`role: "test"`) and admins bypass restrictions for development/support purposes
- Subscription enforcement MUST be server-side verified (never client-only)
- Users MUST receive clear notifications about subscription status changes (toast notifications)
- MercadoPago integration MUST properly handle cancellation using `end_date` to prevent unwanted renewals
- NO features shall be artificially degraded to push upgrades; trial = full access

**Rationale:** Ethical monetization builds sustainable business and loyal users. Dark patterns (fake urgency, trial abuse, surprise charges) may increase short-term revenue but destroy long-term trust and brand reputation.

### IV. Modern UI/UX Standards with Accessibility

The user interface MUST follow modern design patterns with glassmorphism aesthetics while maintaining accessibility and usability.

**Rules:**
- Centralized theme configuration MUST be maintained in `lib/theme.ts`
- Glassmorphism effects MUST use `backdrop-blur-xl bg-white/40` for consistency
- GTD category color palette MUST remain consistent (blue, green, purple, orange, amber)
- Modal overlays MUST use `bg-black/20 backdrop-blur-sm` for proper visibility
- Page transitions MUST be fade-only with 0.15s duration for smooth experience
- Spanish language MUST be the primary UI language (target market: Spanish speakers)
- Responsive design MUST work on mobile, tablet, and desktop
- Touch targets MUST be minimum 44x44px for mobile usability
- Keyboard navigation MUST be supported for all interactive elements
- Color contrast MUST meet WCAG AA standards minimum

**Rationale:** User experience directly impacts adoption and retention. Consistency reduces cognitive load. Accessibility is both ethical obligation and legal requirement in many jurisdictions. Modern aesthetics signal quality and professionalism.

### V. Type Safety and Data Migration

The codebase MUST maintain TypeScript type safety, and data migrations MUST be handled gracefully without user disruption.

**Rules:**
- All components, hooks, and utilities MUST have proper TypeScript types
- Type definitions MUST be centralized in `/types` directory
- Legacy data migrations MUST be handled automatically in hooks/services (e.g., `projectId` → `contextId`)
- Firestore timestamps MUST be converted to JavaScript Date objects in hooks
- Breaking schema changes MUST include migration code before production deployment
- Build-time type errors MUST be resolved before merging (even if build ignores them)
- API contracts between frontend/backend MUST use shared type definitions
- External API integrations (Firebase, MercadoPago) MUST have typed interfaces

**Rationale:** Type safety prevents runtime errors and improves developer productivity. Graceful migrations prevent user data loss and support tickets. The codebase currently ignores TypeScript errors during build (technical debt) but must not use this as excuse for poor typing.

## Security & Compliance

### Authentication & Authorization
- Firebase Auth MUST support both email/password and Google OAuth
- Server-side operations MUST use Firebase Admin SDK with service account credentials
- Environment variables MUST separate public (`NEXT_PUBLIC_*`) from secret values
- Service account JSON MUST be stored as `FIREBASE_SERVICE_ACCOUNT` environment variable
- API routes MUST verify authentication tokens before processing requests

### Data Protection
- User passwords MUST never be stored (Firebase Auth handles this)
- Environment variables MUST NOT be committed to version control
- Firestore security rules MUST be reviewed and updated with schema changes
- MercadoPago API keys MUST be server-side only (never exposed to client)
- All external API calls MUST use HTTPS

### Compliance Requirements
- GDPR: Users MUST be able to export/delete their data
- PCI: Payment processing MUST be handled by MercadoPago (no card storage)
- Cookie policy: Required for EU users (currently missing - TODO)
- Privacy policy: Required before production launch (currently missing - TODO)

## Quality Assurance

### Testing Strategy
- New features MUST include test plans in specification
- Critical user journeys (signup, subscription, task CRUD) MUST have integration tests
- Payment flows MUST be tested with MercadoPago sandbox before production
- Authentication flows MUST be tested with both email/password and Google OAuth

### Performance Standards
- Initial page load MUST be under 3 seconds on 3G connection
- Task list operations (add, edit, delete) MUST feel instant (<100ms perceived)
- Dashboard MUST render within 1 second of authentication
- Database queries MUST use proper indexing to avoid full collection scans

### Code Quality
- ESLint rules MUST be followed (linting issues resolved before merge)
- Component organization MUST follow established structure (`/components/ui/`, `/components/dashboard/`, etc.)
- Custom hooks MUST be used for reusable logic (see `/hooks` directory)
- Absolute imports MUST use `@/*` path mapping for cleaner imports

### Monitoring & Observability
- Firebase Analytics MUST track key user actions (signup, subscription events, task operations)
- Error logging MUST capture and report uncaught exceptions
- Subscription events MUST be logged for debugging and analytics
- Performance metrics MUST be collected for core user journeys

## Governance

### Amendment Process
1. Proposed changes MUST be documented with rationale
2. Changes affecting user experience or data model MUST be reviewed by product owner
3. Security-related changes MUST be reviewed by technical lead
4. Constitution version MUST be incremented following semantic versioning:
   - **MAJOR**: Backward incompatible changes, principle removal/redefinition
   - **MINOR**: New principles added, material expansions to guidance
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements
5. Template files (`.specify/templates/*.md`) MUST be updated to reflect constitutional changes
6. Sync Impact Report MUST be maintained at top of this file documenting changes

### Versioning Policy
- This constitution follows semantic versioning: `MAJOR.MINOR.PATCH`
- Version increments MUST be justified in commit messages
- Breaking changes MUST be clearly communicated to development team
- Version history MUST be maintained through git commits

### Compliance Review
- All pull requests MUST be reviewed for constitutional compliance
- Specification documents MUST reference relevant constitutional principles
- Plan documents MUST include Constitution Check section verifying compliance
- Implementation tasks MUST align with constitutional requirements
- Complexity violations MUST be explicitly justified in plan documents

### Development Workflow
- Feature specifications MUST be created in `/specs/[###-feature-name]/` structure
- Planning MUST follow `/speckit.plan` command workflow
- Tasks MUST follow `/speckit.tasks` command output structure
- Constitution MUST be consulted during `/speckit.specify`, `/speckit.plan`, and `/speckit.implement` workflows
- Runtime development guidance MUST reference `CLAUDE.md` for tool-specific instructions

### Enforcement
- The constitution supersedes all other development practices
- Constitutional violations in production MUST be treated as critical bugs
- Team members MUST be trained on constitutional requirements
- Regular audits MUST verify constitutional compliance in codebase

### Emergency Procedures
- Security vulnerabilities MAY bypass normal review process with post-facto documentation
- Production incidents MAY require temporary constitutional suspension with incident report
- Test user accounts (`role: "test"`) MAY bypass restrictions for debugging purposes

**Version**: 1.0.0 | **Ratified**: 2025-10-14 | **Last Amended**: 2025-10-14
