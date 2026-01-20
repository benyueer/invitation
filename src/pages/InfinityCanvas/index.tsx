import type { MediaItem } from './infinite-canvas/types'
import * as React from 'react'
import { randomPick } from '@/utils/imageData'
import { InfiniteCanvas } from './infinite-canvas'
import { PageLoader } from './loader'

export default function App() {
  const [media] = React.useState<MediaItem[]>(randomPick('webp', 'high', 100).map(item => ({
    url: item,
    type: 'image',
    title: '',
    artist: '',
    year: '',
    link: '',
    width: item.includes('v') ? 335 : 512,
    height: item.includes('v') ? 512 : 335,
  })))
  const [textureProgress, setTextureProgress] = React.useState(0)

  if (!media.length) {
    return <PageLoader progress={0} />
  }

  return (
    <>
      <PageLoader progress={textureProgress} />
      <InfiniteCanvas media={media} onTextureProgress={setTextureProgress} />
    </>
  )
}
