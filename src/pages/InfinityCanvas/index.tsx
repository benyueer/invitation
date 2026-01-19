import type { MediaItem } from './infinite-canvas/types'
import * as React from 'react'
import manifest from './artworks/manifest.json'
import { InfiniteCanvas } from './infinite-canvas'
import { PageLoader } from './loader'

export default function App() {
  const [media] = React.useState<MediaItem[]>(manifest)
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
