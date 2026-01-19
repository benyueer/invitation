import { CaretLeftOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <main className="container h-screen mx-auto px-4 py-8">
        {location.pathname !== '/' && (
          <div className="fixed top-2 left-2 flex justify-between items-center gap-0 cursor-pointer z-9999" onClick={() => navigate(-1)}>
            <CaretLeftOutlined />
            <span className="text-sm text-gray-600">返回</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
