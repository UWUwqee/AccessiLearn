import React, { useEffect, useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ReadingRuler: React.FC = () => {
  const { readingRuler } = useAccessibility();
  const [mouseY, setMouseY] = useState<number>(200);

  useEffect(() => {
    if (!readingRuler) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingRuler]);

  if (!readingRuler) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top shadow mask */}
      <div
        className="w-full bg-slate-900/30 transition-all duration-75 ease-out"
        style={{ height: Math.max(0, mouseY - 40) }}
      />
      {/* Focus guide line slot */}
      <div
        className="w-full border-y-2 border-amber-400 bg-amber-400/10"
        style={{ height: '70px' }}
      />
      {/* Bottom shadow mask */}
      <div
        className="w-full bg-slate-900/30"
        style={{ height: `calc(100vh - ${mouseY + 30}px)` }}
      />
    </div>
  );
};
