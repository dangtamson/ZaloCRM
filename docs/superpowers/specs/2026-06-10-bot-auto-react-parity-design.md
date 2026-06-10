# Bot-Auto React Parity Design

## Objective

Rebuild the React Bot-Auto area so it reaches feature parity with the existing Vue Bot-Auto implementation while keeping the Vue frontend and Docker setup intact. The React implementation must use the existing backend API and preserve current route paths under `/automation/bot/*`.

## Current State

The Vue Bot-Auto implementation includes complete workflows for:

- Trigger catalog and configured triggers.
- Block library, folders, block editor, archive and duplicate actions.
- Sequence editor with ordered block steps and runtime rules.
- Broadcast creation, scheduling, pacing and lifecycle actions.
- Customer list creation/import, dry-run, archive, rescan and deletion.
- Customer list detail management with entry tabs, inline edit, bulk operations and undo.

The React Bot-Auto implementation currently provides route scaffolding and read-only tables only. It lacks most mutation workflows, editors and advanced list management.

## Scope

The React parity work will cover:

- API/type parity for all Phase 7 automation and customer-list endpoints used by Vue.
- A modern operational UI based on TailwindCSS, with dense tables, restrained cards, drawers/modals and clear command buttons.
- Full CRUD and lifecycle actions for triggers, blocks, sequences, broadcasts and customer lists.
- Customer-list detail operations: filters, pagination, inline edit, add rows, delete/undo and bulk resolve.
- Tests that verify API calls, route rendering and core user workflows.

The work will not:

- Remove or alter the Vue frontend.
- Change Docker production routing.
- Change backend behavior unless a React parity blocker exposes a confirmed backend bug.
- Recreate every cosmetic detail of Vuetify; React should match function and workflow, not component library internals.

## Architecture

React Bot-Auto will use a feature-local structure under `frontend-react/src/features/automation` for API helpers, hooks, shared UI, form utilities and workflow components. Existing routes in `frontend-react/src/pages/automation` will become thin page wrappers that call feature components. This avoids growing page files into Vue-sized monoliths and keeps each editor testable.

Shared UI will stay Tailwind-based and use existing project patterns:

- `apiClient` for HTTP.
- `useCrmResource` pattern where it fits, plus feature-specific hooks for mutation-heavy screens.
- `lucide-react` icons for actions.
- Existing `Card`, route shell and toast components when practical.

## Data And API

React will mirror the Vue API wrappers:

- Blocks: list/get/create/update/archive/unarchive/duplicate/delete, folder list/create/update/delete.
- Triggers: catalog/list/get/create/update/enable/disable/run/delete.
- Sequences: list/get/create/update/enable/disable/duplicate/delete.
- Broadcasts: list/get/create/update/preview/start/pause/resume/cancel/delete.
- Customer lists: list/get/dry-run/create/patch/archive/unarchive/rescan/delete.
- Customer list entries: list/create/update/delete/bulk actions.

Envelope parsing must tolerate the backend response keys already used in Vue: `blocks`, `folders`, `triggers`, `catalog`, `sequences`, `broadcasts`, `lists`, `entries`, `list`, `data`.

## UX Design

Bot-Auto is an operational tool, not a marketing surface. The UI should be dense, scan-friendly and predictable:

- Left navigation remains in Bot-Auto shell with clear active route state.
- Each screen has a toolbar with search/filter controls and primary create action.
- Tables have stable columns, status badges and row-level action buttons.
- Editors use side drawers or modal panels with explicit save/cancel buttons.
- Destructive actions require confirmation.
- Loading, empty and error states appear in-place and do not crash the route.

## Screen Requirements

### Triggers

- Show configured triggers and catalog tabs.
- Filter catalog by category and search.
- Create from catalog.
- Edit existing trigger.
- Choose binding kind: sequence, block or broadcast.
- Configure customer-list segment for birthday/list automation.
- Configure target group/user overrides for send-message blocks.
- Configure Telegram notification integration id when available.
- Enable/disable, manual run and delete trigger.

### Blocks

- Show folder sidebar, archive view and action type filter.
- Create folder inline.
- Create/edit blocks.
- Support action types currently supported by Vue: `request_friend`, `send_message`, `update_status`.
- For send-message blocks, support text variants, attachments, optional HTML image generation and AI image prompt.
- Duplicate, archive, unarchive and hard delete when allowed.

### Sequences

- Show searchable sequence list and editor panel.
- Add, remove, reorder and edit sequence steps using available blocks.
- Configure delay minutes per step.
- Configure runtime rules: allowed hour range, random delay per send, per-nick throttle, cross-nick recency and stop-on-accept.
- Save, enable/disable, duplicate and delete.

### Broadcasts

- Show broadcasts with state filters and state counts.
- Create/edit draft broadcasts.
- Choose send-message block.
- Configure segment: manual contact ids, filter criteria or customer list.
- Configure schedule: now or scheduled.
- Configure pacing rules.
- Start, pause, resume, cancel and delete where backend permits.

### Lists

- Show active, archived and all filters.
- Search lists.
- Create list using paste and file-import workflows.
- Dry-run input before create.
- Archive, unarchive, rescan and delete lists.
- Navigate to list detail.

### List Detail

- Show list counters and entry tabs.
- Search and paginate entries.
- Inline edit entry fields supported by backend.
- Add entries by pasted rows.
- Delete entry with short undo.
- Bulk resolve duplicate/invalid rows.
- Rename list where backend permits.
- Toggle visible columns and persist preference in localStorage.

## Testing Strategy

Tests will be added incrementally:

- API unit tests for each wrapper and envelope parser.
- Page workflow tests using axios adapter stubs for each screen.
- Component tests for complex editors: block editor, sequence step editor and list import modal.
- Existing full suite and build must stay green after each checkpoint.

## Acceptance Criteria

- All `/automation/bot/*` React routes support the same major workflows available in Vue.
- Existing Vue frontend remains untouched and runnable.
- `npm test` and `npm run build` pass in `frontend-react`.
- React dev server can run through the existing Vite proxy to backend port `3000`.
- The migration plan can mark Bot-Auto parity as completed once the above tests pass.
