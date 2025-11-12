'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulsePhase: number;
}

interface ParticleFieldProps {
  agentCount: number;
  isActive: boolean;
  className?: string;
}

export function ParticleField({ agentCount, isActive, className = '' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const colors = [
    'rgba(20, 184, 166, 0.6)',   // teal
    'rgba(59, 130, 246, 0.6)',   // blue
    'rgba(168, 85, 247, 0.6)',   // purple
    'rgba(34, 197, 94, 0.6)',    // green
    'rgba(251, 191, 36, 0.6)',   // yellow
  ];

  const createParticle = (index: number): Particle => {
    const angle = (index / Math.max(agentCount, 1)) * Math.PI * 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    return {
      x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
      y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 2 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulsePhase: Math.random() * Math.PI * 2
    };
  };

  const initializeParticles = () => {
    const particleCount = Math.max(agentCount * 8, 20);
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => createParticle(i));
  };

  const updateParticles = (deltaTime: number) => {
    particlesRef.current.forEach((particle, index) => {
      // Update position with gentle drift
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Add orbital motion around center
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const orbitalForce = 0.0001;
        particle.vx += -dy * orbitalForce;
        particle.vy += dx * orbitalForce;
      }

      // Apply friction
      particle.vx *= 0.999;
      particle.vy *= 0.999;

      // Boundary wrapping with soft edges
      if (particle.x < -50) particle.x = dimensions.width + 50;
      if (particle.x > dimensions.width + 50) particle.x = -50;
      if (particle.y < -50) particle.y = dimensions.height + 50;
      if (particle.y > dimensions.height + 50) particle.y = -50;

      // Update pulse phase for pulsing effect
      particle.pulsePhase += 0.02;
      if (particle.pulsePhase > Math.PI * 2) particle.pulsePhase = 0;
    });
  };

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    const maxDistance = 120;
    
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p1 = particlesRef.current[i];
        const p2 = particlesRef.current[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.2;
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, `rgba(20, 184, 166, ${opacity})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity})`);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle) => {
      const pulseScale = 1 + Math.sin(particle.pulsePhase) * 0.3;
      const currentRadius = particle.radius * pulseScale;
      const currentOpacity = particle.opacity * (0.7 + Math.sin(particle.pulsePhase) * 0.3);
      
      // Draw particle glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, currentRadius * 3
      );
      gradient.addColorStop(0, particle.color.replace('0.6', currentOpacity.toString()));
      gradient.addColorStop(1, particle.color.replace('0.6', '0'));
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentRadius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw particle core
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color.replace('0.6', (currentOpacity * 1.5).toString());
      ctx.fill();
    });
  };

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas with slight trail effect
    ctx.fillStyle = 'rgba(17, 24, 39, 0.1)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    if (isActive) {
      updateParticles(16.67); // ~60fps
      drawConnections(ctx);
      drawParticles(ctx);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        setDimensions({ width: rect.width, height: rect.height });
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    initializeParticles();
  }, [agentCount, dimensions]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}