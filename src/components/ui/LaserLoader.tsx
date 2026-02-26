'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';

const LaserLoader = () => {
  const { isLoading } = useUIStore();
  const [color, setColor] = useState('#3B82F6'); // Default blue

  useEffect(() => {
    // Get color from env or default
    const envColor = process.env.NEXT_PUBLIC_LOADER_COLOR;
    if (envColor) {
      setColor(envColor);
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100]">
      {/* Container for the laser beam */}
      <div className="relative w-full h-[2px] bg-transparent overflow-hidden">
        {/* The moving laser beam */}
        <div 
          className="absolute top-0 h-full w-1/3 animate-laser"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
            boxShadow: `0 0 10px 2px ${color}, 0 0 5px 1px ${color}`,
          }}
        />
        
        {/* A thin solid line base for visibility */}
        <div 
          className="absolute top-0 h-full w-full opacity-20"
          style={{ backgroundColor: color }}
        />
      </div>
      
      <style>{`
        @keyframes laser {
          0% { left: -40%; }
          50% { left: 20%; width: 60%; }
          100% { left: 100%; width: 20%; }
        }
        .animate-laser {
          animation: laser 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default LaserLoader;
