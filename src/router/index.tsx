import type { ComponentType } from 'react'
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Anmi from '@/pages/Anmi'
import MainLayout from '../layout/MainLayout'

const Home = lazy(() => import('../pages/Home'))
const NotFound = lazy(() => import('../pages/NotFound'))
const RollingImage = lazy(() => import('../pages/RollingImage'))
const VortexGallery = lazy(() => import('../pages/VortexGallery'))
const RepeatingImageTransition = lazy(() => import('@/pages/RepeatingImageTransition'))
const Hero = lazy(() => import('@/pages/Hero'))
const InfinityCanvas = lazy(() => import('../pages/InfinityCanvas'))
const Magazine = lazy(() => import('../pages/Magazine'))

// Simple loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  )
}

function withSuspense(Component: ComponentType<any>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const showPages = [
  {
    name: 'Rolling Image',
    path: '/rolling-image',
    element: withSuspense(RollingImage),
  },
  {
    name: 'Vortex Gallery',
    path: '/vortex-gallery',
    element: withSuspense(VortexGallery),
  },
  {
    name: 'Repeating Image Transition',
    path: '/repeating-image-transition',
    element: withSuspense(RepeatingImageTransition),
  },
  {
    name: 'Hero',
    path: '/hero',
    element: withSuspense(Hero),
  },
  {
    name: 'Infinity Canvas',
    path: '/infinity-canvas',
    element: withSuspense(InfinityCanvas),
  },
  {
    name: 'Magazine',
    path: '/magazine',
    element: withSuspense(Magazine),
  },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: withSuspense(Home),
      },
      {
        path: '/anmi',
        element: withSuspense(Anmi),
      },
      ...showPages,
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
])
