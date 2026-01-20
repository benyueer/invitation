export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroid() {
  return /Android/.test(navigator.userAgent)
}

export function openMap(placeName: string) {
  const encoded = encodeURIComponent(placeName)

  // iOS（Apple Maps，成功率最高）
  const iosUrl = `https://maps.apple.com/?q=${encoded}`

  // Android（原生 geo）
  const androidUrl = `geo:0,0?q=${encoded}`

  // 兜底 Web（高德 Web，可换百度 / Google）
  const webUrl = `https://www.amap.com/search?query=${encoded}`

  if (isIOS()) {
    // iOS：直接走 Apple Maps（https）
    window.location.href = iosUrl
    return
  }

  if (isAndroid()) {
    // Android：尝试 geo
    window.location.href = androidUrl

    // 防止失败，延迟兜底
    setTimeout(() => {
      window.location.href = webUrl
    }, 800)

    return
  }

  // 其它（桌面等）
  window.open(webUrl, '_blank')
}
