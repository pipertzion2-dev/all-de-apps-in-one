import { useState, useEffect, useRef, useCallback } from "react";

export function IntroScreen({ onEnter }) {
  const [gone, setGone] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const clickedRef = useRef(false);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimeout(timerRef.current);
    setGone(true);
    onEnter();
  }, [onEnter]);

  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, [gone]);

  function handleClick() {
    if (doneRef.current) return;
    const v = videoRef.current;

    if (!clickedRef.current) {
      clickedRef.current = true;
      if (!v) {
        finish();
        return;
      }
      v.play().catch(finish);
      timerRef.current = setTimeout(finish, 16000);
      return;
    }

    // Second click — skip
    finish();
  }

  if (gone) return null;

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        isolation: "isolate",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(85vw, 78vh)",
          height: "min(85vw, 78vh)",
          borderRadius: "6%",
          overflow: "hidden",
        }}
      >
        {/* Static poster — always visible, prevents blank frame before video loads */}
        <img
          src="/unlock-poster.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Video on top — transparent canvas shows poster through it until frames render */}
        <video
          ref={videoRef}
          src="/unlock-video.mp4"
          muted
          playsInline
          preload="auto"
          onEnded={finish}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "'Decima Mono Pro', ui-monospace, monospace",
          fontSize: "clamp(11px, 1.4vw, 15px)",
          letterSpacing: "0.28em",
          color: "#888888",
          textTransform: "uppercase",
          fontWeight: 700,
          animation: "intro-pulse 2s ease-in-out infinite",
        }}
      >
        Press the Lock
      </div>

      <style>{`
        @keyframes intro-pulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
