import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { SceneConfig } from '../../types/scene';

interface TitleItemProps {
  scene: SceneConfig;
  opacity: number;
  transform: string;
  isExpanded?: boolean;
  isCurrent?: boolean;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * 씬 타이틀 아이템 컴포넌트
 * @param props - 타이틀 아이템 속성
 * @returns 타이틀 아이템 컴포넌트
 */
export const TitleItem = ({ 
  scene, 
  opacity, 
  transform, 
  isExpanded,
  isCurrent,
  onClick 
}: TitleItemProps) => {
  const [hovered, setHovered] = useState(false);
  
  // 모바일 터치 이벤트를 위한 ref
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouching(false);
    }, 1000); // 1초 후 터치 상태 해제
  };

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsTouching(false);
  };

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsTouching(false);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`absolute text-center transition-all duration-500 ease-out cursor-pointer pointer-events-auto select-none
        ${isExpanded && isCurrent ? 'top-4' : 'top-[50dvh]'}`}
      style={{
        transform,
        opacity: isExpanded && !isCurrent ? 0 : (hovered ? opacity * 0.5 : opacity),
        visibility: (isExpanded && !isCurrent) || opacity === 0 ? 'hidden' : 'visible',
        pointerEvents: (isExpanded && !isCurrent) || opacity === 0 ? 'none' : 'auto',
        transition: 'all 0.5s ease-out, visibility 0s'
      }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className={`font-geist-mono text-white ${isExpanded ? 'text-sm' : 'text-xs'}`}>(0{scene.id})</p>
      <h2 
        className={`font-geist-sans text-white ${isExpanded ? 'text-sm' : 'text-xs'}`} 
        style={{ 
          textDecoration: 'none !important', 
          WebkitTextDecorationLine: 'none !important',
          borderBottom: 'none !important'
        }}
        translate="no"
      >
        {scene.title}
      </h2>
      <h3 
        className={`font-geist-mono flex items-center justify-center text-slate-400 mt-[-2px] ${isExpanded ? 'text-sm' : 'text-xs'}`}
        style={{ 
          textDecoration: 'none !important', 
          WebkitTextDecorationLine: 'none !important' 
        }}
        translate="no"
      >
        <MapPin strokeWidth={1.5} className="w-3 h-3 mr-1" />
        {scene.location}
      </h3>
    </div>
  );
}; 