# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server on localhost:3003
npm run build      # Production build
npm run lint       # ESLint
npx playwright test                          # All E2E tests
npx playwright test e2e/foo.spec.ts          # Single E2E test
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:6001
NEXT_PUBLIC_APP_NAME=Bravos
```

## Architecture

### Route Groups

- `src/app/(protected)/` — authenticated tenant routes: dashboard, products, clients, invoices, pos, inventory, sales, reports, proformas, virtual-store, settings, users, suppliers
- `src/app/(superadmin)/superadmin/` — platform admin panel: companies, users, plans, payments, alerts, chats, mail, server, storage, whatsapp, worker-monitor
- `src/app/auth/` — login page (unauthenticated)

### State Management (Zustand)

25 stores in `src/stores/`, one per domain. Key stores:

- **authStore** — `user`, `token`, `currentCompany`, `isAuthenticated`. Persisted to `localStorage` under key `bravos-auth`. Multi-company: token + `X-Company-ID` header drive tenant scoping.
- **subscriptionStore** — active plan features and limits. Use `usePlanFeature()` / `usePlanLimit()` hooks from `src/hooks/usePlanFeature.ts` to gate UI by plan.
- **uiStore** — global loading state driven by API interceptors.

### API Layer

- `src/lib/api.ts` — Axios instance. Intercepts every request to inject Bearer token and `X-Company-ID`. Handles CSRF (419 retry), and 401 auto-logout. Do not create separate Axios instances; use this export.
- `src/utils/apiConfig.ts` — `getApiUrl()` / `getBaseUrl()` resolve the API and Sanctum base URLs from env.
- `src/services/` — thin wrappers over `api` for specific domains (auth, media, shipping, subscriptions, ubigeo, virtual store, super admin, etc.).

### UI Components

- `src/components/ui/` — shared primitives exported from `index.ts`: Button, Input, Select, Card, Modal, Table, Badge, Spinner, Alert, Avatar, Dropdown, Tabs, Pagination, Toggle, LaserLoader.
- `src/components/layouts/DashboardLayout.tsx` — main shell (sidebar, topbar, BottomNav, subscription banner, notification toast container).
- Domain components are colocated under `src/components/<domain>/` (products, invoices, pos, inventory, clients, etc.).

### Permissions & Plan Gating

- `useUserPermissions()` (`src/hooks/useUserPermissions.ts`) — derives `can.*` flags from Spatie roles/permissions on the user object. `superadmin` and `company_admin` roles bypass all permission checks.
- `usePlanFeature(feature)` / `usePlanLimit(resource)` — check plan-level feature flags and numeric limits from `subscriptionStore`.

### Real-time

Laravel Echo + Pusher.js configured in `src/lib/echo.ts`, connecting to Laravel Reverb WebSocket server. Used for notifications and live sale/stock events.
