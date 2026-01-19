import type { Size } from './types/types'
import gsap from 'gsap'
import normalizeWheel from 'normalize-wheel'
import * as THREE from 'three'
import { randomPick } from '@/utils/imageData'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'

interface Props {
  scene: THREE.Scene
  sizes: Size
}

interface ImageInfo {
  width: number
  height: number
  aspectRatio: number
  uvs: {
    xStart: number
    xEnd: number
    yStart: number
    yEnd: number
  }
}

export default class Magazine {
  scene: THREE.Scene
  instancedMesh: THREE.InstancedMesh | undefined
  geometry: THREE.BoxGeometry | undefined
  material: THREE.ShaderMaterial | undefined
  meshCount: number = 30
  // meshCount: number = 6
  pageThickness: number = 0.01
  pageSpacing: number = 1
  pageDimensions: {
    width: number
    height: number
  }

  scrollY: {
    target: number
    current: number
    direction: number
  }

  sizes: Size
  imageInfos: ImageInfo[] = []
  atlasTexture: THREE.Texture | null = null

  // Touch handling properties
  touch: {
    startX: number
    lastX: number
    isActive: boolean
  }

  handlers: any[] = []

  constructor({ scene, sizes }: Props) {
    this.scene = scene
    this.sizes = sizes

    this.pageDimensions = {
      width: 2,
      height: 3,
    }
    this.scrollY = {
      target: 0,
      current: 0,
      direction: -1,
    }

    this.touch = {
      startX: 0,
      lastX: 0,
      isActive: false,
    }

    this.createGeometry()

    this.loadTextureAtlas().then(() => {
      this.createMaterial()
      this.createMeshes()

      // let progress = {
      //   value: 0,
      // }

      // this.debug
      //   .add(this.material.uniforms.uProgress, "value", 0, 1)
      //   .name("progress")
      //   .onChange((value: number) => {
      //     this.material.uniforms.uProgress.value = value
      //   })
      //   .min(0)
      //   .max(1)
      //   .step(0.001)
      //   .listen()

      // let reset = false
      // let anim: gsap.core.Timeline
      // let recordScroll = false

      // document.body.addEventListener("click", () => {
      //   if (reset) {
      //     reset = false
      //     anim?.kill()
      //     this.material.uniforms.uProgress.value = 0
      //     this.material.uniforms.uSplitProgress.value = 0
      //     window.removeEventListener("wheel", this.onWheel.bind(this))
      //     this.resetScroll()
      //   } else {
      //     reset = true
      //     anim = gsap.timeline()

      //     anim.fromTo(
      //       this.material.uniforms.uProgress,
      //       { value: 0 },
      //       {
      //         value: 1,
      //         duration: 5,
      //         //duration: 0,
      //         ease: "power2.inOut",
      //       }
      //     )
      //     anim.fromTo(
      //       this.material.uniforms.uSplitProgress,
      //       { value: 0 },
      //       {
      //         value: 1,
      //         duration: 1,
      //         //duration: 0,
      //         ease: "power2.inOut",
      //       },
      //       "-=0.6"
      //     )

      //     anim.call(() => {
      //       window.addEventListener("wheel", this.onWheel.bind(this))
      //     })
      //   }
      // })

      const anim = gsap.timeline()

      anim.fromTo(
        this.material!.uniforms.uProgress,
        { value: 0 },
        {
          value: 1,
          duration: 5,
          // duration: 0,
          ease: 'power2.inOut',
        },
      )
      anim.fromTo(
        this.material!.uniforms.uSplitProgress,
        { value: 0 },
        {
          value: 1,
          duration: 1,
          // duration: 0,
          ease: 'power2.inOut',
        },
        '-=0.6',
      )

      anim.call(() => {
        window.addEventListener('wheel', this.onWheel.bind(this))
        this.addTouchListeners()
      })
    })
  }

  async loadTextureAtlas() {
    // Define your image paths
    const imagePaths = randomPick('webp', 'high', 30)

    // Load all images first to get their dimensions
    const imagePromises = imagePaths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = path
      })
    })

    const images = await Promise.all(imagePromises)

    // Calculate atlas dimensions (for simplicity, we'll stack images vertically)
    const atlasWidth = Math.max(...images.map(img => img.width))
    let totalHeight = 0

    // First pass: calculate total height
    images.forEach((img) => {
      totalHeight += img.height
    })

    // Create canvas with calculated dimensions
    const canvas = document.createElement('canvas')
    canvas.width = atlasWidth
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')!

    // Second pass: draw images and calculate normalized coordinates
    let currentY = 0
    this.imageInfos = images.map((img) => {
      const aspectRatio = img.width / img.height

      // Draw the image
      ctx.drawImage(img, 0, currentY)

      // Calculate normalized coordinates

      const info = {
        width: img.width,
        height: img.height,
        aspectRatio,
        uvs: {
          xStart: 0,
          xEnd: img.width / atlasWidth,
          yStart: 1 - currentY / totalHeight,
          yEnd: 1 - (currentY + img.height) / totalHeight,
        },
      }

      currentY += img.height
      return info
    })

    // Create texture from canvas
    this.atlasTexture = new THREE.Texture(canvas)
    this.atlasTexture.needsUpdate = true
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      // side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uProgress: new THREE.Uniform(0),
        uSplitProgress: new THREE.Uniform(0),
        uPageThickness: new THREE.Uniform(this.pageThickness),
        uPageWidth: new THREE.Uniform(this.pageDimensions.width),
        uPageHeight: new THREE.Uniform(this.pageDimensions.height),
        uMeshCount: new THREE.Uniform(this.meshCount),
        uTime: new THREE.Uniform(0),
        uAtlas: new THREE.Uniform(this.atlasTexture),
        uScrollY: { value: 0 },
        // Calculate total length of the gallery
        uSpeedY: { value: 0 },
        uPageSpacing: new THREE.Uniform(this.pageSpacing),
      },
    })
  }

  onWheel(event: MouseEvent) {
    const normalizedWheel = normalizeWheel(event)

    const scrollY = (normalizedWheel.pixelY * this.sizes.height) / window.innerHeight

    this.scrollY.target += scrollY

    this.material!.uniforms.uSpeedY.value += scrollY
  }

  addTouchListeners() {
    const a = this.onTouchStart.bind(this)
    const b = this.onTouchMove.bind(this)
    const c = this.onTouchEnd.bind(this)
    this.handlers.push(a, b, c)
    window.addEventListener('touchstart', a, {
      passive: false,
    })
    window.addEventListener('touchmove', b, {
      passive: false,
    })
    window.addEventListener('touchend', c, {
      passive: false,
    })
  }

  removeTouchListeners() {
    this.handlers.forEach((handler) => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('touchmove', handler)
      window.removeEventListener('touchend', handler)
    })
  }

  onTouchStart(event: TouchEvent) {
    if ((event.target as HTMLElement).tagName !== 'CANVAS')
      return

    event.preventDefault()
    const touch = event.touches[0]
    this.touch.startX = touch.clientX
    this.touch.lastX = touch.clientX
    this.touch.isActive = true
  }

  onTouchMove(event: TouchEvent) {
    if (!this.touch.isActive)
      return

    event.preventDefault()
    const touch = event.touches[0]
    const deltaX = this.touch.lastX - touch.clientX

    // Scale the touch movement to match wheel sensitivity
    const scrollY = ((deltaX * this.sizes.height) / window.innerHeight) * 2

    this.scrollY.target += scrollY
    this.material!.uniforms.uSpeedY.value += scrollY

    this.touch.lastX = touch.clientX
  }

  onTouchEnd(event: TouchEvent) {
    event.preventDefault()
    this.touch.isActive = false
  }

  resetScroll() {
    this.scrollY = {
      target: 0,
      current: 0,
      direction: -1,
    }

    this.touch = {
      startX: 0,
      lastX: 0,
      isActive: false,
    }

    this.material!.uniforms.uSpeedY.value = 0
    this.material!.uniforms.uScrollY.value = 0
  }

  createGeometry() {
    this.geometry = new THREE.BoxGeometry(
      this.pageDimensions.width,
      this.pageDimensions.height,
      this.pageThickness,
      50,
      50,
      1,
    )
  }

  createMeshes() {
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.meshCount,
    )

    const aTextureCoords = new Float32Array(this.meshCount * 4)
    const aIndex = new Float32Array(this.meshCount)

    for (let i = 0; i < this.meshCount; i++) {
      const imageIndex = i % this.imageInfos.length

      aTextureCoords[i * 4 + 0] = this.imageInfos[imageIndex].uvs.xStart
      aTextureCoords[i * 4 + 1] = this.imageInfos[imageIndex].uvs.xEnd
      aTextureCoords[i * 4 + 2] = this.imageInfos[imageIndex].uvs.yStart
      aTextureCoords[i * 4 + 3] = this.imageInfos[imageIndex].uvs.yEnd

      aIndex[i] = i
    }

    this.instancedMesh.geometry.setAttribute(
      'aTextureCoords',
      new THREE.InstancedBufferAttribute(aTextureCoords, 4),
    )

    // this.instancedMesh.geometry.setAttribute(
    //   "aPosition",
    //   new THREE.InstancedBufferAttribute(positions, 3)
    // )

    this.instancedMesh.geometry.setAttribute(
      'aIndex',
      new THREE.InstancedBufferAttribute(aIndex, 1),
    )

    this.scene.add(this.instancedMesh)
  }

  onResize(sizes: Size) {
    this.sizes = sizes
  }

  updateScroll(scrollY: number) {
    this.scrollY.target += scrollY

    this.material!.uniforms.uSpeedY.value += scrollY
  }

  render() {
    if (this.material) {
      this.scrollY.current = gsap.utils.interpolate(
        this.scrollY.current,
        this.scrollY.target,
        0.12,
      )

      this.material.uniforms.uScrollY.value = this.scrollY.current

      this.material.uniforms.uSpeedY.value *= 0.835
    }
  }

  destroy() {
    this.scene.remove(this.instancedMesh!)
    this.instancedMesh?.dispose()
    this.geometry?.dispose()
    this.material?.dispose()
    this.atlasTexture?.dispose()
    this.removeTouchListeners()
  }
}
