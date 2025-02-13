'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { SceneConfig } from '../../types/scene';
import { MapPin } from 'lucide-react';

const TitleItem = ({ 
  scene, 
  opacity, 
  transform, 
  isExpanded,
  isCurrent,
  onClick 
}: {
  scene: SceneConfig;
  opacity: number;
  transform: string;
  isExpanded?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  
  return (
    <div
      className={`absolute text-center transition-all duration-500 ease-out cursor-pointer pointer-events-auto
        ${isExpanded ? 'top-4' : 'top-[50dvh]'}`}
      style={{
        transform: isExpanded ? 'translate-x-1/2' : transform,
        opacity: hovered ? opacity * 0.5 : opacity,
        visibility: opacity === 0 ? 'hidden' : 'visible',
        pointerEvents: opacity === 0 ? 'none' : 'auto'
      }}
      onClick={() => isCurrent ? toggleExpanded() : onClick?.()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className={`font-geist-mono text-white ${isExpanded ? 'text-sm' : 'text-xs'}`}>(0{scene.id})</p>
      <h2 className={`font-geist-sans text-white ${isExpanded ? 'text-sm' : 'text-xs'}`}>
        {scene.title}
      </h2>
      <h3 className={`font-geist-mono flex items-center justify-center text-slate-400 mt-[-2px] ${isExpanded ? 'text-sm' : 'text-xs'}`}>
        <MapPin strokeWidth={1.5} className="w-3 h-3 mr-1" />
        {scene.location}
      </h3>
    </div>
  );
};

const useWindowSize = (isHorizontal: boolean) => {
  const [size, setSize] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      setSize(isHorizontal ? window.innerWidth : window.innerHeight);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isHorizontal]);

  return size;
};

const calculateOpacity = (distance: number) => {
  if (distance === 0) return 1;
  return 0.6;
};

// 이징 함수들 추가
const easing = {
  easeOutExpo: (x: number): number => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  easeOutElastic: (x: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }
};

export function HorizontalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const windowWidth = useWindowSize(true);
  
  // 드래그 관련 상태 추가
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const titleSpacing = useMemo(() => {
    return windowWidth < 768 ? 180 : 220;
  }, [windowWidth]);

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    setIsDragging(true);
    setBlurred(true); // 드래그 시작 시 블러 적용
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX - dragOffset);
  };

  // 드래그 중
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isExpanded) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newOffset = clientX - startX;
    setDragOffset(newOffset);
  };

  // 드래그 종료 및 마그네틱 스냅
  const handleDragEnd = () => {
    if (!isDragging || isExpanded) return;
    setIsDragging(false);

    const nearestIndex = Math.round(-dragOffset / titleSpacing);
    const boundedIndex = Math.max(0, Math.min(scenes.length - 1, currentIndex + nearestIndex));
    
    // 부드러운 애니메이션으로 스냅
    const startOffset = dragOffset;
    const targetOffset = -(boundedIndex - currentIndex) * titleSpacing;
    const startTime = performance.now();
    const duration = 800;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = easing.easeOutElastic(progress);
      const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      setDragOffset(currentOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        setCurrentScene(boundedIndex);
        // 애니메이션 완료 후 블러 해제 (스크롤과 동일한 타이밍)
        setTimeout(() => {
          setBlurred(false);
        }, 800);
      }
    };

    cancelAnimationFrame(animationRef.current!);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          ref={dragRef}
          className={`flex items-center justify-center ${!isExpanded ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDrag}
          onTouchMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = () => {
              if (!isDragging && distance !== 0) {
                setCurrentScene(index);
              }
            };

            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={calculateOpacity(distance)}
                transform={`translateX(${distance * titleSpacing}px)`}
                isExpanded={isExpanded}
                isCurrent={distance === 0}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function VerticalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const windowHeight = useWindowSize(false);

  // 드래그 관련 상태 추가
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 80 : 120;
  }, [windowHeight]);

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    setIsDragging(true);
    setBlurred(true); // 드래그 시작 시 블러 적용
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY - dragOffset);
  };

  // 드래그 중
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isExpanded) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const newOffset = clientY - startY;
    setDragOffset(newOffset);
  };

  // 드래그 종료 및 마그네틱 스냅
  const handleDragEnd = () => {
    if (!isDragging || isExpanded) return;
    setIsDragging(false);

    const nearestIndex = Math.round(-dragOffset / titleSpacing);
    const boundedIndex = Math.max(0, Math.min(scenes.length - 1, currentIndex + nearestIndex));
    
    // 부드러운 애니메이션으로 스냅
    const startOffset = dragOffset;
    const targetOffset = -(boundedIndex - currentIndex) * titleSpacing;
    const startTime = performance.now();
    const duration = 800;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = easing.easeOutElastic(progress);
      const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      setDragOffset(currentOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        setCurrentScene(boundedIndex);
        // 애니메이션 완료 후 블러 해제 (스크롤과 동일한 타이밍)
        setTimeout(() => {
          setBlurred(false);
        }, 800);
      }
    };

    cancelAnimationFrame(animationRef.current!);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0">
        <div 
          ref={dragRef}
          className={`flex flex-col items-center justify-center ${!isExpanded ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            transform: `translateY(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDrag}
          onTouchMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = () => {
              if (!isDragging && distance !== 0) {
                setCurrentScene(index);
              }
            };

            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={calculateOpacity(distance)}
                transform={`translateY(${distance * titleSpacing}px)`}
                isExpanded={isExpanded}
                isCurrent={distance === 0}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}