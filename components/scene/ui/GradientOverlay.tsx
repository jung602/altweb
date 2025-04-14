import React from 'react';

interface GradientOverlayProps {
  position: 'top' | 'bottom';
  className?: string;
}

/**
 * 상단/하단 그라디언트 오버레이 컴포넌트
 */
export const GradientOverlay: React.FC<GradientOverlayProps> = ({
  position,
  className = ''
}) => {
  const gradientClass = position === 'top' 
    ? 'top-0 bg-gradient-to-b from-black/50 via-black/25 to-transparent' 
    : 'bottom-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent';

  return (
    <div 
      className={`absolute left-0 right-0 h-[10vh] pointer-events-none z-10 ${gradientClass} ${className}`}
    />
  );
};

export default GradientOverlay; 