# ARCHITECTURE.md

Reusable technical blueprint for a client-side React SPA with Firebase (Google auth + Firestore), shadcn/ui, and Tailwind v4. Domain-agnostic — no business logic described here, only the scaffold. Use this as a starting template for a new app of the same shape.

## Stack

- **React 19** + **TypeScript** (strict), built with **Vite 7** (`@vitejs/plugin-react`).
- **React Compiler** enabled (`babel-plugin-react-compiler`) — do not hand-add `useMemo`/`useCallback` for perf; the compiler memoizes. Keep them only where semantically required.
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` — config lives in CSS `@theme`).
- **shadcn/ui** components (Radix + `class-variance-authority`), copied into `src/components/ui/`.
- **@tanstack/react-router** — code-defined route tree (not file-based).
- **@tanstack/react-query** — provider wired at root (available for server-state; storage layer here does not use it).
- **Firebase v12** — Auth (Google) + Firestore with offline persistence.
- **lucide-react** icons, **sonner** toasts, **@dnd-kit** drag-and-drop, **date-fns** dates.
- **Geist** variable font via `@fontsource-variable/geist`.
- No test suite. Lint via ESLint 9 flat config + `typescript-eslint`.

## Commands

```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build  → dist/
npm run lint      # eslint .
npx tsc --noEmit  # type-check only
```

## Folder structure

```
src/
  main.tsx                 # root render; provider nesting
  router.tsx               # route tree (code-defined)
  index.css                # tailwind import + @theme tokens + light/dark vars
  vite-env.d.ts
  components/ui/           # shadcn/ui primitives (generated, editable)
  lib/                     # cross-cutting non-UI: firebase.ts, utils.ts, *Storage.ts
  hooks/                   # shared hooks (e.g. use-mobile)
  shared/                  # app-wide concerns, feature-agnostic
    auth/                  # AuthProvider, useAuth, AuthGate, SignInScreen
    theme/                 # ThemeProvider, useTheme, ThemeToggle
  types/                   # shared TS types / data models
  features/<feature>/      # one folder per domain feature
    components/            # feature UI (and nested editor/ subfolders)
    hooks/                 # feature-local hooks
```

Rules:
- **`components/ui/`** = shadcn primitives only. App code imports from here; do not put feature logic in it.
- **`shared/`** = cross-feature app concerns (auth, theme). **`features/`** = domain slices, self-contained.
- **`lib/`** = non-React utilities and the persistence layer.
- Path alias `@/` → `src/` (set in `vite.config`, `tsconfig`, and `components.json`).

## Provider nesting (`main.tsx`)

Order matters — outer to inner:

```
StrictMode
  QueryClientProvider          # react-query
    ThemeProvider              # light/dark, writes .dark class on <html>
      AuthProvider             # firebase auth state
        AuthGate               # gates render on auth state
          RouterProvider       # app routes
```

`AuthGate` is the choke point: shows a spinner while auth resolves, a sign-in screen when signed out, and children only when authenticated. Everything below it can assume a signed-in user.

## Firebase integration

Single init module `src/lib/firebase.ts` exports `app`, `auth`, `googleProvider`, `db`, and a `requireUid()` helper.

- **Config is hardcoded and committed.** The web config (`apiKey`, `authDomain`, `projectId`, …) is a public client identifier, not a secret. Access control is enforced by **Firestore security rules**, not by hiding config. No `.env`.
- **Firestore offline persistence**: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })` — survives reloads, multi-tab safe.
- `requireUid()` returns `auth.currentUser?.uid` or throws — call it in every storage function to scope reads/writes to the current user.

### Auth (`src/shared/auth/`)

- `AuthProvider` — subscribes to `onAuthStateChanged`, exposes `{ user, loading, signIn, signOut }` via context. `signIn` = `signInWithPopup(auth, googleProvider)`.
- `useAuth()` — context hook, throws if used outside provider.
- `SignInScreen` — shown when signed out.
- `AuthGate` — spinner while `loading`; `SignInScreen` when `!user`; children when signed in. Also the place to run a **one-time per-user migration/bootstrap** (guarded by a ref keyed on `user.uid` + a persisted flag).

### Firestore data layout

Per-user scoping convention:

```
users/{uid}/<collection>/{docId}
users/{uid}/settings/prefs      # single doc for user preferences/flags
```

Every entity carries a string `id` generated client-side (`genId()`), reused as the Firestore doc id — makes `setDoc` idempotent upserts.

### Storage layer pattern (`src/lib/*Storage.ts`)

- One module per collection. **Async** CRUD returning Promises: `get*`, `getAll*`, `save*`, `delete*` (Firestore `getDoc`/`getDocs`/`setDoc`/`deleteDoc`).
- **Pure factories stay sync**: `genId()`, `create*(...)` build in-memory objects; derivations over already-loaded lists are pure functions, not reads.
- `save*` stamps `lastModified: Date.now()` on write.
- Components own local state and `await` these calls directly (no react-query wrapping in this template). Editor-style screens use **debounced autosave** (~800ms).

### Deploy notes

- SPA host (Netlify/Vercel/etc.) needs a catch-all rewrite `/* → /index.html` for client routing. Netlify: `netlify.toml` (`build → dist`) or `public/_redirects`.
- **Every live domain must be added to Firebase → Authentication → Settings → Authorized domains**, or Google sign-in popup fails.

## Routing (`src/router.tsx`)

Code-defined tree with `createRootRoute` + `createRoute`, assembled via `rootRoute.addChildren([...])`, then `createRouter({ routeTree })`. Root route renders `<Outlet />`. Params via `$param` in the path. Register the router type through module augmentation for typed navigation:

```ts
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
```

## UI & theming

### shadcn/ui

- Config in `components.json` (style, base color `neutral`, `cssVariables: true`, lucide icons, aliases). Components generated into `src/components/ui/` and freely editable.
- `cn()` in `src/lib/utils.ts` = `twMerge(clsx(...))` — use for all conditional/merged class names.
- Chrome/UI uses Tailwind utility classes bound to shadcn tokens: `bg-card`, `text-muted-foreground`, `border`, `bg-background`, etc. Prefer tokens over raw colors so light/dark just work.

### Tailwind v4 theming (`src/index.css`)

- Config lives in CSS, not JS. Imports: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`, the Geist font.
- `@custom-variant dark (&:is(.dark *))` — dark mode is **class-based** (`.dark` on `<html>`).
- `@theme inline { ... }` defines design tokens (sizes, text scale, font weights, line-height, radius scale, shadows, transitions) as CSS vars usable as Tailwind utilities.
- Light/dark color values are defined as CSS variables and swapped by the `.dark` class.

### Theme switching (`src/shared/theme/`)

- `ThemeProvider` — `'light' | 'dark' | 'system'`, persisted to `localStorage` (key e.g. `project-ui-theme`), toggles `.light`/`.dark` on `document.documentElement`; `system` follows `matchMedia('(prefers-color-scheme: dark)')`.
- `useTheme()` context hook; `ThemeToggle` UI control.

## Conventions to carry over

- Per-user Firestore scoping via `requireUid()` in every storage call.
- Client-generated ids reused as doc ids; `setDoc` for upserts.
- Async storage modules + sync pure factories, cleanly separated.
- Debounced autosave for editor screens.
- `@/` alias everywhere; feature-sliced `features/`, shared concerns in `shared/`, primitives in `components/ui/`.
- Token-based styling (shadcn vars) so theming is free; never hardcode colors in app chrome.
- Commit the Firebase web config; rely on security rules + authorized domains for safety.
