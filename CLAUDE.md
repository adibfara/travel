# CLAUDE.md

Travel packing planner: Google sign-in, add items (title required, weight/size optional in kg/L), live totals. One line per item, sleek on mobile + desktop.

## Stack

React 19 + TS strict, Vite 8 (`@vitejs/plugin-react` v6, oxc-based), React Compiler via `@rolldown/plugin-babel` + `reactCompilerPreset()` (not the old `babel` option — v6 dropped it). Tailwind v4 (`@tailwindcss/vite`, no config file — tokens in `src/index.css` `@theme`). shadcn/ui primitives hand-written into `src/components/ui/` (no CLI run — offline). TanStack Router (code-defined tree) + Query (provider only, unused by storage layer). Firebase v12 (Google auth + Firestore w/ offline persistence). Lint via `oxlint` (not ESLint).

## Commands

```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npx tsc --noEmit  # type-check only
```

## Structure

```
src/
  main.tsx                 # StrictMode > QueryClientProvider > ThemeProvider > AuthProvider > AuthGate > RouterProvider
  router.tsx                # single index route -> PackingList
  index.css
  lib/
    firebase.ts             # app, auth, googleProvider, db, requireUid()
    itemStorage.ts          # CRUD on users/{uid}/items, genId/createItem, totalWeight/totalCount/hiddenWeight
    receipt.ts               # canvas-rendered printable packing list (downloadReceipt), includes excluded-weight row when items are hidden
    utils.ts                # cn()
  shared/
    auth/                   # AuthProvider, useAuth, SignInScreen, AuthGate
    theme/                  # ThemeProvider, useTheme, ThemeToggle (localStorage key travelplanner-ui-theme)
  types/item.ts             # PackingItem { id, title, count, weight?, hidden?, order, lastModified }
  features/packing/
    hooks/usePackingItems.ts # addItem/updateItem/removeItem/importItems/reorderItems
    components/PackingList.tsx, AddItemRow.tsx, ItemRow.tsx, TotalsBar.tsx, ImportExportBar.tsx
  components/ui/            # button, input, card, dropdown-menu, sonner (hand-written shadcn primitives)
firestore.rules             # users/{uid}/** readable/writable only by that uid
```

## Firebase

- Real config live in `src/lib/firebase.ts` (project `stealjobsx`) — committed intentionally, it's a public client id; access control is `firestore.rules`, not secrecy.
- Deploy `firestore.rules` to the Firebase project (not yet automated here — no Firebase CLI wired up).
- Add every deploy domain to Firebase Console → Authentication → Authorized domains, or Google sign-in popup fails.
- Data lives at `users/{uid}/items/{id}`, single list per user (no multi-trip support).

## Conventions

- `ItemRow` autosaves on a debounced 800ms timer after edits — don't make it instant, matches architecture.md convention for editor screens.
- Storage layer (`itemStorage.ts`) splits async Firestore CRUD from sync pure factories/derivations (`genId`, `createItem`, `totalWeight`, `totalSize`) — keep new storage modules doing the same.
- `@/` alias → `src/`, configured in `vite.config.ts` + `tsconfig.app.json` (`paths`, no `baseUrl` — TS 6 deprecates it under bundler resolution).
- Don't hand-add `useMemo`/`useCallback` — React Compiler handles it.
