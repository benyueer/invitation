import FingerprintJS from '@fingerprintjs/fingerprintjs'

async function getBrowserId() {
  const lastId = localStorage.getItem('tracker_browser_id')
  if (lastId) {
    return lastId
  }
  const fpPromise = FingerprintJS.load()

  const fp = await fpPromise
  const result = await fp.get()

  const visitorId = result.visitorId
  localStorage.setItem('tracker_browser_id', visitorId)
  return visitorId
}

/**
 * 极简埋点 SDK
 */
export class Tracker {
  browserId: string
  startTime: number
  events: any[]
  constructor() {
    this.browserId = localStorage.getItem('tracker_browser_id') || ''
    if (!this.browserId) {
      getBrowserId().then((id) => {
        this.browserId = id
      })
    }
    this.startTime = Date.now()
    this.events = [] // 暂存操作日志

    this.init()
  }

  init() {
    // 1. 监听全局点击 (统计用户操作)
    document.addEventListener(
      'click',
      () => {
        this.events.push({
          type: 'click',
          path: window.location.pathname,
          time: Date.now() - this.startTime, // 相对时间
        })
      },
      true,
    )

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendReport('leave')
      }
    })
  }

  // 手动埋点接口
  log(action: string, payload: any) {
    this.events.push({ type: 'custom', action, payload, time: Date.now() })
  }

  // 发送数据
  sendReport(type: string) {
    const duration = Date.now() - this.startTime

    const schema = {
      browser_id: this.browserId,
      event_type: type, // 'leave' 或其他
      url: window.location.href,
      duration_ms: duration, // 页面停留时长 (毫秒)
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      operations: this.events, // 用户在页面期间的所有操作记录
    }

    const blob = new Blob([JSON.stringify(schema)], {
      type: 'application/json',
    })

    navigator.sendBeacon(import.meta.env.VITE_TRACKER_REPORT_URL || '/receive-data', blob)
    this.events = []
  }
}

export const tracker = new Tracker()
