import type Scroll from './scroll'
import type { Dimensions, Size } from './types/types'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Magazine from './magazine'

interface Props {
  scroll: Scroll
  onProgress: any
}

export default class Canvas {
  element: HTMLCanvasElement
  scene: THREE.Scene | undefined
  camera: THREE.PerspectiveCamera | undefined
  renderer: THREE.WebGLRenderer | undefined
  sizes: Size | undefined
  dimensions: Dimensions | undefined
  time: number
  clock: THREE.Clock | undefined
  raycaster: THREE.Raycaster | undefined
  mouse: THREE.Vector2 | undefined
  orbitControls: OrbitControls | undefined
  scroll: Scroll
  mediaInfoBlock: HTMLDivElement
  magazine: Magazine | undefined
  onProgress: any

  constructor({ scroll, onProgress }: Props) {
    this.scroll = scroll
    this.element = document.getElementById('webgl') as HTMLCanvasElement
    this.mediaInfoBlock = document.getElementById(
      'media-block',
    ) as HTMLDivElement
    this.time = 0
    this.createClock()
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.setSizes()
    this.createRayCaster()
    // this.createOrbitControls()
    this.addEventListeners()
    this.createMagazine()

    this.render()
    this.onProgress = onProgress
  }

  createScene() {
    this.scene = new THREE.Scene()
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )
    this.scene!.add(this.camera)
    // this.camera.position.z = 2
    // this.camera.position.z = 6
    this.camera.position.z = 6
    // this.camera.position.y = 3
    // this.camera.position.x = 2
    // this.camera.position.y = 10
  }

  createHelpers() {
    const axesHelper = new THREE.AxesHelper(5)
    this.scene!.add(axesHelper)
  }

  createOrbitControls() {
    this.orbitControls = new OrbitControls(
      this.camera!,
      this.renderer!.domElement,
    )
  }

  createMagazine() {
    this.magazine = new Magazine({
      scene: this.scene!,
      sizes: this.sizes!,
      onLoad: (progress: number) => {
        this.onProgress(progress)
      },
    })
  }

  createRenderer() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.element,
      alpha: true,
    })
    this.renderer.setSize(this.dimensions.width, this.dimensions.height)
    this.renderer.render(this.scene!, this.camera!)

    this.renderer.setPixelRatio(this.dimensions.pixelRatio)
  }

  setSizes() {
    const fov = this.camera!.fov * (Math.PI / 180)
    const height = this.camera!.position.z * Math.tan(fov / 2) * 2
    const width = height * this.camera!.aspect

    this.sizes = {
      width,
      height,
    }
  }

  createClock() {
    this.clock = new THREE.Clock()
  }

  createRayCaster() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  onMouseMove(event: MouseEvent) {
    this.mouse!.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse!.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster!.setFromCamera(this.mouse!, this.camera!)
    const intersects = this.raycaster!.intersectObjects(this.scene!.children)
    const target = intersects[0]
    if (target && 'material' in target.object) {
      // const targetMesh = intersects[0].object as THREE.Mesh
    }
  }

  addEventListeners() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))
  }

  onResize() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.camera!.aspect = window.innerWidth / window.innerHeight
    this.camera!.updateProjectionMatrix()
    this.setSizes()

    this.renderer!.setPixelRatio(this.dimensions.pixelRatio)
    this.renderer!.setSize(this.dimensions.width, this.dimensions.height)

    this.magazine?.onResize(this.sizes!)
  }

  render() {
    this.time = this.clock!.getElapsedTime()

    this.renderer!.render(this.scene!, this.camera!)
    this.magazine?.render()
  }

  destroy() {
    this.renderer!.dispose()
    this.orbitControls?.dispose()
    this.magazine?.destroy()
  }
}
