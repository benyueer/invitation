import type { LeafHandles } from '@/components/Leaf'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import Leaf from '@/components/Leaf'

gsap.registerPlugin(ScrollTrigger)

const TIMELINE_DATA = [
  {
    year: '2020',
    title: '初次相遇',
    desc: '在那一个阳光明媚的午后，我们在校园的图书馆偶遇。',
    side: 'left',
  },
  {
    year: '2021',
    title: '确定心意',
    desc: '跨年夜的烟火下，我们许下了相守一生的诺言。',
    side: 'right',
  },
  {
    year: '2022',
    title: '共同旅行',
    desc: '大理的洱海边，留下了我们无数欢声笑语。',
    side: 'left',
  },
  {
    year: '2023',
    title: '见证成长',
    desc: '我们一起面对生活的挑战，成为了彼此最坚强的后盾。',
    side: 'right',
  },
  {
    year: '2024',
    title: '共筑爱巢',
    desc: '我们开始筹备属于我们自己的小家，每一个角落都充满爱。',
    side: 'left',
  },
  {
    year: '2025',
    title: '执子之手',
    desc: '今天，我们在亲友的见证下，正式开启新的人生篇章。',
    side: 'right',
  },
]

export default function Anmi() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const leafRef = useRef<LeafHandles>(null)

  useEffect(() => {
    if (!containerRef.current || !lineRef.current)
      return
    ScrollTrigger.refresh()

    const lineTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        scroller: containerRef.current.parentElement,
      },
    })
    lineTimeline
      .fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.2,
          ease: 'cinematicSmooth',
        },
      )
      .to(lineRef.current, {
        scaleY: 0.8,
        duration: 0.7,
        ease: 'cinematicSmooth',
      })
      .to(lineRef.current, {
        scaleY: 0,
        duration: 0.2,
        ease: 'cinematicSmooth',
        onComplete: () => {
          leafRef.current?.showAll()
        },
      })
      .to(lineRef.current, {
        scaleY: 0,
        duration: 0.1,
        ease: 'cinematicSmooth',
      })

    // 2. 节点弹出动画
    const nodes = containerRef.current.querySelectorAll('.timeline-node')
    nodes.forEach((node) => {
      const side = node.getAttribute('data-side')
      const xOffset = side === 'left' ? -50 : 50

      gsap.fromTo(
        node,
        {
          opacity: 0,
          x: xOffset,
          scale: 0.5,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1,
          scrollTrigger: {
            trigger: node,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1,
            scroller: containerRef.current!.parentElement,
          },
        },
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <div className="w-full h-screen overflow-scroll">
      <div
        ref={containerRef}
        className="relative w-full min-h-[300vh] py-20 px-4 bg-[#fdfaf5] font-sans selection:bg-[#D4AF37]/30"
      >
        {/* 装饰性背景 */}
        <div className="fixed inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px]" />

        <h1 className="text-center text-4xl font-serif italic mb-32 tracking-[0.2em] text-[#5D4037]">
          我们的故事
        </h1>

        {/* 垂直树干 */}
        <div
          ref={lineRef}
          className="fixed left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent origin-top z-0"
          style={{ transform: 'translateX(-50%)' }}
        />

        {/* 时间线内容 */}
        <div className="relative z-10 space-y-[30vh]">
          {TIMELINE_DATA.map((item, index) => (
            <div
              key={index}
              data-side={item.side}
              className={`timeline-node flex w-full items-center ${item.side === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* 内容区域 */}
              <div
                className={`w-[45%] p-6 rounded-2xl bg-white/60 backdrop-blur-md shadow-lg border border-[#D4AF37]/20 ${item.side === 'left' ? 'mr-[5%] text-right' : 'ml-[5%] text-left'}`}
              >
                <div className="text-2xl font-bold text-[#D4AF37] mb-2 font-serif italic">
                  {item.year}
                </div>
                <h3 className="text-xl font-medium text-[#5D4037] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#8B735B]">
                  {item.desc}
                </p>
              </div>

              {/* 中心圆点 */}
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#D4AF37] shadow-[0_0_10px_#D4AF37] z-20" />

              {/* 占位符 */}
              <div className="w-[45%]" />
            </div>
          ))}
        </div>

        <div className="mt-60 text-center pb-20">
          <p className="text-sm italic text-[#D4AF37] tracking-widest font-serif opacity-60">
            To Be Continued...
          </p>
        </div>
      </div>
      <div className="h-200vh relative overflow-auto">
        <div className="h-100vh absolute top-0 left-0 right-0 pointer-events-none">
          <Leaf ref={leafRef} />
        </div>
        <div className="h-100vh bg-red-200"></div>
      </div>
    </div>
  )
}
