import type {
  ChunkData,
  InfiniteCanvasProps,
  MediaItem,
  PlaneData,
} from './types'
import {
  KeyboardControls,
  Stats,
  useKeyboardControls,
  useProgress,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { useIsTouchDevice } from '../use-is-touch-device'
import { clamp, lerp } from '../utils'
import {
  CHUNK_FADE_MARGIN,
  CHUNK_OFFSETS,
  CHUNK_SIZE,
  DEPTH_FADE_END,
  DEPTH_FADE_START,
  INITIAL_CAMERA_Z,
  INVIS_THRESHOLD,
  KEYBOARD_SPEED,
  MAX_VELOCITY,
  RENDER_DISTANCE,
  VELOCITY_DECAY,
  VELOCITY_LERP,
} from './constants'
import styles from './style.module.css'
import { getTexture } from './texture-manager'
import {
  generateChunkPlanesCached,
  getChunkUpdateThrottleMs,
  shouldThrottleUpdate,
} from './utils'

const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1)

const KEYBOARD_MAP = [
  { name: 'forward', keys: ['w', 'W', 'ArrowUp'] },
  { name: 'backward', keys: ['s', 'S', 'ArrowDown'] },
  { name: 'left', keys: ['a', 'A', 'ArrowLeft'] },
  { name: 'right', keys: ['d', 'D', 'ArrowRight'] },
  { name: 'up', keys: ['e', 'E'] },
  { name: 'down', keys: ['q', 'Q'] },
]

interface KeyboardKeys {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

function getTouchDistance(touches: Touch[]) {
  if (touches.length < 2) {
    return 0
  }

  const [t1, t2] = touches
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

interface CameraGridState {
  cx: number
  cy: number
  cz: number
  camZ: number
}

function MediaPlane({
  position,
  scale,
  media,
  chunkCx,
  chunkCy,
  chunkCz,
  cameraGridRef,
  onPlaneClick,
}: {
  position: THREE.Vector3
  scale: THREE.Vector3
  media: MediaItem
  chunkCx: number
  chunkCy: number
  chunkCz: number
  cameraGridRef: React.RefObject<CameraGridState>
  onPlaneClick: (
    position: THREE.Vector3,
    scale: THREE.Vector3,
    media: MediaItem,
  ) => void
}) {
  const meshRef = React.useRef<THREE.Mesh>(null)
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null)
  const localState = React.useRef({ opacity: 0, frame: 0, ready: false })

  const [texture, setTexture] = React.useState<THREE.Texture | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  useFrame(() => {
    const material = materialRef.current
    const mesh = meshRef.current
    const state = localState.current

    if (!material || !mesh) {
      return
    }

    state.frame = (state.frame + 1) & 1

    if (state.opacity < INVIS_THRESHOLD && !mesh.visible && state.frame === 0) {
      return
    }

    const cam = cameraGridRef.current
    const dist = Math.max(
      Math.abs(chunkCx - cam.cx),
      Math.abs(chunkCy - cam.cy),
      Math.abs(chunkCz - cam.cz),
    )
    const absDepth = Math.abs(position.z - cam.camZ)

    if (absDepth > DEPTH_FADE_END + 50) {
      state.opacity = 0
      material.opacity = 0
      material.depthWrite = false
      mesh.visible = false
      return
    }

    const gridFade
      = dist <= RENDER_DISTANCE
        ? 1
        : Math.max(
            0,
            1 - (dist - RENDER_DISTANCE) / Math.max(CHUNK_FADE_MARGIN, 0.0001),
          )

    const depthFade
      = absDepth <= DEPTH_FADE_START
        ? 1
        : Math.max(
            0,
            1
            - (absDepth - DEPTH_FADE_START)
            / Math.max(DEPTH_FADE_END - DEPTH_FADE_START, 0.0001),
          )

    const target = Math.min(gridFade, depthFade * depthFade)

    state.opacity
      = target < INVIS_THRESHOLD && state.opacity < INVIS_THRESHOLD
        ? 0
        : lerp(state.opacity, target, 0.18)

    const isFullyOpaque = state.opacity > 0.99
    material.opacity = isFullyOpaque ? 1 : state.opacity
    material.depthWrite = isFullyOpaque
    mesh.visible = state.opacity > INVIS_THRESHOLD
  })

  // Calculate display scale from media dimensions (from manifest)
  const displayScale = React.useMemo(() => {
    if (media.width && media.height) {
      const aspect = media.width / media.height
      return new THREE.Vector3(scale.y * aspect, scale.y, 1)
    }

    return scale
  }, [media.width, media.height, scale])

  // Load texture with onLoad callback
  React.useEffect(() => {
    const state = localState.current
    state.ready = false
    state.opacity = 0
    setIsReady(false)

    const material = materialRef.current

    if (material) {
      material.opacity = 0
      material.depthWrite = false
      material.map = null
    }

    const tex = getTexture(media, () => {
      state.ready = true
      setIsReady(true)
    })

    setTexture(tex)
  }, [media])

  // Apply texture when ready
  React.useEffect(() => {
    const material = materialRef.current
    const mesh = meshRef.current
    const state = localState.current

    if (!material || !mesh || !texture || !isReady || !state.ready) {
      return
    }

    material.map = texture
    material.opacity = state.opacity
    material.depthWrite = state.opacity >= 1
    mesh.scale.copy(displayScale)
  }, [displayScale, texture, isReady])

  if (!texture || !isReady) {
    return null
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={displayScale}
      visible={false}
      geometry={PLANE_GEOMETRY}
      onClick={(e) => {
        e.stopPropagation()
        onPlaneClick(position, displayScale, media)
      }}
      onPointerDown={(e) => {
        console.log('pointer down')
        e.stopPropagation()
        onPlaneClick(position, displayScale, media)
      }}
    >
      <meshBasicMaterial
        ref={materialRef}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Chunk({
  cx,
  cy,
  cz,
  media,
  cameraGridRef,
  onPlaneClick,
}: {
  cx: number
  cy: number
  cz: number
  media: MediaItem[]
  cameraGridRef: React.RefObject<CameraGridState>
  onPlaneClick: (
    position: THREE.Vector3,
    scale: THREE.Vector3,
    media: MediaItem,
  ) => void
}) {
  const [planes, setPlanes] = React.useState<PlaneData[] | null>(null)

  React.useEffect(() => {
    let canceled = false
    const run = () =>
      !canceled && setPlanes(generateChunkPlanesCached(cx, cy, cz))

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 100 })

      return () => {
        canceled = true
        cancelIdleCallback(id)
      }
    }

    const id = setTimeout(run, 0)
    return () => {
      canceled = true
      clearTimeout(id)
    }
  }, [cx, cy, cz])

  if (!planes) {
    return null
  }

  return (
    <group>
      {planes.map((plane) => {
        const mediaItem = media[plane.mediaIndex % media.length]

        if (!mediaItem) {
          return null
        }

        return (
          <MediaPlane
            key={plane.id}
            position={plane.position}
            scale={plane.scale}
            media={mediaItem}
            chunkCx={cx}
            chunkCy={cy}
            chunkCz={cz}
            cameraGridRef={cameraGridRef}
            onPlaneClick={onPlaneClick}
          />
        )
      })}
    </group>
  )
}

interface ControllerState {
  velocity: { x: number, y: number, z: number }
  targetVel: { x: number, y: number, z: number }
  basePos: { x: number, y: number, z: number }
  drift: { x: number, y: number }
  mouse: { x: number, y: number }
  lastMouse: { x: number, y: number }
  scrollAccum: number
  isDragging: boolean
  lastTouches: Touch[]
  lastTouchDist: number
  lastChunkKey: string
  lastChunkUpdate: number
  pendingChunk: { cx: number, cy: number, cz: number } | null
  focusTarget: { x: number, y: number, z: number } | null
  isFocusing: boolean
  lastHitTime: number
  mouseDragStart: { x: number, y: number } | null
  touchStartPos: { x: number, y: number } | null
}

function createInitialState(camZ: number): ControllerState {
  return {
    velocity: { x: 0, y: 0, z: 0 },
    targetVel: { x: 0, y: 0, z: 0 },
    basePos: { x: 0, y: 0, z: camZ },
    drift: { x: 0, y: 0 },
    mouse: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 },
    scrollAccum: 0,
    isDragging: false,
    lastTouches: [],
    lastTouchDist: 0,
    lastChunkKey: '',
    lastChunkUpdate: 0,
    pendingChunk: null,
    focusTarget: null,
    isFocusing: false,
    lastHitTime: 0,
    mouseDragStart: null,
    touchStartPos: null,
  }
}

function SceneController({
  media,
  onTextureProgress,
}: {
  media: MediaItem[]
  onTextureProgress?: (progress: number) => void
}) {
  const { camera, gl } = useThree()
  const isTouchDevice = useIsTouchDevice()
  const [, getKeys] = useKeyboardControls<keyof KeyboardKeys>()

  const state = React.useRef<ControllerState>(
    createInitialState(INITIAL_CAMERA_Z),
  )
  const cameraGridRef = React.useRef<CameraGridState>({
    cx: 0,
    cy: 0,
    cz: 0,
    camZ: camera.position.z,
  })

  const [chunks, setChunks] = React.useState<ChunkData[]>([])

  const { progress } = useProgress()
  const maxProgress = React.useRef(0)

  React.useEffect(() => {
    const rounded = Math.round(progress)

    if (rounded > maxProgress.current) {
      maxProgress.current = rounded
      onTextureProgress?.(rounded)
    }
  }, [progress, onTextureProgress])

  const handlePlaneClick = React.useCallback(
    (position: THREE.Vector3, scale: THREE.Vector3, _media: MediaItem) => {
      const s = state.current
      // Mark hit time to prevent background click cancellation
      s.lastHitTime = performance.now()

      const perspectiveCamera = camera as THREE.PerspectiveCamera
      const fov = perspectiveCamera.fov * (Math.PI / 180)
      // Calculate distance needed to fit the image
      // We want some padding around the image, so we use a slightly larger scale for calculation
      const PADDING_MULTIPLIER = 1.2

      // Calculate visible height at unit distance
      // For perspective camera: 2 * Math.tan(fov / 2)
      const visibleHeightAtUnitDist = 2 * Math.tan(fov / 2)

      // We want to fit vertically
      // desiredDist = (imageHeight * padding) / visibleHeightAtUnitDist
      let desiredDist
        = (scale.y * PADDING_MULTIPLIER) / visibleHeightAtUnitDist

      // Check aspect ratio to ensure it fits horizontally too
      // window aspect ratio = width / height
      const aspect = window.innerWidth / window.innerHeight
      const visibleWidthAtUnitDist = visibleHeightAtUnitDist * aspect

      // desiredDist based on width = (imageWidth * padding) / visibleWidthAtUnitDist
      const desiredDistWidth
        = (scale.x * PADDING_MULTIPLIER) / visibleWidthAtUnitDist

      // Take the larger distance to ensure it fits both dimensions
      desiredDist = Math.max(desiredDist, desiredDistWidth)

      // Target position is image position + offset in Z
      // We need to account for the current Z of the image vs camera
      // The camera looks down -Z, so we want to be at image.z + desiredDist

      s.focusTarget = {
        x: position.x,
        y: position.y,
        z: position.z + desiredDist,
      }
      s.isFocusing = true
    },
    [camera],
  )

  React.useEffect(() => {
    const canvas = gl.domElement
    const s = state.current
    canvas.style.cursor = 'grab'

    const setCursor = (cursor: string) => {
      canvas.style.cursor = cursor
    }

    const onMouseDown = (e: MouseEvent) => {
      // Just start dragging - keep drift frozen at current value
      s.isDragging = true
      // Don't cancel focus immediately on mouse down (might be a click on object)
      // s.isFocusing = false;
      // s.focusTarget = null;
      s.lastMouse = { x: e.clientX, y: e.clientY }
      s.mouseDragStart = { x: e.clientX, y: e.clientY } // Track start for drag threshold
      setCursor('grabbing')
    }

    const onMouseUp = (e: MouseEvent) => {
      s.isDragging = false
      setCursor('grab')

      // Background click detection
      // If we didn't move much (click) AND we didn't hit an object recently
      const dist = Math.sqrt(
        (e.clientX - (s.mouseDragStart?.x || 0)) ** 2
        + (e.clientY - (s.mouseDragStart?.y || 0)) ** 2,
      )

      if (dist < 5 && performance.now() - s.lastHitTime > 100) {
        s.isFocusing = false
        s.focusTarget = null
      }
    }

    const onMouseLeave = () => {
      s.mouse = { x: 0, y: 0 }
      s.isDragging = false
      setCursor('grab')
    }

    const onMouseMove = (e: MouseEvent) => {
      s.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }

      if (s.isDragging) {
        s.targetVel.x -= (e.clientX - s.lastMouse.x) * 0.025
        s.targetVel.y += (e.clientY - s.lastMouse.y) * 0.025
        s.lastMouse = { x: e.clientX, y: e.clientY }

        // If dragging significantly, cancel focus
        const dist = Math.sqrt(
          (e.clientX - (s.mouseDragStart?.x || 0)) ** 2
          + (e.clientY - (s.mouseDragStart?.y || 0)) ** 2,
        )
        if (dist > 5) {
          s.isFocusing = false
          s.focusTarget = null
        }
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      s.isFocusing = false // Wheel always cancels focus
      s.focusTarget = null
      s.scrollAccum += e.deltaY * 0.006
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      // Don't cancel focus immediately
      // s.isFocusing = false;
      // s.focusTarget = null;
      s.lastTouches = Array.from(e.touches) as Touch[]
      s.lastTouchDist = getTouchDistance(s.lastTouches)
      // Track start position for tap detection
      if (e.touches.length > 0) {
        s.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
      setCursor('grabbing')
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touches = Array.from(e.touches) as Touch[]

      // Check for drag threshold to cancel focus
      if (touches.length > 0 && s.touchStartPos) {
        const dist = Math.sqrt(
          (touches[0].clientX - s.touchStartPos.x) ** 2
          + (touches[0].clientY - s.touchStartPos.y) ** 2,
        )
        if (dist > 10) {
          s.isFocusing = false
          s.focusTarget = null
        }
      }

      if (touches.length === 1 && s.lastTouches.length >= 1) {
        const [touch] = touches
        const [last] = s.lastTouches

        if (touch && last) {
          s.targetVel.x -= (touch.clientX - last.clientX) * 0.02
          s.targetVel.y += (touch.clientY - last.clientY) * 0.02
        }
      }
      else if (touches.length === 2 && s.lastTouchDist > 0) {
        const dist = getTouchDistance(touches)
        s.scrollAccum += (s.lastTouchDist - dist) * 0.006
        s.lastTouchDist = dist
      }

      s.lastTouches = touches
    }

    const onTouchEnd = (e: TouchEvent) => {
      s.lastTouches = Array.from(e.touches) as Touch[]
      s.lastTouchDist = getTouchDistance(s.lastTouches)
      setCursor('grab')

      // Handle background tap on touch end
      // We check if it was a tap (little movement) and if we didn't hit an object recently
      // Note: touchStartPos persists from touchstart
      // But we can't easily check 'current' touch pos if touches is empty.
      // We assume if no movement triggered cancel, and lastHitTime is old, it's a background tap.
      // Actually we can check if isFocusing was cancelled by move.

      // If we are still focusing (didn't drag), and haven't hit object recently, maybe cancel?
      // But the sequence is: TouchStart -> PointerDown(Hit) -> TouchEnd
      // If Hit, lastHitTime is updated.
      // So checks:
      const timeSinceHit = performance.now() - (s.lastHitTime || 0)
      // Threshold: 200ms
      if (timeSinceHit > 200) {
        // Did we drag? If we dragged, isFocusing is already false.
        // If we didn't drag (Tap), and didn't hit object -> Background Tap -> Cancel.
        // But wait, if isFocusing is ALREADY true (from previous interaction), and we tap background?
        // We should cancel.

        // We need to know if this specific touch *moved*.
        // If `onTouchMove` didn't run or didn't move far.
        // Effectively, if we haven't cancelled focus yet via Drag, we might cancel it now via Background Tap.
        // But what if we just tapped an image? timeSinceHit < 200. We skip cancel.
        // So:
        if (s.isFocusing) {
          // It's possible we are focused.
          // If this was a background tap, we should cancel.
          // Rely on lastHitTime: if > 200, it wasn't an object tap.
          s.isFocusing = false
          s.focusTarget = null
        }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl, camera])

  useFrame(() => {
    const s = state.current
    const now = performance.now()

    const { forward, backward, left, right, up, down } = getKeys()

    if (forward || backward || left || right || up || down) {
      s.isFocusing = false
      s.focusTarget = null
    }

    if (forward)
      s.targetVel.z -= KEYBOARD_SPEED
    if (backward)
      s.targetVel.z += KEYBOARD_SPEED
    if (left)
      s.targetVel.x -= KEYBOARD_SPEED
    if (right)
      s.targetVel.x += KEYBOARD_SPEED
    if (down)
      s.targetVel.y -= KEYBOARD_SPEED
    if (up)
      s.targetVel.y += KEYBOARD_SPEED

    const isZooming = Math.abs(s.velocity.z) > 0.05
    const zoomFactor = clamp(s.basePos.z / 50, 0.3, 2.0)
    const driftAmount = 8.0 * zoomFactor
    const driftLerp = isZooming ? 0.2 : 0.12

    if (s.isDragging) {
      // Freeze drift during drag - keep it at current value
    }
    else if (isTouchDevice || s.isFocusing) {
      s.drift.x = lerp(s.drift.x, 0, driftLerp)
      s.drift.y = lerp(s.drift.y, 0, driftLerp)
    }
    else {
      s.drift.x = lerp(s.drift.x, s.mouse.x * driftAmount, driftLerp)
      s.drift.y = lerp(s.drift.y, s.mouse.y * driftAmount, driftLerp)
    }

    s.targetVel.z += s.scrollAccum
    s.scrollAccum *= 0.8

    s.targetVel.x = clamp(s.targetVel.x, -MAX_VELOCITY, MAX_VELOCITY)
    s.targetVel.y = clamp(s.targetVel.y, -MAX_VELOCITY, MAX_VELOCITY)
    s.targetVel.z = clamp(s.targetVel.z, -MAX_VELOCITY, MAX_VELOCITY)

    s.velocity.x = lerp(s.velocity.x, s.targetVel.x, VELOCITY_LERP)
    s.velocity.y = lerp(s.velocity.y, s.targetVel.y, VELOCITY_LERP)
    s.velocity.z = lerp(s.velocity.z, s.targetVel.z, VELOCITY_LERP)

    if (s.isFocusing && s.focusTarget) {
      // Smoothly move towards focus target
      const FOCUS_LERP = 0.08

      s.basePos.x = lerp(s.basePos.x, s.focusTarget.x, FOCUS_LERP)
      s.basePos.y = lerp(s.basePos.y, s.focusTarget.y, FOCUS_LERP)
      s.basePos.z = lerp(s.basePos.z, s.focusTarget.z, FOCUS_LERP)

      // Dampen velocity while focusing
      s.targetVel.x = 0
      s.targetVel.y = 0
      s.targetVel.z = 0
      s.velocity.x = 0
      s.velocity.y = 0
      s.velocity.z = 0

      // Stop focusing if close enough
      const distSq
        = (s.basePos.x - s.focusTarget.x) ** 2
          + (s.basePos.y - s.focusTarget.y) ** 2
          + (s.basePos.z - s.focusTarget.z) ** 2

      if (distSq < 0.01) {
        s.isFocusing = false
        s.focusTarget = null
      }
    }
    else {
      s.basePos.x += s.velocity.x
      s.basePos.y += s.velocity.y
      s.basePos.z += s.velocity.z
    }

    camera.position.set(
      s.basePos.x + s.drift.x,
      s.basePos.y + s.drift.y,
      s.basePos.z,
    )

    s.targetVel.x *= VELOCITY_DECAY
    s.targetVel.y *= VELOCITY_DECAY
    s.targetVel.z *= VELOCITY_DECAY

    const cx = Math.floor(s.basePos.x / CHUNK_SIZE)
    const cy = Math.floor(s.basePos.y / CHUNK_SIZE)
    const cz = Math.floor(s.basePos.z / CHUNK_SIZE)

    cameraGridRef.current = { cx, cy, cz, camZ: s.basePos.z }

    const key = `${cx},${cy},${cz}`
    if (key !== s.lastChunkKey) {
      s.pendingChunk = { cx, cy, cz }
      s.lastChunkKey = key
    }

    const throttleMs = getChunkUpdateThrottleMs(
      isZooming,
      Math.abs(s.velocity.z),
    )

    if (
      s.pendingChunk
      && shouldThrottleUpdate(s.lastChunkUpdate, throttleMs, now)
    ) {
      const { cx: ucx, cy: ucy, cz: ucz } = s.pendingChunk
      s.pendingChunk = null
      s.lastChunkUpdate = now

      setChunks(
        CHUNK_OFFSETS.map(o => ({
          key: `${ucx + o.dx},${ucy + o.dy},${ucz + o.dz}`,
          cx: ucx + o.dx,
          cy: ucy + o.dy,
          cz: ucz + o.dz,
        })),
      )
    }
  })

  React.useEffect(() => {
    const s = state.current
    s.basePos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }

    setChunks(
      CHUNK_OFFSETS.map(o => ({
        key: `${o.dx},${o.dy},${o.dz}`,
        cx: o.dx,
        cy: o.dy,
        cz: o.dz,
      })),
    )
  }, [camera])

  return (
    <>
      {chunks.map(chunk => (
        <Chunk
          key={chunk.key}
          cx={chunk.cx}
          cy={chunk.cy}
          cz={chunk.cz}
          media={media}
          cameraGridRef={cameraGridRef}
          onPlaneClick={handlePlaneClick}
        />
      ))}
    </>
  )
}

export function InfiniteCanvasScene({
  media,
  onTextureProgress,
  showFps = false,
  showControls = false,
  cameraFov = 60,
  cameraNear = 1,
  cameraFar = 500,
  fogNear = 120,
  fogFar = 320,
  backgroundColor = '#ffffff',
  fogColor = '#ffffff',
}: InfiniteCanvasProps) {
  const isTouchDevice = useIsTouchDevice()
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    isTouchDevice ? 1.25 : 1.5,
  )

  if (!media.length) {
    return null
  }

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div className={styles.container}>
        <Canvas
          camera={{
            position: [0, 0, INITIAL_CAMERA_Z],
            fov: cameraFov,
            near: cameraNear,
            far: cameraFar,
          }}
          dpr={dpr}
          flat
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          className={styles.canvas}
        >
          <color attach="background" args={[backgroundColor]} />
          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
          <SceneController
            media={media}
            onTextureProgress={onTextureProgress}
          />
          {showFps && <Stats className={styles.stats} />}
        </Canvas>

        {showControls && (
          <div className={styles.controlsPanel}>
            {isTouchDevice
              ? (
                  <>
                    <b>Drag</b>
                    {' '}
                    Pan ·
                    <b>Pinch</b>
                    {' '}
                    Zoom
                  </>
                )
              : (
                  <>
                    <b>WASD</b>
                    {' '}
                    Move ·
                    <b>QE</b>
                    {' '}
                    Up/Down ·
                    <b>Scroll/Space</b>
                    {' '}
                    Zoom
                  </>
                )}
          </div>
        )}
      </div>
    </KeyboardControls>
  )
}
