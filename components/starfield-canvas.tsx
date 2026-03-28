"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    const STAR_COUNT = 300;
    let lastShootingStar = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const z = Math.random() * 3 + 1;
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          z,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.005,
        });
      }
    }

    function spawnShootingStar() {
      const side = Math.random();
      let x: number, y: number;
      if (side < 0.5) {
        x = Math.random() * canvas!.width;
        y = -10;
      } else {
        x = canvas!.width + 10;
        y = Math.random() * canvas!.height * 0.5;
      }
      shootingStars.push({
        x,
        y,
        vx: -(Math.random() * 8 + 4),
        vy: Math.random() * 4 + 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: Math.random() * 1.5 + 1,
      });
    }

    function drawNebula(ctx: CanvasRenderingContext2D, w: number, h: number) {
      const grad1 = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5);
      grad1.addColorStop(0, "rgba(99, 102, 241, 0.04)");
      grad1.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const grad2 = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.4);
      grad2.addColorStop(0, "rgba(0, 212, 255, 0.03)");
      grad2.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);
    }

    let frame = 0;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Subtle nebula overlay
      drawNebula(ctx, canvas.width, canvas.height);

      // Draw stars with 3 parallax layers
      for (const star of stars) {
        const speed = star.z < 1.5 ? 0.05 : star.z < 2.5 ? 0.15 : 0.3;
        star.x -= speed;
        star.y -= speed * 0.3;

        if (star.x < -5) star.x = canvas.width + 5;
        if (star.y < -5) star.y = canvas.height + 5;

        // Twinkle
        star.opacity += Math.sin(frame * star.twinkleSpeed) * 0.01;
        star.opacity = Math.max(0.15, Math.min(1.0, star.opacity));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      }

      // Shooting stars - spawn every 8-12 seconds
      const now = performance.now();
      if (now - lastShootingStar > 8000 + Math.random() * 4000) {
        if (shootingStars.length < 2) {
          spawnShootingStar();
          lastShootingStar = now;
        }
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;

        const progress = ss.life / ss.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : 1 - (progress - 0.1) / 0.9;

        // Trail
        const trailLen = 30;
        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * trailLen * 0.3, ss.y - ss.vy * trailLen * 0.3
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * trailLen * 0.3, ss.y - ss.vy * trailLen * 0.3);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.size;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    initStars();
    animate();

    const handleResize = () => {
      resize();
      initStars();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
