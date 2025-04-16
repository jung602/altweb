import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
export const TitleItem = memo(({ 
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

  // 터치 시작 - useCallback으로 메모이제이션
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // 터치 타임아웃 설정 - 1초 후 자동 해제
    touchTimeoutRef.current = setTimeout(() => {
      // 터치 종료 후 필요한 추가 로직이 있다면 이곳에 구현
    }, 1000);
  }, []);

  // 터치 이동 - useCallback으로 메모이제이션
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 터치 이동 감지 시 타임아웃 클리어
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  }, []);

  // 터치 종료 - useCallback으로 메모이제이션
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // 터치 종료 시 항상 타임아웃 클리어
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  }, []);

  // 마우스 이벤트 핸들러 - useCallback으로 메모이제이션
  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
    };
  }, []);

  // 계산된 스타일 메모이제이션
  const itemStyle = {
    transform,
    opacity: isExpanded && !isCurrent ? 0 : (hovered ? opacity * 0.5 : opacity),
    visibility: (isExpanded && !isCurrent) || opacity === 0 ? 'hidden' as const : 'visible' as const,
    pointerEvents: (isExpanded && !isCurrent) || opacity === 0 ? 'none' as const : 'auto' as const,
    transition: 'all 0.5s ease-out, visibility 0s'
  };

  return (
    <div
      className={`absolute text-center transition-all duration-500 ease-out cursor-pointer pointer-events-auto select-none
        ${isExpanded && isCurrent ? 'top-4' : 'top-[50dvh]'}`}
      style={itemStyle}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
});

// displayName 추가
TitleItem.displayName = 'TitleItem'; 