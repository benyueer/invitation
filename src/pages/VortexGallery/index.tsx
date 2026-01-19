import { useEffect, useRef } from 'react'
import Canvas from './canvas'
import './style.css'

export default function VortexGallery() {
  const canvasRef = useRef<Canvas | null>(null)
  const render = () => {
    canvasRef.current?.render()
    requestAnimationFrame(render)
  }

  useEffect(() => {
    canvasRef.current = new Canvas()
    render()
  }, [])

  return (
    <canvas id="webgl"></canvas>
  )
}
