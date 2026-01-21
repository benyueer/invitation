import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'
import Canvas from './canvas'
import Scroll from './scroll'
import './style.css'
import LoadingScreen from '@/components/LoadingScreen'

gsap.registerPlugin(ScrollTrigger)

export default function Magazine() {
  const canvas = useRef<Canvas | null>(null)
  const scroll = useRef<Scroll | null>(null)
  const [progress, setProgress] = useState(0)

  const render = () => {
    canvas.current?.render()
    requestAnimationFrame(render)
  }

  const onProgress = (progress: number) => {
    setProgress(progress)
  }

  useEffect(() => {
    scroll.current = new Scroll()
    canvas.current = new Canvas({ scroll: scroll.current, onProgress })

    render()

    return () => {
      scroll.current?.destroy()
      canvas.current?.destroy()
    }
  }, [])

  return (
    <div className="h-[100dvh] text-amber-50/60 flex flex-col justify-between relative z-10 bg-[rgb(232_220_207)]">
      {
        progress < 1 && (
          <LoadingScreen progress={progress * 10}>
            <span className="mb-4 text-sm">每次打开都是不同的照片哦~~</span>
          </LoadingScreen>
        )
      }
      <canvas id="webgl"></canvas>
    </div>
  )
}
