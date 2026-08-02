import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { PackingList } from '@/features/packing/components/PackingList'

const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PackingList,
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree, basepath: '/travel' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
