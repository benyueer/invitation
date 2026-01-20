import { CaretLeftOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const back = () => {
    navigate(-1)
  }

  return (
    <div className=" bg-gray-50 text-gray-900 font-sans">
      <main className="container mx-auto">
        {location.pathname !== '/' && (
          <div
            className="fixed top-2 left-2 flex justify-between items-center gap-0 cursor-pointer z-[9999]"
            onClick={back}
            onTouchEnd={back}
          >
            <CaretLeftOutlined />
            <span className="text-sm text-gray-600">返回</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
