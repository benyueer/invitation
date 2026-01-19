import type { Perspective } from './types'

export const images = [
  '/img/1.jpg',
  // './img/2.jpg',
  // './img/3.jpg',
  // './img/4.jpg',
  // './img/1.jpg',
  // './img/2.jpg',
  // './img/3.jpg',
  // './img/4.jpg',
  // './img/1.jpg',
  // './img/2.jpg',
  // './img/3.jpg',
  // './img/4.jpg',
]

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
    title: '我们很高兴',
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
