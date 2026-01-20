import { useEffect, useRef } from 'react'
import Canvas from './canvas'

export default function VortexGallery() {
  const canvasRef = useRef<Canvas | null>(null)
  const render = () => {
    canvasRef.current?.render()
    requestAnimationFrame(render)
  }

  useEffect(() => {
    canvasRef.current = new Canvas()
    render()

    return () => canvasRef.current?.destory()
  }, [])

  return (
    <canvas id="webgl" className="fixed inset-0 top-0 left-0"></canvas>
  )
}
