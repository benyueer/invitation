import {
  CameraOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FormOutlined,
  HeartOutlined,
  MessageOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Input, message, Modal } from 'antd'
import gsap from 'gsap'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { openMap } from '@/utils'

const THEMES = {
  GOLD: {
    name: '浅金',
    primary: '#D4AF37',
    bg: 'rgba(255, 255, 255, 0.8)',
    cardBg: 'rgba(255, 255, 255, 0.6)',
    text: '#5D4037',
    border: 'rgba(212, 175, 55, 0.3)',
    overlay:
      'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.6) 100%)',
  },
  RED: {
    name: '红金',
    primary: '#FFD700',
    bg: 'rgba(139, 0, 0, 0.8)',
    cardBg: 'rgba(139, 0, 0, 0.6)',
    text: '#FFFFFF',
    border: 'rgba(255, 215, 0, 0.3)',
    overlay:
      'linear-gradient(180deg, rgba(139, 0, 0, 0.3) 0%, rgba(139, 0, 0, 0.7) 100%)',
  },
}

const CARDS = [
  { name: '我们的故事', path: '/hero', icon: <HeartOutlined /> },
  { name: '婚礼相册', path: '/vortex-gallery', icon: <CameraOutlined /> },
  {
    name: '婚礼视频',
    path: '/repeating-image-transition',
    icon: <VideoCameraOutlined />,
  },
  { name: '宾客须知', path: '/infinity-canvas', icon: <FileTextOutlined /> },
  { name: '婚礼签到', path: '/rolling-image', icon: <FormOutlined /> },
  { name: '祝福留言', path: '/magazine', icon: <MessageOutlined /> },
]

export default function Home() {
  const navigate = useNavigate()
  const [theme] = useState(THEMES.GOLD)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    name: '',
    message: '',
  })

  useEffect(() => {
    // 禁用双指缩放手势补救（虽然 meta 标签已有设置）
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchstart', handleTouch, { passive: false })
    return () => document.removeEventListener('touchstart', handleTouch)
  }, [])

  useEffect(() => {
    gsap.to('.home-container', {
      backgroundColor: theme.bg,
      duration: 1,
      ease: 'power2.inOut',
    })
  }, [theme])

  const handleContactSubmit = () => {
    if (!contactInfo.name || !contactInfo.message) {
      message.error('请填写姓名或留言')
      return
    }
    message.success('发送成功，我们将尽快联系您！')
    setIsContactModalOpen(false)
    setContactInfo({ name: '', message: '' })
  }

  return (
    <div className="h-screen overflow-auto relative w-full flex flex-col items-center font-sans select-none">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: 'url("/mock.webp")' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: theme.overlay }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center px-6 pt-16 pb-12 text-center">
        <h1
          className="text-4xl italic mb-2 tracking-widest drop-shadow-md"
          style={{ color: theme.primary, fontFamily: 'serif' }}
        >
          Welcome to
        </h1>
        <h2
          className="text-5xl font-light mb-8 drop-shadow-md"
          style={{ color: theme.primary, fontFamily: 'serif' }}
        >
          Our Wedding
        </h2>

        <div
          className="w-full h-px mb-6 opacity-30"
          style={{ background: theme.primary }}
        />

        <p className="text-xl mb-1 font-medium" style={{ color: theme.text }}>
          2026年10月15日
        </p>
        <p className="text-lg mb-4 opacity-80" style={{ color: theme.text }}>
          下午 3:00
        </p>

        <a
          onClick={() => openMap('上海 · 外滩华尔道夫大酒店')}
          className="flex items-center space-x-2 text-base mb-8 transition-opacity active:opacity-60 no-underline"
          style={{ color: theme.text }}
        >
          <EnvironmentOutlined style={{ color: theme.primary }} />
          <span className="border-b" style={{ borderColor: theme.border }}>
            上海 · 外滩华尔道夫大酒店
          </span>
        </a>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-12">
          {CARDS.map(card => (
            <div
              key={card.name}
              onClick={() => navigate(card.path)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-lg shadow-xl transition-all active:scale-95 hover:shadow-2xl cursor-pointer"
              style={{
                background: theme.cardBg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div className="text-3xl mb-3" style={{ color: theme.primary }}>
                {card.icon}
              </div>
              <span className="text-sm font-medium tracking-widest">
                {card.name}
              </span>
            </div>
          ))}
        </div>

        {/* Contact Us Section */}
        <div className="w-full flex flex-col items-center">
          <div
            className="flex items-center space-x-2 mb-4 opacity-80"
            style={{ color: theme.text }}
          >
            <PhoneOutlined />
            <span className="text-lg font-light italic">Contact Us</span>
          </div>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="w-full py-3 rounded-xl border flex items-center justify-center space-x-2 backdrop-blur-md shadow-lg transition-all active:scale-95 active:brightness-90"
            style={{
              background: `linear-gradient(to right, ${theme.primary}22, ${theme.primary}44)`,
              borderColor: theme.primary,
              color: theme.text,
              fontSize: '1.1rem',
              fontWeight: 500,
            }}
          >
            <span>联系我们</span>
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        title={(
          <div
            className="text-center w-full text-xl py-2"
            style={{ color: theme.text }}
          >
            联系我们
          </div>
        )}
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        onOk={handleContactSubmit}
        okText="发送"
        cancelText="取消"
        centered
        styles={{
          body: {
            background: theme.bg,
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: `1px solid ${theme.border}`,
            padding: '20px',
          },
          mask: {
            backdropFilter: 'blur(4px)',
          },
          header: { background: 'transparent', borderBottom: 'none' },
          footer: { borderTop: 'none' },
        }}
        okButtonProps={{
          style: {
            background: theme.primary,
            borderColor: theme.primary,
            height: '40px',
            borderRadius: '10px',
          },
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            borderRadius: '10px',
            color: theme.text,
            borderColor: theme.border,
          },
        }}
      >
        <div className="space-y-4 py-4">
          <Input
            placeholder="您的姓名"
            value={contactInfo.name}
            onChange={e =>
              setContactInfo({ ...contactInfo, name: e.target.value })}
            variant="filled"
            style={{ borderRadius: '12px', padding: '10px' }}
          />
          <Input.TextArea
            placeholder="您的留言"
            rows={4}
            value={contactInfo.message}
            onChange={e =>
              setContactInfo({ ...contactInfo, message: e.target.value })}
            variant="filled"
            style={{ borderRadius: '12px', padding: '10px' }}
          />
        </div>
      </Modal>
    </div>
  )
}
