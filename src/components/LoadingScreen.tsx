import gsap from "gsap";
import { useEffect, useRef } from "react";

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Subtle breathing animation for the background
    gsap.to(containerRef.current, {
      backgroundColor: "#fdf2f2",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Animation for the text
    gsap.fromTo(
      textRef.current,
      { opacity: 0.3, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      },
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fffafa]"
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Decorative circle */}
        <div className="absolute inset-0 border-2 border-red-100 rounded-full animate-pulse"></div>
        <div className="absolute inset-4 border border-red-50 rounded-full animate-ping"></div>

        {/* Large Xi character or heart icon placeholder since I don't have the asset here, 
            but I can use a styled div or a CSS heart */}
        <div
          className="text-6xl text-red-600 font-bold"
          style={{ fontFamily: "uzxp" }}
        >
          囍
        </div>
      </div>

      <div
        ref={textRef}
        className="mt-8 text-red-700 text-2xl font-bold tracking-widest"
        style={{ fontFamily: "uzxp" }}
      >
        开启幸福时刻...
      </div>

      <div className="mt-4 w-48 h-1 bg-red-50 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-red-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="mt-2 text-red-400 text-sm font-medium">{progress}%</div>
    </div>
  );
}
