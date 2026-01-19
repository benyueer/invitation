import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import RollingImage from '../pages/RollingImage'
import VortexGallery from '../pages/VortexGallery'
import RepeatingImageTransition from '@/pages/RepeatingImageTransition'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/rolling-image',
        element: <RollingImage />,
      },
      {
        path: '/vortex-gallery',
        element: <VortexGallery />,
      },
      {
        path: '/repeating-image-transition',
        element: <RepeatingImageTransition />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
