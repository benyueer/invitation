import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import RollingImage from '../pages/RollingImage'

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
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
