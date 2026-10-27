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

          // Solid camo gradient with depth - NOT transparent
          gradient.addColorStop(0, `rgba(${180 + redShift * 50}, ${140 + greenShift * 60}, ${200 + blueShift * 40}, 0.95)`);
          gradient.addColorStop(0.25, `rgba(${150 + purpleShift * 60}, ${100 + blueShift * 70}, ${220 + greenShift * 35}, 0.9)`);
          gradient.addColorStop(0.5, `rgba(${120 + greenShift * 70}, ${180 + redShift * 50}, ${160 + purpleShift * 60}, 0.9)`);
          gradient.addColorStop(0.75, `rgba(${140 + blueShift * 60}, ${160 + purpleShift * 50}, ${190 + redShift * 45}, 0.9)`);
          gradient.addColorStop(1, `rgba(${110 + redShift * 60}, ${150 + greenShift * 55}, ${180 + blueShift * 50}, 0.85)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Add camo texture patches for realistic look
          for (let i = 0; i < 8; i++) {
            const patchTime = time + i * 0.5;
            const patchX = width / 2 + Math.sin(patchTime * 1.1 + i) * (width * 0.25);
            const patchY = height / 2 + Math.cos(patchTime * 0.9 + i) * (height * 0.25);
            const patchSize = 15 + Math.sin(patchTime * 0.7) * 8;
            const patchOpacity = 0.3 + Math.sin(patchTime) * 0.15;
            
            const patchR = 100 + Math.sin(patchTime * 1.2) * 80;
            const patchG = 120 + Math.cos(patchTime * 0.8) * 90;
            const patchB = 150 + Math.sin(patchTime * 1.5) * 70;

            const patchGradient = ctx.createRadialGradient(
              patchX,
              patchY,
              0,
              patchX,
              patchY,
              patchSize
            );
            patchGradient.addColorStop(0, `rgba(${patchR}, ${patchG}, ${patchB}, ${patchOpacity})`);
            patchGradient.addColorStop(1, `rgba(${patchR * 0.6}, ${patchG * 0.6}, ${patchB * 0.6}, 0)`);

            ctx.fillStyle = patchGradient;
            ctx.beginPath();
            ctx.arc(patchX, patchY, patchSize, 0, Math.PI * 2);
            ctx.fill();
          }

          // Add darker edge for depth
          ctx.strokeStyle = `rgba(80, 100, 120, 0.6)`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(width / 2, height / 2, width / 2 - 1.5, height / 2 - 1.5, 0, 0, Math.PI * 2);
          ctx.stroke();

          for (let i = 0; i < 3; i++) {
            const waveTime = time + i * 2;
            const waveRadius = (width / 3) * (1 + Math.sin(waveTime) * 0.2);
            const waveOpacity = 0.4 + Math.sin(waveTime) * 0.2;
            
            // Prominent camo-colored waves
            const waveR = 130 + Math.sin(waveTime * 1.1) * 70;
            const waveG = 110 + Math.cos(waveTime * 0.9) * 90;
            const waveB = 150 + Math.sin(waveTime * 1.3) * 80;

            ctx.strokeStyle = `rgba(${waveR}, ${waveG}, ${waveB}, ${waveOpacity})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(width / 2, height / 2, waveRadius, waveRadius * 0.9, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          const rippleCount = 7;
          for (let i = 0; i < rippleCount; i++) {
            const rippleTime = time * 0.8 + i * 0.5;
            const rippleX = width / 2 + Math.sin(rippleTime * 2) * 20;
            const rippleY = height / 2 + Math.cos(rippleTime * 1.5) * 18;
            const rippleSize = 5 + Math.sin(rippleTime * 3) * 3;
            const rippleOpacity = 0.5 + Math.sin(rippleTime * 4) * 0.3;
            
            // Prominent camo-colored ripples
            const ripR = 140 + Math.cos(rippleTime * 1.2) * 80;
            const ripG = 120 + Math.sin(rippleTime * 0.8) * 100;
            const ripB = 160 + Math.cos(rippleTime * 1.5) * 70;

            const rippleGradient = ctx.createRadialGradient(
              rippleX,
              rippleY,
              0,
              rippleX,
              rippleY,
              rippleSize
            );
            rippleGradient.addColorStop(0, `rgba(${ripR}, ${ripG}, ${ripB}, ${rippleOpacity})`);
            rippleGradient.addColorStop(1, `rgba(${ripR * 0.5}, ${ripG * 0.5}, ${ripB * 0.5}, 0)`);

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
          mixBlendMode: "normal",
          opacity: 0.85,
        }}
      />
      <canvas
        ref={canvasRef2}
        width={220}
        height={200}
        className="absolute right-[2%] top-[12%] pointer-events-none"
        style={{
          mixBlendMode: "normal",
          opacity: 0.85,
        }}
      />
      <canvas
        ref={canvasRef3}
        width={180}
        height={160}
        className="absolute bottom-[10%] left-[5%] pointer-events-none"
        style={{
          mixBlendMode: "normal",
          opacity: 0.85,
        }}
      />
    </div>
  );
}
