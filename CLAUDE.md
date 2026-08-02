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
    itemStorage.ts          # CRUD on users/{uid}/items + users/{uid}/luggages, genId/createItem/createLuggage, totalWeight/totalCount, nextOrder (generic)
    receipt.ts               # canvas-rendered printable packing list (downloadReceipt), luggages stacked vertically with per-luggage + grand totals
    utils.ts                # cn()
  shared/
    auth/                   # AuthProvider, useAuth, SignInScreen, AuthGate
    theme/                  # ThemeProvider, useTheme, ThemeToggle (localStorage key travelplanner-ui-theme)
  types/item.ts             # PackingItem { id, title, count, weight?, luggageId, order, lastModified }
  types/luggage.ts          # Luggage { id, name, order, lastModified }
  features/packing/
    hooks/usePackingItems.ts # items+luggages load, addItem/updateItem/removeItem/importItems/reorderItems/moveItem/addLuggage/updateLuggage
    components/PackingList.tsx, LuggageColumn.tsx, AddLuggageDialog.tsx, AddItemRow.tsx, ItemRow.tsx, TotalsBar.tsx, ImportExportBar.tsx, ListHeader.tsx
  components/ui/            # button, input, card, dropdown-menu, sonner (hand-written shadcn primitives)
firestore.rules             # users/{uid}/** readable/writable only by that uid (covers both items and luggages collections)
```

## Firebase

- Real config live in `src/lib/firebase.ts` (project `stealjobsx`) — committed intentionally, it's a public client id; access control is `firestore.rules`, not secrecy.
- Deploy `firestore.rules` to the Firebase project (not yet automated here — no Firebase CLI wired up).
- Add every deploy domain to Firebase Console → Authentication → Authorized domains, or Google sign-in popup fails.
- Data lives at `users/{uid}/items/{id}` and `users/{uid}/luggages/{id}`, single trip per user (no multi-trip support) but multiple named luggages within it.

## Conventions

- Storage layer (`itemStorage.ts`) splits async Firestore CRUD from sync pure factories/derivations (`genId`, `createItem`, `createLuggage`, `totalWeight`, `totalCount`, `nextOrder`) — keep new storage modules doing the same.
- `@/` alias → `src/`, configured in `vite.config.ts` + `tsconfig.app.json` (`paths`, no `baseUrl` — TS 6 deprecates it under bundler resolution).
- Don't hand-add `useMemo`/`useCallback` — React Compiler handles it.
- Every `PackingItem` belongs to exactly one `Luggage` via `luggageId`. Luggages render as Trello-style columns (`LuggageColumn.tsx`) side by side; the page layout is intentionally NOT width-locked (no `max-w` on the root) so it grows/scrolls horizontally as luggages are added. A "Main" luggage is auto-created on first load if a user has none; items loaded without a `luggageId` (pre-luggage data) fall back to it in local state only — no bulk migration write.
- `ItemRow`'s chevrons (`ChevronLeft`/`ChevronRight`) move an item to the adjacent luggage; `LuggageColumn` computes which chevrons exist (`undefined` callback = no button rendered) from its position in the `luggages` array, so first/last luggages only show one side.
- Items can also move between luggages by dragging across columns — a single `DndContext` lives in `PackingList`, one `SortableContext` per `LuggageColumn` (also `useDroppable` so empty columns/columns shorter than the drag point are valid targets); `usePackingItems.reorderItems` is generic enough to persist both a same-column reorder and a cross-column move+reorder in one call, since the item objects it receives already carry their (possibly new) `luggageId`.
- Import/export (`ImportExportBar.tsx`) round-trips `luggage` as an optional **name** (not id) on `ImportedItem`. Export resolves `luggageId` → name; import matches case-insensitively against existing luggages and falls back to the currently-selected luggage if no match/omitted (no auto-create).
