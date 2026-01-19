import type { Dimensions, Size } from './types/types'
import GUI from 'lil-gui'
import normalizeWheel from 'normalize-wheel'
import * as THREE from 'three'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Gallery from './gallery'

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
  debug: GUI | undefined
  gallery: Gallery | undefined
  scrollY: number
  lastDirection: number = 1
  touchStartY: number = 0
  touchStartX: number = 0
  initialPinchDistance: number | null = null

  constructor() {
    this.element = document.getElementById('webgl') as HTMLCanvasElement
    this.time = 0
    this.scrollY = 0
    this.createClock()
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.setSizes()
    this.createRayCaster()
    // this.createOrbitControls()
    this.addEventListeners()
    // this.createDebug()
    this.createGallery()
    // this.createHelpers()
    this.render()
  }

  createScene() {
    this.scene = new THREE.Scene()
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    )
    this.scene?.add(this.camera)
    this.camera.position.z = 5
  }

  createOrbitControls() {
    this.orbitControls = new OrbitControls(
      this.camera!,
      this.renderer?.domElement,
    )
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

  createDebug() {
    this.debug = new GUI()
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
    // const intersects = this.raycaster!.intersectObjects(this.scene!.children)
    // const target = intersects[0]
    // if (target && 'material' in target.object) {
    //   const _targetMesh = intersects[0].object as THREE.Mesh
    // }
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartY = event.touches[0].clientY
      this.touchStartX = event.touches[0].clientX

      // Update mouse position for raycasting
      this.mouse!.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
      this.mouse!.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    }
    else if (event.touches.length === 2) {
      this.initialPinchDistance = this.getPinchDistance(event)
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault()
    if (event.touches.length === 1) {
      const deltaY = event.touches[0].clientY - this.touchStartY
      // const deltaX = event.touches[0].clientX - this.touchStartX

      this.touchStartY = event.touches[0].clientY
      this.touchStartX = event.touches[0].clientX

      // Use deltaY for vertical scrolling, similar to wheel
      // Amplify the touch delta slightly for better feel
      const sensitivity = 5
      const scrollAmount = ((-deltaY * sensitivity) / window.innerHeight) * this.sizes!.height

      this.gallery!.updateScroll(scrollAmount, Math.sign(-deltaY))
    }
    else if (event.touches.length === 2 && this.initialPinchDistance) {
      const currentDistance = this.getPinchDistance(event)
      const delta = currentDistance - this.initialPinchDistance

      // Zoom logic - similar to moving camera or FOV
      // Adjust sensitivity as needed
      const zoomSpeed = 0.05

      // Limit zoom range
      const newZ = this.camera!.position.z - delta * zoomSpeed
      this.camera!.position.z = Math.max(2, Math.min(20, newZ))

      this.initialPinchDistance = currentDistance
      this.setSizes() // Update sizes based on new camera position if needed (though mainly for FOV/Resize)
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) {
      this.initialPinchDistance = null
    }
  }

  getPinchDistance(event: TouchEvent) {
    const dx = event.touches[0].clientX - event.touches[1].clientX
    const dy = event.touches[0].clientY - event.touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  addEventListeners() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))
    window.addEventListener('wheel', this.onWheel.bind(this))

    window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false })
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false })
    window.addEventListener('touchend', this.onTouchEnd.bind(this))
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
  }

  createGallery() {
    this.gallery = new Gallery({
      scene: this.scene!,
      cameraZ: this.camera!.position.z,
    })
  }

  createHelpers() {
    const axesHelper = new THREE.AxesHelper(1)
    this.scene?.add(axesHelper)
  }

  onWheel(event: WheelEvent) {
    // console.log(event.deltaY)

    const normalizedWheel = normalizeWheel(event)

    const delta = event.deltaY
    let value = Math.sign(event.deltaY)

    if (delta === 0) {
      value = this.lastDirection
    }
    else {
      this.lastDirection = value
    }

    this.gallery!.updateScroll(
      (normalizedWheel.pixelY * this.sizes!.height) / window.innerHeight,
      this.lastDirection,
    )
  }

  render() {
    this.time = this.clock!.getElapsedTime()

    this.orbitControls?.update()
    this.gallery!.render(this.time)

    this.renderer!.render(this.scene!, this.camera!)
  }
}
