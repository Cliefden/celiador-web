import React from 'react';
import Image from 'next/image';

interface CeliadorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  animate?: boolean;
}

export function CeliadorLogo({ 
  size = 'md', 
  variant = 'full', 
  className = '', 
  animate = false 
}: CeliadorLogoProps) {
  const sizes = {
    sm: { icon: 24, full: 80, text: 'text-lg' },
    md: { icon: 32, full: 120, text: 'text-xl' },
    lg: { icon: 48, full: 160, text: 'text-2xl' },
    xl: { icon: 64, full: 200, text: 'text-3xl' },
    '2xl': { icon: 80, full: 280, text: 'text-4xl' }
  };

  const IconComponent = () => (
    <div className={`relative ${animate ? 'transition-transform hover:scale-105' : ''}`}>
      <Image
        src="/icons/Naked_Celiador.png"
        alt="Celiador Icon"
        width={sizes[size].icon}
        height={sizes[size].icon}
        className="w-auto h-auto"
        priority
      />
    </div>
  );

  const FullLogoComponent = () => (
    <div className={`relative ${animate ? 'transition-transform hover:scale-105' : ''}`}>
      <Image
        src="/icons/Celiador_Full.png"
        alt="Celiador - Truly Lovable"
        width={sizes[size].full}
        height={sizes[size].full * 0.6} // Maintain aspect ratio
        className="w-auto h-auto"
        priority
      />
    </div>
  );

  const TextComponent = () => (
    <div className="flex flex-col">
      <span className={`font-bold tracking-tight text-gray-900 dark:text-white ${sizes[size].text}`}>
        Celiador
      </span>
      <span className="text-xs font-medium tracking-widest text-teal-600 uppercase">
        Truly Lovable
      </span>
    </div>
  );

  if (variant === 'icon') {
    return <div className={className}><IconComponent /></div>;
  }

  if (variant === 'text') {
    return <div className={className}><TextComponent /></div>;
  }

  if (variant === 'full') {
    return <div className={className}><FullLogoComponent /></div>;
  }

  // Default: icon + text layout
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <IconComponent />
      <TextComponent />
    </div>
  );
}

// Simplified version for favicons and small spaces
export function CeliadorIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`w-${size} h-${size} ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Celiador Logo - Four curved petal star shape */}
        
        {/* Top petal - curved teardrop pointing up */}
        <path
          d="M50 15 C60 15, 70 25, 70 35 C70 40, 65 45, 50 50 C35 45, 30 40, 30 35 C30 25, 40 15, 50 15 Z"
          fill="#14B8A6"
        />
        
        {/* Right petal - curved teardrop pointing right */}
        <path
          d="M85 50 C85 40, 75 30, 65 30 C60 30, 55 35, 50 50 C55 65, 60 70, 65 70 C75 70, 85 60, 85 50 Z"
          fill="#06B6D4"
        />
        
        {/* Bottom petal - curved teardrop pointing down */}
        <path
          d="M50 85 C40 85, 30 75, 30 65 C30 60, 35 55, 50 50 C65 55, 70 60, 70 65 C70 75, 60 85, 50 85 Z"
          fill="#14B8A6"
        />
        
        {/* Left petal - curved teardrop pointing left */}
        <path
          d="M15 50 C15 60, 25 70, 35 70 C40 70, 45 65, 50 50 C45 35, 40 30, 35 30 C25 30, 15 40, 15 50 Z"
          fill="#06B6D4"
        />
        
        {/* Center diamond shape formed by the negative space */}
        <path
          d="M50 35 L60 50 L50 65 L40 50 Z"
          fill="#0F766E"
        />
      </svg>
    </div>
  );
}