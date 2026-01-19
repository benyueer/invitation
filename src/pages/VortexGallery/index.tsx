import "./style.css"
import Canvas from "./canvas"
import { useEffect, useRef } from "react"
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
