import type { Perspective } from './types'
import { randomPick } from '@/utils/imageData'

export const images = randomPick('webp', 'high', 10, 'v')

export const perspectives: Perspective[] = [
  {
    title: '我们结婚啦！！！😄',
    description: 'we married',
    position: 'top',
  },
  {
    title: '欢迎参加我们的婚礼',
    description: 'we are happy',
    position: 'center',
  },
  {
    title: '我们很高兴',
    description: 'we are happy',
    position: 'center',
  },
  {
    title: 'welcome to our wedding',
    position: 'bottom',
  },
]

export const cylinderConfig = {
  radius: window.innerWidth > 768 ? 2.5 : 2.2,
  height: window.innerWidth > 768 ? 2 : 1.2,
  radialSegments: 64,
  heightSegments: 1,
}

export const particleConfig = {
  numParticles: 12,
  particleRadius: 3.3, // cylinderRadius + 0.8
  segments: 20,
  angleSpan: 0.3,
}

export const imageConfig = {
  width: 1024,
  height: 1024,
}
