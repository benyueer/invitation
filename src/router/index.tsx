import { createBrowserRouter } from 'react-router-dom'
import Hero from '@/pages/Hero'
import RepeatingImageTransition from '@/pages/RepeatingImageTransition'
import MainLayout from '../layout/MainLayout'
import Home from '../pages/Home'
import InfinityCanvas from '../pages/InfinityCanvas'
import Magazine from '../pages/Magazine'
import NotFound from '../pages/NotFound'
import RollingImage from '../pages/RollingImage'
import VortexGallery from '../pages/VortexGallery'

export const showPages = [
  {
    name: 'Rolling Image',
    path: '/rolling-image',
    element: <RollingImage />,
  },
  {
    name: 'Vortex Gallery',
    path: '/vortex-gallery',
    element: <VortexGallery />,
  },
  {
    name: 'Repeating Image Transition',
    path: '/repeating-image-transition',
    element: <RepeatingImageTransition />,
  },
  {
    name: 'Hero',
    path: '/hero',
    element: <Hero />,
  },
  {
    name: 'Infinity Canvas',
    path: '/infinity-canvas',
    element: <InfinityCanvas />,
  },
  {
    name: 'Magazine',
    path: '/magazine',
    element: <Magazine />,
  },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      ...showPages,
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
