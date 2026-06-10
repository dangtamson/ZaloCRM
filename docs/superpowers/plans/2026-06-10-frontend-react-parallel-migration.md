# Frontend React Parallel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new `frontend-react/` app in parallel with the current Vue frontend, then migrate routes and features module-by-module until React reaches parity and can replace the old build.

**Architecture:** Keep the existing `frontend/` app untouched during migration. Build `frontend-react/` as a separate Vite app that talks to the same backend API, sockets, and static asset paths, and port shared contracts first so each feature can move with minimal duplication. Migrate the shell, auth, and low-risk pages first; leave chat and automation for later because they carry the most state, realtime behavior, and UI complexity.

**Tech Stack:** React 18, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, Zustand, axios, socket.io-client, lucide-react, @tiptap/react, react-chartjs-2, chart.js, Radix UI primitives, Vitest, Testing Library, Playwright.

---

### Task 1: Scaffold `frontend-react`

**Files:**
- Create: `frontend-react/package.json`
- Create: `frontend-react/vite.config.ts`
- Create: `frontend-react/tsconfig.json`
- Create: `frontend-react/tsconfig.app.json`
- Create: `frontend-react/tsconfig.node.json`
- Create: `frontend-react/tailwind.config.ts`
- Create: `frontend-react/postcss.config.js`
- Create: `frontend-react/index.html`
- Create: `frontend-react/src/main.tsx`
- Create: `frontend-react/src/App.tsx`
- Create: `frontend-react/src/styles/globals.css`
- Create: `frontend-react/src/lib/storage.ts`
- Create: `frontend-react/src/types/index.ts`
- Create: `frontend-react/vitest.config.ts`
- Create: `frontend-react/playwright.config.ts`

- [ ] **Step 1: Create the React app shell**

Run:
```bash
cd frontend-react
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install the runtime and UI dependencies**

Run:
```bash
npm i react-router-dom @tanstack/react-query zustand axios socket.io-client lucide-react clsx tailwind-merge @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder chart.js react-chartjs-2 @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-switch
npm i -D tailwindcss postcss autoprefixer vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright
```

- [ ] **Step 3: Wire the app entry and global styles**

Add the following structure:
```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Verify the build works**

Run:
```bash
npm run build
```
Expected: Vite production build succeeds with the default React starter before any feature code lands.

---

### Task 2: Establish shared API, auth, and app state

**Files:**
- Create: `frontend-react/src/api/client.ts`
- Create: `frontend-react/src/api/auth.ts`
- Create: `frontend-react/src/api/license.ts`
- Create: `frontend-react/src/store/auth.ts`
- Create: `frontend-react/src/store/privacy.ts`
- Create: `frontend-react/src/store/rbac.ts`
- Create: `frontend-react/src/hooks/useMobile.ts`
- Create: `frontend-react/src/hooks/useTheme.ts`
- Create: `frontend-react/src/hooks/useFeatureFlags.ts`
- Create: `frontend-react/src/types/auth.ts`
- Create: `frontend-react/src/types/privacy.ts`
- Create: `frontend-react/src/types/rbac.ts`
- Create: `frontend-react/src/utils/route.ts`

- [ ] **Step 1: Port the axios client and JWT interceptor**

Mirror the current behavior from `frontend/src/api/index.ts`: use `/api/v1` as base URL, attach `Authorization: Bearer <token>` from `localStorage`, and redirect to `/login` on `401` unless the current route is `/login` or `/setup`.

- [ ] **Step 2: Port auth session behavior**

Mirror `frontend/src/stores/auth.ts`: support `login`, `setup`, `fetchProfile`, `logout`, `init`, `isAuthenticated`, `isOwner`, and `isAdmin`, and persist the token in `localStorage`.

- [ ] **Step 3: Port privacy and RBAC state**

Move the minimum state needed for privacy unlock, role checks, and settings visibility into React stores so the layout and page guards can read the same flags without reaching into component state.

- [ ] **Step 4: Add store and API tests**

Create:
```ts
// frontend-react/tests/unit/auth-store.test.ts
// frontend-react/tests/unit/api-client.test.ts
```

Verify:
- token is attached to API requests
- `401` clears the token
- `login` and `fetchProfile` hydrate the store

---

### Task 3: Build the React shell and routing layer

**Files:**
- Create: `frontend-react/src/router.tsx`
- Create: `frontend-react/src/layouts/DefaultLayout.tsx`
- Create: `frontend-react/src/layouts/AuthLayout.tsx`
- Create: `frontend-react/src/layouts/MobileLayout.tsx`
- Create: `frontend-react/src/components/navigation/TopNav.tsx`
- Create: `frontend-react/src/components/navigation/Sidebar.tsx`
- Create: `frontend-react/src/components/navigation/GlobalSearch.tsx`
- Create: `frontend-react/src/components/navigation/NotificationBell.tsx`
- Create: `frontend-react/src/components/navigation/ExtensionSlot.tsx`
- Create: `frontend-react/src/components/ui/ToastContainer.tsx`
- Create: `frontend-react/src/components/ui/Dialog.tsx`
- Create: `frontend-react/src/components/ui/Menu.tsx`
- Create: `frontend-react/src/components/ui/Button.tsx`
- Create: `frontend-react/src/components/ui/Input.tsx`
- Create: `frontend-react/src/components/ui/Card.tsx`

- [ ] **Step 1: Port the route map**

Recreate the current route groups from `frontend/src/router/index.ts`:
- auth: `/login`, `/setup`
- app shell: dashboard, chat, contacts, profile, appointments, reports, analytics, friends, groups
- settings subtree: personal, org, RBAC, CRM, channels, dev
- automation subtree: legacy `/automation` and `/automation/bot/*`
- special pages: customer activity, contact profile, stuck leads, not found

- [ ] **Step 2: Port layout selection**

Mirror `frontend/src/App.vue`: choose auth layout for auth pages, mobile layout for narrow screens, default layout otherwise, and refresh privacy status once the authenticated user is known.

- [ ] **Step 3: Port the top bar behavior**

Replicate the current top navigation semantics from `frontend/src/layouts/DefaultLayout.vue`: workspace selector, primary tabs, settings menu, theme toggle, global search, notification bell, and user avatar menu.

- [ ] **Step 4: Add shell smoke tests**

Create:
```ts
// frontend-react/tests/smoke/layout-routing.spec.ts
// frontend-react/tests/smoke/auth-guard.spec.ts
```

Verify:
- unauthenticated users land on `/login`
- `/settings?tab=scoring` and other legacy redirects resolve correctly
- mobile and desktop layouts switch by viewport

---

### Task 4: Port auth, setup, and profile pages first

**Files:**
- Create: `frontend-react/src/pages/LoginPage.tsx`
- Create: `frontend-react/src/pages/SetupPage.tsx`
- Create: `frontend-react/src/pages/ProfilePage.tsx`
- Create: `frontend-react/src/pages/NotFoundPage.tsx`
- Create: `frontend-react/src/components/forms/LoginForm.tsx`
- Create: `frontend-react/src/components/forms/SetupForm.tsx`
- Create: `frontend-react/src/components/profile/ProfileEditor.tsx`
- Create: `frontend-react/src/components/profile/PasswordForm.tsx`

- [ ] **Step 1: Port login and setup flows**

Match the current backend calls from `frontend/src/views/LoginView.vue` and `frontend/src/views/SetupView.vue`, including validation, loading state, error handling, and redirect after success.

- [ ] **Step 2: Port profile and password change**

Implement the personal profile page and password form with the same backend contract used by the Vue app.

- [ ] **Step 3: Add page-level tests**

Create:
```ts
// frontend-react/tests/pages/login-page.spec.tsx
// frontend-react/tests/pages/setup-page.spec.tsx
```

Verify:
- successful login writes token and navigates to the app shell
- setup flow creates the first organization/admin account

---

### Task 5: Port dashboard, reports, and analytics

**Files:**
- Create: `frontend-react/src/pages/DashboardPage.tsx`
- Create: `frontend-react/src/pages/ReportsPage.tsx`
- Create: `frontend-react/src/pages/AnalyticsPage.tsx`
- Create: `frontend-react/src/components/dashboard/KpiCards.tsx`
- Create: `frontend-react/src/components/dashboard/MessageVolumeChart.tsx`
- Create: `frontend-react/src/components/dashboard/PipelineChart.tsx`
- Create: `frontend-react/src/components/analytics/ResponseTimeChart.tsx`
- Create: `frontend-react/src/components/analytics/ConversionFunnelChart.tsx`
- Create: `frontend-react/src/components/analytics/TeamLeaderboard.tsx`
- Create: `frontend-react/src/components/analytics/ReportBuilder.tsx`

- [ ] **Step 1: Port chart rendering and card layouts**

Use `react-chartjs-2` and the same backend report payloads already used by the Vue charts.

- [ ] **Step 2: Port report builder and saved report actions**

Keep the same filtering, save, run, and delete flows from the current Vue implementation.

- [ ] **Step 3: Add regression tests**

Create:
```ts
// frontend-react/tests/pages/analytics-page.spec.tsx
// frontend-react/tests/pages/reports-page.spec.tsx
```

Verify the charts render with mocked data and the report builder can submit a saved report name.

---

### Task 6: Port settings, RBAC, and admin pages

**Files:**
- Create: `frontend-react/src/pages/settings/SettingsLayout.tsx`
- Create: `frontend-react/src/pages/settings/PersonalProfilePage.tsx`
- Create: `frontend-react/src/pages/settings/PersonalPasswordPage.tsx`
- Create: `frontend-react/src/pages/settings/SettingsComingSoon.tsx`
- Create: `frontend-react/src/pages/rbac/DepartmentsPage.tsx`
- Create: `frontend-react/src/pages/rbac/PermissionGroupsPage.tsx`
- Create: `frontend-react/src/pages/rbac/UsersPage.tsx`
- Create: `frontend-react/src/components/rbac/DepartmentEditPanel.tsx`
- Create: `frontend-react/src/components/rbac/PermissionGroupEditPanel.tsx`
- Create: `frontend-react/src/components/rbac/UserEditPanel.tsx`
- Create: `frontend-react/src/components/settings/OrgSettings.tsx`
- Create: `frontend-react/src/components/settings/CrmTagManagement.tsx`
- Create: `frontend-react/src/components/settings/StatusManagement.tsx`
- Create: `frontend-react/src/components/settings/ZaloLabelsManagement.tsx`
- Create: `frontend-react/src/components/settings/UserManagement.tsx`

- [ ] **Step 1: Port the settings subtree**

Recreate the current nested menu and redirects from `frontend/src/router/index.ts` and `frontend/src/composables/use-settings-nav.ts`.

- [ ] **Step 2: Port the RBAC screens**

Move the department, permission-group, and user assignment pages together so the shared tree state and edit panels stay consistent.

- [ ] **Step 3: Add admin smoke tests**

Create:
```ts
// frontend-react/tests/smoke/settings-routing.spec.ts
// frontend-react/tests/smoke/rbac-pages.spec.ts
```

Verify deep links under `/settings/*` resolve and preserve the legacy redirects.

---

### Task 7: Port CRM core modules

**Files:**
- Create: `frontend-react/src/pages/ContactsPage.tsx`
- Create: `frontend-react/src/pages/FriendsPage.tsx`
- Create: `frontend-react/src/pages/GroupsPage.tsx`
- Create: `frontend-react/src/pages/ZaloAccountsPage.tsx`
- Create: `frontend-react/src/pages/AppointmentsPage.tsx`
- Create: `frontend-react/src/pages/StuckLeadsPage.tsx`
- Create: `frontend-react/src/pages/CustomerActivityLogPage.tsx`
- Create: `frontend-react/src/pages/ContactProfilePage.tsx`
- Create: `frontend-react/src/components/contacts/ContactColumnToggle.tsx`
- Create: `frontend-react/src/components/contacts/ContactDetailDialog.tsx`
- Create: `frontend-react/src/components/contacts/DuplicateReviewDialog.tsx`
- Create: `frontend-react/src/components/friends/FriendsTable.tsx`
- Create: `frontend-react/src/components/friends/FriendsFilterBar.tsx`
- Create: `frontend-react/src/components/groups/GroupList.tsx`
- Create: `frontend-react/src/components/groups/GroupDetailPanel.tsx`
- Create: `frontend-react/src/components/zalo-accounts/AccountsTable.tsx`
- Create: `frontend-react/src/components/zalo-accounts/AccountDetailDrawer.tsx`
- Create: `frontend-react/src/components/appointments/AppointmentsListView.tsx`
- Create: `frontend-react/src/components/appointments/AppointmentEditor.tsx`

- [x] **Step 1: Port the lower-risk list views**

Start with contacts, friends, groups, and Zalo accounts so list/table rendering, filters, and drawers are proven before chat and automation.

- [x] **Step 2: Port appointments and stuck leads**

Move calendar/list interactions, filters, and the stuck-leads workflow after the core CRUD screens are stable.

- [x] **Step 3: Add list/detail tests**

Create:
```ts
// frontend-react/tests/pages/contacts-page.spec.tsx
// frontend-react/tests/pages/friends-page.spec.tsx
// frontend-react/tests/pages/groups-page.spec.tsx
```

Verify column toggles, drawer opening, and deep-link rendering behave like the current app.

---

### Task 8: Port automation modules last among the non-chat areas

**Files:**
- Create: `frontend-react/src/pages/automation/AutomationPage.tsx`
- Create: `frontend-react/src/pages/automation/BotAutoShell.tsx`
- Create: `frontend-react/src/pages/automation/TriggersPage.tsx`
- Create: `frontend-react/src/pages/automation/BlocksPage.tsx`
- Create: `frontend-react/src/pages/automation/SequencesPage.tsx`
- Create: `frontend-react/src/pages/automation/BroadcastsPage.tsx`
- Create: `frontend-react/src/pages/automation/ListsPage.tsx`
- Create: `frontend-react/src/pages/automation/ListDetailPage.tsx`
- Create: `frontend-react/src/components/automation/RuleBuilder.tsx`
- Create: `frontend-react/src/components/automation/ActionEditor.tsx`
- Create: `frontend-react/src/components/automation/ConditionEditor.tsx`
- Create: `frontend-react/src/components/automation/TemplateManager.tsx`
- Create: `frontend-react/src/components/automation/phase7/BlockEditorDialog.tsx`
- Create: `frontend-react/src/components/automation/phase7/SequenceStepEditor.tsx`

- [x] **Step 1: Port the legacy automation page**

Keep `/automation` working as the legacy rules/templates entry so existing deep links do not break.

- [x] **Step 2: Port the Bot-Auto shell**

Recreate the nested `/automation/bot/*` routes, especially the list detail grid and the phase 7 editors.

- [x] **Step 3: Add automation regression tests**

Create:
```ts
// frontend-react/tests/pages/automation-list-detail.spec.tsx
// frontend-react/tests/pages/bot-auto-shell.spec.tsx
```

Verify the detail table, column toggles, and row editing still work with mocked backend data.

---

### Task 9: Port chat and realtime behavior last

**Files:**
- Create: `frontend-react/src/pages/ChatPage.tsx`
- Create: `frontend-react/src/components/chat/MessageThread.tsx`
- Create: `frontend-react/src/components/chat/ConversationList.tsx`
- Create: `frontend-react/src/components/chat/ConversationFilterSidebar.tsx`
- Create: `frontend-react/src/components/chat/ChatContactPanel.tsx`
- Create: `frontend-react/src/components/chat/NotesSection.tsx`
- Create: `frontend-react/src/components/chat/TagCrmBar.tsx`
- Create: `frontend-react/src/components/chat/rich-text-editor.tsx`
- Create: `frontend-react/src/components/chat/message-bubble.tsx`
- Create: `frontend-react/src/hooks/useChat.ts`
- Create: `frontend-react/src/hooks/useConversationCache.ts`
- Create: `frontend-react/src/hooks/useFriendSocket.ts`
- Create: `frontend-react/src/hooks/useZaloPresence.ts`
- Create: `frontend-react/src/hooks/usePrivacyVisibility.ts`

- [x] **Step 1: Port the conversation list and message thread**

Use the existing Vue module as the contract reference for caching, pagination, message ordering, read receipts, reaction display, and reply rendering.

- [x] **Step 2: Port socket-driven updates**

Recreate the current socket.io listeners for conversations, presence, and message updates before moving on to richer message tools.

- [x] **Step 3: Port composer tools and privacy blur**

Move rich text, emoji/sticker/voice inputs, and privacy unlock behavior together so the composer state and redaction rules stay aligned.

- [x] **Step 4: Add realtime tests**

Create:
```ts
// frontend-react/tests/pages/chat-page.spec.tsx
// frontend-react/tests/hooks/chat-socket.spec.ts
```

Verify conversation switching, unread counts, reply rendering, and socket updates against mocked events.

---

### Task 10: Cut over build, static assets, and deprecate Vue frontend

**Files:**
- Modify: `docker/Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `README.md`
- Modify: `frontend/README.md`
- Create: `frontend-react/README.md`
- Create: `frontend-react/src/assets/brand/*`
- Create: `frontend-react/src/assets/tokens.css` or equivalent Tailwind token source if the migration keeps a token file for reference
- Delete or archive: `frontend/src` only after parity and sign-off

- [ ] **Step 1: Switch production frontend build**

Update the Docker build stage so the production image builds `frontend-react` and copies its output to the same static directory currently served by the backend.

- [x] **Step 2: Align deployment and local dev docs**

Document the new dev command, expected ports, and the cutover path from Vue to React so the team can run both apps during the transition.

- [ ] **Step 3: Remove Vue-only dependencies after parity**

Remove Vuetify, Vue Router, Pinia, and Vue-specific build tooling only after the React app covers the required routes and the smoke tests pass.

- [ ] **Step 4: Final verification**

Run:
```bash
cd frontend-react
npm run build
npm run test
npm run playwright:test
```

Expected:
- production build succeeds
- unit tests pass
- smoke tests pass on the critical routes
