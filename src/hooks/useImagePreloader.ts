import { useEffect, useState } from 'react'

export function useImagePreloader(imageUrls: string[]) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let loadedCount = 0
    const totalCount = imageUrls.length

    if (totalCount === 0) {
      setLoading(false)
      return
    }

    const handleImageLoad = () => {
      loadedCount++
      const currentProgress = Math.round((loadedCount / totalCount) * 100)
      setProgress(currentProgress)

      if (loadedCount === totalCount) {
        setLoading(false)
      }
    }

    const handleImageError = (url: string) => {
      console.error(`Failed to load image: ${url}`)
      handleImageLoad() // Still increment to avoid getting stuck
    }

    imageUrls.forEach((url) => {
      const img = new Image()
      img.src = url
      img.onload = handleImageLoad
      img.onerror = () => handleImageError(url)
    })
  }, [imageUrls])

  return { loading, progress }
}
