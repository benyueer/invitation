import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'

// --- Scene Setup ---
const clock = new THREE.Clock()

// --- Color Palette ---
const PALETTES = [
  // ["#B5E0B5", "#C7E9C0", "#D9F2D9", "#A9D8A9", "#CCE5CC"], // Greens
  ['#E6E3B3', '#D9D9A6', '#F2EFD0'], // Yellows & Olives
  ['#B3D9D2', '#C9E3DE', '#A6CFC6', '#E0F2EE'], // Blue-Greens
  ['#F63049', '#D02752', '#8A244B', '#111F35'],
  ['#EA7B7B', '#D25353', '#9E3B3B', '#FFEAD3'],
  ['#91C6BC', '#4B9DA9', '#F6F3C2', '#E37434'],
]
const ACCENT_PALETTE = ['#E0CFC4', '#D4BFA7']

// --- GLSL Shaders ---
const stemVertexShader = `
            attribute float segmentT;
            varying float vT;

            void main() {
                vT = segmentT;
                float maxWidth = 0.2;
                float minWidth = 0.05;
                float currentWidth = mix(maxWidth, minWidth, segmentT);
                
                vec3 displaced = position + normal * currentWidth;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
        `

const stemFragmentShader = `
            uniform vec3 color;
            void main() {
                gl_FragColor = vec4(color, 0.8);
            }
        `

const leafVertexShader = `
            uniform float uGrow;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec3 pos = position;

                // Animate growth from base
                pos.x *= uGrow;
                pos.y *= pow(uGrow, 1.5); // Width grows slightly slower

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `

const leafFragmentShader = `
            uniform vec3 color;
            varying vec2 vUv;
            void main() {
                gl_FragColor = vec4(color, 0.8);
            }
        `

// --- Utility Functions ---
function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function bellCurve(t: number) {
  return Math.sin(Math.PI * t)
}

// --- Geometry Function ---
function createStemGeometry(
  curve: THREE.Curve<THREE.Vector2>,
  segments: number,
) {
  const points = curve.getPoints(segments)
  const geometry = new THREE.BufferGeometry()
  const vertices = []
  const normals = []
  const segmentTs = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = points[i]
    const tangent = curve.getTangent(t).normalize()
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0)

    vertices.push(point.x, point.y, 0)
    normals.push(normal.x, normal.y, normal.z)
    segmentTs.push(t)

    vertices.push(point.x, point.y, 0)
    normals.push(-normal.x, -normal.y, -normal.z)
    segmentTs.push(t)
  }

  const indices = []
  for (let i = 0; i < segments; i++) {
    const i2 = i * 2
    indices.push(i2, i2 + 1, i2 + 2)
    indices.push(i2 + 1, i2 + 3, i2 + 2)
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  )
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute(
    'segmentT',
    new THREE.Float32BufferAttribute(segmentTs, 1),
  )
  geometry.setIndex(indices)

  return geometry
}

// --- Tendril Class ---
class Tendril {
  curve: THREE.QuadraticBezierCurve3 | undefined
  segments: number = 100
  progress: number = 0
  speed: number = Math.random() * 0.01 + 0.1
  stemGeometry: THREE.BufferGeometry | undefined
  stemMaterial: THREE.ShaderMaterial | undefined
  stemMesh: THREE.Mesh | undefined
  leaves: THREE.Mesh[] = []
  activePalette: string[] = []
  leafMeshes: any[] = []
  worldWidth: number = 0
  worldHeight: number = 0
  scene: THREE.Scene | undefined
  constructor(
    startX: number,
    startY: number,
    worldHeight: number,
    worldWidth: number,
    scene: THREE.Scene,
  ) {
    this.worldHeight = worldHeight
    this.worldWidth = worldWidth
    this.scene = scene
    const start = new THREE.Vector3(startX, startY, 0)
    const margin = 10
    const randomY
      = startY + (Math.random() * worldHeight * 0.5 + worldHeight * 0.4)
    const endY = Math.min(randomY, worldHeight - margin)
    const end = new THREE.Vector3(
      startX + (Math.random() - 0.5) * worldWidth * 0.4,
      endY,
      0,
    )
    const control = new THREE.Vector3(
      (start.x + end.x) / 2 + (Math.random() - 0.5) * worldWidth * 0.4,
      (start.y + end.y) / 2 + Math.random() * worldHeight * 0.1,
      0,
    )
    this.curve = new THREE.QuadraticBezierCurve3(start, control, end)
    this.segments = 100

    this.progress = 0
    this.speed = Math.random() * 0.01 + 0.005

    const basePalette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
    this.activePalette = [
      ...basePalette,
      ...basePalette,
      ...basePalette,
      ...ACCENT_PALETTE,
    ]

    const stemGeometry = createStemGeometry(this.curve as any, this.segments)
    stemGeometry.setDrawRange(0, 0)

    this.stemMaterial = new THREE.ShaderMaterial({
      vertexShader: stemVertexShader,
      fragmentShader: stemFragmentShader,
      uniforms: {
        color: { value: new THREE.Color(0x503214) },
      },
      side: THREE.DoubleSide,
      transparent: true,
    })
    this.stemMesh = new THREE.Mesh(stemGeometry, this.stemMaterial)
    scene.add(this.stemMesh)

    this.leafMeshes = []
    this.createLeaves()
  }

  createLeaves() {
    const leafPairs = 40
    for (let k = 1; k < leafPairs; k++) {
      [-1, 1].forEach((side) => {
        const t_k = (k / leafPairs) ** 0.8

        let p
        let w_ratio
        let kappa
        let beta
        let length_scale = 1.0
        const r = Math.random()
        if (r < 0.4) {
          p = rand(2.2, 2.6)
          w_ratio = rand(0.08, 0.12)
          kappa = rand(-0.05, 0.05)
          beta = rand(-0.1, 0.1)
        }
        else if (r < 0.7) {
          p = rand(1.4, 1.8)
          w_ratio = rand(0.14, 0.18)
          kappa = 0
          beta = 0
        }
        else if (r < 0.9) {
          p = rand(1.8, 2.2)
          w_ratio = rand(0.1, 0.14)
          kappa = side * rand(0.12, 0.25)
          beta = side * rand(0.1, 0.2)
        }
        else {
          p = rand(1.6, 2.0)
          w_ratio = rand(0.12, 0.15)
          kappa = 0
          beta = 0
          length_scale = 0.6
        }

        const L_max = this.worldWidth * 0.12
        const L_k = bellCurve(t_k) * L_max * length_scale * rand(0.9, 1.1)
        const W_k = L_k * w_ratio

        const leafShape = new THREE.Shape()
        const segments = 32
        const points = []

        for (let i = 0; i <= segments; i++) {
          const s = i / segments
          const c_x = s * L_k
          const c_y = kappa * L_k * (1 - (1 - 2 * s) ** 2)
          const w_s = W_k * Math.sin(Math.PI * s) ** p
          const delta_s = beta * (1 - s) * w_s
          points.push({ x: c_x, y: c_y + w_s + delta_s })
        }
        for (let i = segments; i >= 0; i--) {
          const s = i / segments
          const c_x = s * L_k
          const c_y = kappa * L_k * (1 - (1 - 2 * s) ** 2)
          const w_s = W_k * Math.sin(Math.PI * s) ** p
          const delta_s = beta * (1 - s) * w_s
          points.push({ x: c_x, y: c_y - w_s + delta_s })
        }

        leafShape.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          leafShape.lineTo(points[i].x, points[i].y)
        }

        const leafGeometry = new THREE.ShapeGeometry(leafShape)

        const randomColorHex
          = this.activePalette[
            Math.floor(Math.random() * this.activePalette.length)
          ]
        const color = new THREE.Color(randomColorHex)
        const hsl = { h: 0, s: 0, l: 0 }
        color.getHSL(hsl as any)
        color.setHSL(hsl.h, hsl.s, hsl.l * rand(0.95, 1.05))

        const leafMaterial = new THREE.ShaderMaterial({
          vertexShader: leafVertexShader,
          fragmentShader: leafFragmentShader,
          uniforms: {
            color: { value: color },
            uGrow: { value: 0.0 },
          },
          side: THREE.DoubleSide,
          transparent: true,
        })

        const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial)

        const position = this.curve!.getPoint(t_k)
        const tangent = this.curve!.getTangent(t_k)
        const baseAngle = Math.atan2(tangent.y, tangent.x)
        const leafletAngle
          = THREE.MathUtils.lerp(25, 55, t_k) * THREE.MathUtils.DEG2RAD
        const angle
          = baseAngle
            + side * leafletAngle
            + rand(-7, 7) * THREE.MathUtils.DEG2RAD

        leafMesh.position.copy(position)
        leafMesh.rotation.z = angle

        leafMesh.visible = false
        this.leafMeshes.push({
          mesh: leafMesh,
          t: t_k,
          isGrowing: false,
          growthProgress: 0,
          growthStartTime: 0,
          growthDuration: rand(0.4, 0.9),
        } as any)
        this.scene!.add(leafMesh)
      })
    }
  }

  update(elapsedTime: number) {
    if (this.progress < 1) {
      this.progress += this.speed
      if (this.progress > 1)
        this.progress = 1

      const indicesToShow = Math.floor(this.progress * this.segments * 6)
      this.stemMesh!.geometry.setDrawRange(0, indicesToShow)
    }

    this.leafMeshes.forEach((leaf: any) => {
      if (!leaf.isGrowing && leaf.t < this.progress) {
        leaf.isGrowing = true
        leaf.growthStartTime = elapsedTime + rand(-0.12, 0.12)
        leaf.mesh.visible = true
      }

      if (leaf.isGrowing && leaf.growthProgress < 1) {
        const timeSinceStart = elapsedTime - leaf.growthStartTime
        leaf.growthProgress = Math.min(
          1.0,
          timeSinceStart / leaf.growthDuration,
        )
        leaf.mesh.material.uniforms.uGrow.value
          = 1.0 - (1.0 - leaf.growthProgress) ** 3
      }
    })
  }
}

export interface LeafHandles {
  showAll: () => void
}

function Leaf(props: any, ref: any) {
  const cameraRef = useRef<THREE.OrthographicCamera>(null)
  const rendererRef = useRef<THREE.WebGLRenderer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>(null)
  const worldHeightRef = useRef<number>(0)
  const worldWidthRef = useRef<number>(100)

  const [tendrils, setTendrils] = useState<Tendril[]>([])
  const [showed, setShowed] = useState(false)

  const showAll = () => {
    if (showed)
      return
    const tendrils = []
    for (let i = 0; i < 20; i++) {
      tendrils.push(
        new Tendril(
          Math.random() * worldWidthRef.current,
          -5,
          worldHeightRef.current,
          worldWidthRef.current,
          sceneRef.current!,
        ),
      )
    }
    setTendrils(tendrils)
    setShowed(true)
  }

  useImperativeHandle(ref, () => ({
    showAll,
  }))

  function onWindowResize() {
    const width = window.innerWidth
    const height = window.innerHeight

    const aspect = height > 0 ? width / height : 1
    const worldHeight = worldWidthRef.current / aspect
    cameraRef.current!.top = worldHeight
    cameraRef.current!.updateProjectionMatrix()

    rendererRef.current!.setSize(width, height)
  }

  function onClick(event: MouseEvent | TouchEvent) {
    const touch = event instanceof TouchEvent ? event.touches[0] : event
    const screenX = touch.clientX / containerRef.current!.clientWidth
    const startX = screenX * worldWidthRef.current
    const startY = -5
    const tendril = new Tendril(
      startX,
      startY,
      worldHeightRef.current,
      worldWidthRef.current,
      sceneRef.current!,
    )

    setTendrils(v => ([...v, tendril]))
  }

  function init() {
    const width = containerRef.current!.clientWidth
    const height = containerRef.current!.clientHeight

    sceneRef.current = new THREE.Scene()

    const aspect = height > 0 ? width / height : 1
    worldHeightRef.current = worldWidthRef.current / aspect

    cameraRef.current = new THREE.OrthographicCamera(
      0,
      worldWidthRef.current,
      worldHeightRef.current,
      0,
      1,
      1000,
    )
    cameraRef.current.position.z = 1

    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    rendererRef.current.setSize(width, height)
    rendererRef.current.setPixelRatio(window.devicePixelRatio)
    containerRef.current!.appendChild(rendererRef.current.domElement)

    // window.addEventListener("resize", onWindowResize);
    // window.addEventListener("click", onClick);
    // window.addEventListener("touchstart", onClick);

    // tendrils.push(new Tendril(
    //   worldWidthRef.current / 2,
    //   -5,
    //   worldHeightRef.current,
    //   worldWidthRef.current,
    //   sceneRef.current!,
    // ));
  }

  function animate() {
    requestAnimationFrame(animate)
    const elapsedTime = clock.getElapsedTime()

    tendrils.forEach((tendril) => {
      tendril.update(elapsedTime)
    })

    rendererRef.current!.render(sceneRef.current!, cameraRef.current!)
  }

  useEffect(() => {
    init()
    animate()
    return () => {
      window.removeEventListener('resize', onWindowResize)
      window.removeEventListener('click', onClick)
      window.removeEventListener('touchstart', onClick)
    }
  }, [])

  return <div className="w-full h-full" ref={containerRef}></div>
}

export default forwardRef<LeafHandles>(Leaf)
