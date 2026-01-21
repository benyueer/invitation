import { useEffect, useRef, useState } from "react";

/**
 * Radio 组件：处理背景音乐播放及旋转动画
 * 解决了浏览器自动播放限制导致刷新后无声音的问题
 */
export default function Radio() {
  // 用户想要播放的状态（从缓存恢复）
  const [isDesiredPlaying, setIsDesiredPlaying] = useState(() => {
    const saved = localStorage.getItem("bg_music_playing");
    // 默认开启，但需尊重之前的设置
    return saved === null ? true : saved === "true";
  });

  // 音频是否真正正在播放（用于控制旋转动画）
  // 只有当音频实际开始播放时，控件才会开始转动
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // 尝试播放的稳健函数
  const playAudio = async () => {
    if (audioRef.current && isDesiredPlaying) {
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          // playPromise 成功后，已通过事件监听器设置 isActuallyPlaying
        }
      } catch (error) {
        // 捕获浏览器阻止自动播放的错误
        console.log("Playback failed or was prevented:", error);
        // 此处不设置 isDesiredPlaying 为 false，因为用户可能仍然希望在交互后播放
        setIsActuallyPlaying(false);
      }
    }
  };

  // 监听音频原生事件以同步视觉状态
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlaying = () => setIsActuallyPlaying(true);
    const handlePause = () => setIsActuallyPlaying(false);

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  // 当用户播放意愿改变时执行动作
  useEffect(() => {
    if (!audioRef.current) return;

    if (isDesiredPlaying) {
      playAudio();
    } else {
      audioRef.current.pause();
    }

    localStorage.setItem("bg_music_playing", isDesiredPlaying.toString());
  }, [isDesiredPlaying]);

  // 处理浏览器自动播放限制：在用户第一次有效交互时尝试启动音频
  // 浏览器通常在任意 click, touchstart, mousedown, keydown 后允许播放
  useEffect(() => {
    // 如果用户本来就不想播，或者已经在播了，就不需要监听了
    if (!isDesiredPlaying || isActuallyPlaying) return;

    const handleFirstInteraction = () => {
      // 再次检查此时是否仍需播放且未在播
      if (isDesiredPlaying && !isActuallyPlaying) {
        playAudio();
      }
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, {
      passive: true,
    });
    window.addEventListener("mousedown", handleFirstInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", handleFirstInteraction, {
      passive: true,
    });

    return removeListeners;
  }, [isDesiredPlaying, isActuallyPlaying]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 关键修复：如果用户希望播放但实际上被浏览器阻止了（即 isActuallyPlaying 为 false）
    // 那么第一次点击按钮时，应该尝试播放，而不是切换到“不想播放”的状态
    if (isDesiredPlaying && !isActuallyPlaying) {
      playAudio();
    } else {
      setIsDesiredPlaying(!isDesiredPlaying);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[10000]">
      <audio
        ref={audioRef}
        src="/music/a_thousand_years.m4a"
        loop
        preload="auto"
      />

      <button
        id="bg-music-toggle"
        onTouchEnd={togglePlay}
        className={`w-12 h-12 flex z-99999 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg text-red-600 transition-all active:scale-90 ${
          isActuallyPlaying ? "animate-spin animate-duration-3000" : ""
        }`}
        aria-label={isActuallyPlaying ? "Pause Music" : "Play Music"}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          className={isActuallyPlaying ? "opacity-100" : "opacity-60"}
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </button>

      {/* 音乐播放时的音符动画 */}
      {isActuallyPlaying && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-2 -left-2 animate-bounce animate-delay-100 opacity-60">
            🎵
          </div>
          <div className="absolute -bottom-2 -right-2 animate-bounce animate-delay-500 opacity-60">
            🎶
          </div>
        </div>
      )}
    </div>
  );
}
