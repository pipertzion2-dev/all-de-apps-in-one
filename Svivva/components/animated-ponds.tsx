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
        try {
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

          const blueShift = Math.sin(time) * 0.4 + 0.6;
          const greenShift = Math.cos(time * 1.3) * 0.4 + 0.6;
          const redShift = Math.sin(time * 0.7) * 0.4 + 0.6;
          const purpleShift = Math.cos(time * 1.7) * 0.4 + 0.6;

          // Camo multi-color gradient matching the flowers
          gradient.addColorStop(0, `rgba(${150 + redShift * 100}, ${100 + greenShift * 80}, ${180 + blueShift * 75}, 0.6)`);
          gradient.addColorStop(0.3, `rgba(${120 + purpleShift * 80}, ${80 + blueShift * 100}, ${200 + greenShift * 55}, 0.55)`);
          gradient.addColorStop(0.6, `rgba(${90 + greenShift * 90}, ${150 + redShift * 70}, ${140 + purpleShift * 60}, 0.5)`);
          gradient.addColorStop(1, `rgba(${100 + blueShift * 70}, ${130 + purpleShift * 60}, ${170 + redShift * 50}, 0.45)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          for (let i = 0; i < 3; i++) {
            const waveTime = time + i * 2;
            const waveRadius = (width / 3) * (1 + Math.sin(waveTime) * 0.2);
            const waveOpacity = 0.25 + Math.sin(waveTime) * 0.15;
            
            // Camo-colored waves
            const waveR = 140 + Math.sin(waveTime * 1.1) * 60;
            const waveG = 120 + Math.cos(waveTime * 0.9) * 80;
            const waveB = 160 + Math.sin(waveTime * 1.3) * 70;

            ctx.strokeStyle = `rgba(${waveR}, ${waveG}, ${waveB}, ${waveOpacity})`;
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
            const rippleSize = 4 + Math.sin(rippleTime * 3) * 2;
            const rippleOpacity = 0.3 + Math.sin(rippleTime * 4) * 0.2;
            
            // Camo-colored ripples
            const ripR = 150 + Math.cos(rippleTime * 1.2) * 70;
            const ripG = 130 + Math.sin(rippleTime * 0.8) * 90;
            const ripB = 170 + Math.cos(rippleTime * 1.5) * 60;

            const rippleGradient = ctx.createRadialGradient(
              rippleX,
              rippleY,
              0,
              rippleX,
              rippleY,
              rippleSize
            );
            rippleGradient.addColorStop(0, `rgba(${ripR}, ${ripG}, ${ripB}, ${rippleOpacity})`);
            rippleGradient.addColorStop(1, `rgba(${ripR * 0.7}, ${ripG * 0.7}, ${ripB * 0.7}, 0)`);

            ctx.fillStyle = rippleGradient;
            ctx.beginPath();
            ctx.arc(rippleX, rippleY, rippleSize, 0, Math.PI * 2);
            ctx.fill();
          }

          animations[index] = requestAnimationFrame(animate);
        } catch (error) {
          console.error("AnimatedPonds animation error:", error);
        }
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
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <canvas
        ref={canvasRef1}
        width={200}
        height={180}
        className="absolute left-[2%] top-[8%] pointer-events-none"
        style={{
          mixBlendMode: "screen",
          opacity: 0.7,
        }}
      />
      <canvas
        ref={canvasRef2}
        width={220}
        height={200}
        className="absolute right-[2%] top-[12%] pointer-events-none"
        style={{
          mixBlendMode: "screen",
          opacity: 0.7,
        }}
      />
      <canvas
        ref={canvasRef3}
        width={180}
        height={160}
        className="absolute bottom-[10%] left-[5%] pointer-events-none"
        style={{
          mixBlendMode: "screen",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
