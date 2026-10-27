"use client";

import { useEffect, useRef } from "react";

export function AnimatedPonds() {
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const canvasRef3 = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvases = [canvasRef1, canvasRef2, canvasRef3];
    const contexts: CanvasRenderingContext2D[] = [];
    const animations: number[] = [];

    canvases.forEach((canvasRef, index) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      contexts.push(ctx);

      const width = canvas.width;
      const height = canvas.height;
      let time = index * 100;

      const animate = () => {
        time += 0.02;

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          width / 2
        );

        const blueShift = Math.sin(time) * 0.3 + 0.5;
        const greenShift = Math.cos(time * 1.3) * 0.3 + 0.5;

        gradient.addColorStop(0, `rgba(50, ${100 + greenShift * 100}, ${150 + blueShift * 50}, 0.7)`);
        gradient.addColorStop(0.5, `rgba(30, ${80 + greenShift * 80}, ${120 + blueShift * 40}, 0.6)`);
        gradient.addColorStop(1, `rgba(20, ${60 + greenShift * 60}, ${90 + blueShift * 30}, 0.4)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
          const waveTime = time + i * 2;
          const waveRadius = (width / 3) * (1 + Math.sin(waveTime) * 0.2);
          const waveOpacity = 0.15 + Math.sin(waveTime) * 0.1;

          ctx.strokeStyle = `rgba(100, 200, 220, ${waveOpacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(width / 2, height / 2, waveRadius, waveRadius * 0.9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        const rippleCount = 5;
        for (let i = 0; i < rippleCount; i++) {
          const rippleTime = time * 0.8 + i * 0.5;
          const rippleX = width / 2 + Math.sin(rippleTime * 2) * 15;
          const rippleY = height / 2 + Math.cos(rippleTime * 1.5) * 12;
          const rippleSize = 3 + Math.sin(rippleTime * 3) * 2;
          const rippleOpacity = 0.3 + Math.sin(rippleTime * 4) * 0.2;

          const rippleGradient = ctx.createRadialGradient(
            rippleX,
            rippleY,
            0,
            rippleX,
            rippleY,
            rippleSize
          );
          rippleGradient.addColorStop(0, `rgba(150, 230, 255, ${rippleOpacity})`);
          rippleGradient.addColorStop(1, "rgba(150, 230, 255, 0)");

          ctx.fillStyle = rippleGradient;
          ctx.beginPath();
          ctx.arc(rippleX, rippleY, rippleSize, 0, Math.PI * 2);
          ctx.fill();
        }

        animations[index] = requestAnimationFrame(animate);
      };

      animate();
    });

    return () => {
      animations.forEach((id) => {
        if (id) cancelAnimationFrame(id);
      });
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden>
      <canvas
        ref={canvasRef1}
        width={120}
        height={100}
        className="absolute left-[8%] top-[15%] opacity-80"
        style={{
          filter: "blur(0.5px)",
          mixBlendMode: "screen",
        }}
      />
      <canvas
        ref={canvasRef2}
        width={150}
        height={130}
        className="absolute right-[12%] top-[25%] opacity-75"
        style={{
          filter: "blur(0.5px)",
          mixBlendMode: "screen",
        }}
      />
      <canvas
        ref={canvasRef3}
        width={100}
        height={85}
        className="absolute bottom-[30%] left-[15%] opacity-70"
        style={{
          filter: "blur(0.5px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
