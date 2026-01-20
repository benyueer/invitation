import gsap from 'gsap'

let isAnimating = false
// eslint-disable-next-line unused-imports/no-unused-vars
let isPanelOpen = false

export const config = {
  clipPathDirection: 'top-bottom', // Direction of clip-path animation ('top-bottom', 'bottom-top', 'left-right', 'right-left')
  autoAdjustHorizontalClipPath: true, // Automatically flip horizontal clip-path direction based on panel side
  steps: 6, // Number of mover elements generated between grid item and panel
  stepDuration: 0.35, // Duration (in seconds) for each animation step
  stepInterval: 0.05, // Delay between each mover's animation start
  moverPauseBeforeExit: 0.14, // Pause before mover elements exit after entering
  rotationRange: 0, // Maximum random rotation applied to each mover's Z-axis (tilt left/right)
  wobbleStrength: 0, // Maximum random positional wobble (in pixels) applied horizontally/vertically to each mover path
  panelRevealEase: 'sine.inOut', // Easing function for panel reveal animation
  gridItemEase: 'sine', // Easing function for grid item exit animation
  moverEnterEase: 'sine.in', // Easing function for mover entering animation
  moverExitEase: 'sine', // Easing function for mover exit animation
  panelRevealDurationFactor: 2, // Multiplier to adjust panel reveal animation duration
  clickedItemDurationFactor: 2, // Multiplier to adjust clicked grid item animation duration
  gridItemStaggerFactor: 0.3, // Max delay factor when staggering grid item animations
  moverBlendMode: false, // Optional CSS blend mode for mover elements (false = no blend mode)
  pathMotion: 'linear', // Type of path movement ('linear' or 'sine')
  sineAmplitude: 50, // Amplitude of sine wave for pathMotion 'sine'
  sineFrequency: Math.PI, // Frequency of sine wave for pathMotion 'sine'
}

const originalConfig = { ...config }

export function extractItemConfigOverrides(item: HTMLElement) {
  const overrides: any = {}

  if (item.dataset.clipPathDirection)
    overrides.clipPathDirection = item.dataset.clipPathDirection
  if (item.dataset.steps)
    overrides.steps = Number.parseInt(item.dataset.steps)
  if (item.dataset.stepDuration)
    overrides.stepDuration = Number.parseFloat(item.dataset.stepDuration)
  if (item.dataset.stepInterval)
    overrides.stepInterval = Number.parseFloat(item.dataset.stepInterval)
  if (item.dataset.rotationRange)
    overrides.rotationRange = Number.parseFloat(item.dataset.rotationRange)
  if (item.dataset.wobbleStrength)
    overrides.wobbleStrength = Number.parseFloat(item.dataset.wobbleStrength)
  if (item.dataset.moverPauseBeforeExit) {
    overrides.moverPauseBeforeExit = Number.parseFloat(
      item.dataset.moverPauseBeforeExit,
    )
  }
  if (item.dataset.panelRevealEase)
    overrides.panelRevealEase = item.dataset.panelRevealEase
  if (item.dataset.gridItemEase)
    overrides.gridItemEase = item.dataset.gridItemEase
  if (item.dataset.moverEnterEase)
    overrides.moverEnterEase = item.dataset.moverEnterEase
  if (item.dataset.moverExitEase)
    overrides.moverExitEase = item.dataset.moverExitEase
  if (item.dataset.panelRevealDurationFactor) {
    overrides.panelRevealDurationFactor = Number.parseFloat(
      item.dataset.panelRevealDurationFactor,
    )
  }
  if (item.dataset.clickedItemDurationFactor) {
    overrides.clickedItemDurationFactor = Number.parseFloat(
      item.dataset.clickedItemDurationFactor,
    )
  }
  if (item.dataset.gridItemStaggerFactor) {
    overrides.gridItemStaggerFactor = Number.parseFloat(
      item.dataset.gridItemStaggerFactor,
    )
  }
  if (item.dataset.moverBlendMode)
    overrides.moverBlendMode = item.dataset.moverBlendMode
  if (item.dataset.pathMotion)
    overrides.pathMotion = item.dataset.pathMotion
  if (item.dataset.sineAmplitude)
    overrides.sineAmplitude = Number.parseFloat(item.dataset.sineAmplitude)
  if (item.dataset.sineFrequency)
    overrides.sineFrequency = Number.parseFloat(item.dataset.sineFrequency)

  return overrides
}

function getElementCenter(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export function positionPanelBasedOnClick(panel: HTMLElement, clickedItem: HTMLElement) {
  const centerX = getElementCenter(clickedItem).x
  const windowHalf = window.innerWidth / 2

  const isLeftSide = centerX < windowHalf

  if (isLeftSide) {
    panel.classList.add('panel--right')
  }
  else {
    panel.classList.remove('panel--right')
  }

  // ✨ New logic to flip clipPathDirection if enabled
  if (config.autoAdjustHorizontalClipPath) {
    if (
      config.clipPathDirection === 'left-right'
      || config.clipPathDirection === 'right-left'
    ) {
      config.clipPathDirection = isLeftSide ? 'left-right' : 'right-left'
    }
  }
}

export function extractItemData(item: HTMLElement) {
  const imgDiv = item.querySelector('.rgrid__item-image')
  const caption = item.querySelector('figcaption')
  return {
    imgURL: (imgDiv as HTMLElement)?.style.backgroundImage,
    title: caption?.querySelector('h3')?.textContent,
    desc: caption?.querySelector('p')?.textContent,
  }
}

export function computeStaggerDelays(clickedItem: HTMLElement, items: NodeListOf<HTMLElement>) {
  const baseCenter = getElementCenter(clickedItem)
  const distances = Array.from(items).map((el) => {
    const center = getElementCenter(el)
    return Math.hypot(center.x - baseCenter.x, center.y - baseCenter.y)
  })
  const max = Math.max(...distances)
  return distances.map(d => (d / max) * config.gridItemStaggerFactor)
}

function getClipPathsForDirection(direction: string) {
  switch (direction) {
    case 'bottom-top':
      return {
        from: 'inset(0% 0% 100% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(100% 0% 0% 0%)',
      }
    case 'left-right':
      return {
        from: 'inset(0% 100% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 0% 0% 100%)',
      }
    case 'right-left':
      return {
        from: 'inset(0% 0% 0% 100%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 100% 0% 0%)',
      }
    case 'top-bottom':
    default:
      return {
        from: 'inset(100% 0% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 0% 100% 0%)',
      }
  }
}

export function animateGridItems(items: NodeListOf<HTMLElement>, clickedItem: HTMLElement, delays: number[]) {
  const clipPaths = getClipPathsForDirection(config.clipPathDirection)

  gsap.to(items, {
    opacity: 0,
    scale: (_i, el) => (el === clickedItem ? 1 : 0.8),
    duration: (_i, el) =>
      el === clickedItem
        ? config.stepDuration * config.clickedItemDurationFactor
        : 0.3,
    ease: config.gridItemEase,
    clipPath: (_i, el) => (el === clickedItem ? clipPaths.from : 'none'),
    delay: i => delays[i],
  })
}

// function hideFrame() {
//   gsap.to(frame, {
//     opacity: 0,
//     duration: 0.5,
//     ease: 'sine.inOut',
//     pointerEvents: 'none',
//   })
// }

function scheduleCleanup(movers: NodeListOf<HTMLElement>) {
  const cleanupDelay
    = config.steps * config.stepInterval
      + config.stepDuration * 2
      + config.moverPauseBeforeExit
  gsap.delayedCall(cleanupDelay, () => movers.forEach(m => m.remove()))
}

function revealPanel(endImg: HTMLElement) {
  const clipPaths = getClipPathsForDirection(config.clipPathDirection)

  const panel = document.querySelector('.panel') // Panel container
  const panelContent = panel?.querySelector('.panel__content') // Panel content

  gsap.set(panelContent!, { opacity: 0 })
  gsap.set(panel, { opacity: 1, pointerEvents: 'auto' })

  gsap
    .timeline({
      defaults: {
        duration: config.stepDuration * config.panelRevealDurationFactor,
        ease: config.panelRevealEase,
      },
    })
    .fromTo(
      endImg,
      { clipPath: clipPaths.hide },
      {
        clipPath: clipPaths.reveal,
        pointerEvents: 'auto',
        delay: config.steps * config.stepInterval,
      },
    )
    .fromTo(
      panelContent!,
      { y: 25 },
      {
        duration: 1,
        ease: 'expo',
        opacity: 1,
        y: 0,
        delay: config.steps * config.stepInterval,
        onComplete: () => {
          isAnimating = false
          isPanelOpen = true
        },
      },
      '<-=.2',
    )
}

function createMoverStyle(step: any, index: number, imgURL: string) {
  const style = {
    backgroundImage: imgURL,
    position: 'fixed',
    left: step.left,
    top: step.top,
    width: step.width,
    height: step.height,
    clipPath: getClipPathsForDirection(config.clipPathDirection).from,
    zIndex: 1000 + index,
    backgroundPosition: '50% 50%',
    rotationZ: gsap.utils.random(-config.rotationRange, config.rotationRange),
  }
  if (config.moverBlendMode)
    (style as any).mixBlendMode = config.moverBlendMode
  return style
}

function hideFrame() {
  const frame = document.querySelectorAll(['.frame', '.heading'] as any)
  gsap.to(frame, {
    opacity: 0,
    duration: 0.5,
    ease: 'sine.inOut',
    pointerEvents: 'none',
  })
}

export function animateTransition(startEl: HTMLElement, endEl: HTMLElement, imgURL: string) {
  hideFrame()

  // Generate path between start and end
  const path = generateMotionPath(
    startEl.getBoundingClientRect(),
    endEl.getBoundingClientRect(),
    config.steps,
  )
  const fragment = document.createDocumentFragment()
  const clipPaths = getClipPathsForDirection(config.clipPathDirection)

  // Create and animate movers
  path.forEach((step, index) => {
    const mover = document.createElement('div')
    mover.className = 'mover'
    gsap.set(mover, createMoverStyle(step, index, imgURL))
    fragment.appendChild(mover)

    const delay = index * config.stepInterval
    gsap
      .timeline({ delay })
      .fromTo(
        mover,
        { opacity: 0.4, clipPath: clipPaths.hide },
        {
          opacity: 1,
          clipPath: clipPaths.reveal,
          duration: config.stepDuration,
          ease: config.moverEnterEase,
        },
      )
      .to(
        mover,
        {
          clipPath: clipPaths.from,
          duration: config.stepDuration,
          ease: config.moverExitEase,
        },
        `+=${config.moverPauseBeforeExit}`,
      )
  })

  const grid = document.querySelector('.rgrid')!

  // Insert all movers at once
  grid.parentNode!.insertBefore(fragment, grid.nextSibling)

  // Schedule mover cleanup and panel reveal
  scheduleCleanup(document.querySelectorAll('.mover'))
  revealPanel(endEl)
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function generateMotionPath(startRect: DOMRect, endRect: DOMRect, steps: number) {
  const path = []
  const fullSteps = steps + 2
  const startCenter = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2,
  }
  const endCenter = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2,
  }

  for (let i = 0; i < fullSteps; i++) {
    const t = i / (fullSteps - 1)
    const width = lerp(startRect.width, endRect.width, t)
    const height = lerp(startRect.height, endRect.height, t)
    const centerX = lerp(startCenter.x, endCenter.x, t)
    const centerY = lerp(startCenter.y, endCenter.y, t)

    // Apply top offset (for sine motion)
    const sineOffset
      = config.pathMotion === 'sine'
        ? Math.sin(t * config.sineFrequency) * config.sineAmplitude
        : 0

    // ✨ Add random wobble
    const wobbleX = (Math.random() - 0.5) * config.wobbleStrength
    const wobbleY = (Math.random() - 0.5) * config.wobbleStrength

    path.push({
      left: centerX - width / 2 + wobbleX,
      top: centerY - height / 2 + sineOffset + wobbleY,
      width,
      height,
    })
  }

  return path.slice(1, -1)
}

function showFrame() {
  const frame = document.querySelectorAll(['.frame', '.heading'] as any)
  gsap.to(frame, {
    opacity: 1,
    duration: 0.5,
    ease: 'sine.inOut',
    pointerEvents: 'auto',
  })
}

export function resetView(item: HTMLElement) {
  if (isAnimating)
    return
  isAnimating = true

  const allItems = document.querySelectorAll('.rgrid__item')!
  const delays = computeStaggerDelays(item, allItems as NodeListOf<HTMLElement>)

  const panel = document.querySelector('.panel')!

  gsap
    .timeline({
      defaults: { duration: config.stepDuration, ease: 'expo' },
      onComplete: () => {
        panel.classList.remove('panel--right')
        isAnimating = false
        isPanelOpen = false
      },
    })
    .to(panel, { opacity: 0 })
    .add(showFrame, 0)
    .set(panel, { opacity: 0, pointerEvents: 'none' })
    .set(panel.querySelector('.panel__img'), {
      clipPath: 'inset(0% 0% 100% 0%)',
    })
    .set(allItems, { clipPath: 'none', opacity: 0, scale: 0.8 }, 0)
    .to(
      allItems,
      {
        opacity: 1,
        scale: 1,
        delay: i => delays[i],
      },
      '>',
    )

  Object.assign(config, originalConfig)
}
