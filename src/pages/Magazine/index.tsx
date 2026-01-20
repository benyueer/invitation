import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import Canvas from './canvas'
import Scroll from './scroll'
import './style.css'

gsap.registerPlugin(ScrollTrigger)

export default function Magazine() {
  const canvas = useRef<Canvas | null>(null)
  const scroll = useRef<Scroll | null>(null)

  const render = () => {
    canvas.current?.render()
    requestAnimationFrame(render)
  }

  useEffect(() => {
    scroll.current = new Scroll()
    canvas.current = new Canvas({ scroll: scroll.current })

    render()

    return () => {
      scroll.current?.destroy()
      canvas.current?.destroy()
    }
  }, [])

  return (
    <div className="h-[100dvh] text-amber-50/60 flex flex-col justify-between relative z-10 bg-[rgb(232_220_207)]">
      <canvas id="webgl"></canvas>
    </div>
  )
}
