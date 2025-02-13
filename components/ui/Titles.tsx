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
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      className={`absolute text-center transition-all duration-500 ease-out cursor-pointer pointer-events-auto select-none
        ${isExpanded ? 'top-4' : 'top-[50dvh]'}`}
      style={{
        transform,
        opacity: hovered ? opacity * 0.5 : opacity,
        visibility: (opacity === 0 || (isExpanded && !isCurrent)) ? 'hidden' : 'visible',
        pointerEvents: (opacity === 0 || (isExpanded && !isCurrent)) ? 'none' : 'auto'
      }}
      onClick={onClick}
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

// 이징 함수들 수정
const easing = {
  easeOutExpo: (x: number): number => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  easeOutElastic: (x: number): number => {
    const c4 = (2 * Math.PI) / 2; // 주기를 줄임
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1; // 진동 횟수와 감쇠를 조정
  }
};

export function HorizontalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const windowWidth = useWindowSize(true);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isMouseDown, setIsMouseDown] = useState(false);

  const titleSpacing = useMemo(() => {
    return windowWidth < 768 ? 180 : 220;
  }, [windowWidth]);

  const [dragStartTime, setDragStartTime] = useState(0);
  const CLICK_THRESHOLD = 150; // 클릭으로 인정할 최대 시간 (ms)
  const [dragStartX, setDragStartX] = useState(0);
  const DRAG_THRESHOLD = 10; // 드래그로 인정할 최소 거리 (px)

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX - dragOffset);
    setDragStartX(clientX);
    setDragStartTime(Date.now());
    setIsMouseDown(true);
  };

  // 드래그 중
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded || !isMouseDown) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dragDistance = Math.abs(clientX - dragStartX);
    
    if (!isDragging && dragDistance > DRAG_THRESHOLD) {
      setIsDragging(true);
      setBlurred(true);
    }
    
    if (isDragging) {
      const newOffset = clientX - startX;
      
      // 첫 번째 타이틀(currentIndex === 0)일 때 오른쪽으로만 이동 가능
      if (currentIndex === 0 && newOffset > 0) {
        setDragOffset(0);
        return;
      }
      
      // 마지막 타이틀(currentIndex === scenes.length - 1)일 때 왼쪽으로만 이동 가능
      if (currentIndex === scenes.length - 1 && newOffset < 0) {
        setDragOffset(0);
        return;
      }
      
      setDragOffset(newOffset);
    }
  };

  // 드래그 종료
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.changedTouches?.[0].clientX : e.clientX;
    const dragDistance = Math.abs(clientX - dragStartX);
    const dragDuration = Date.now() - dragStartTime;
    const dragVelocity = dragDistance / dragDuration; // 드래그 속도 계산
    
    setIsMouseDown(false);

    // 드래그 동작이 아닌 경우 (짧은 거리, 짧은 시간, 느린 속도)
    if (dragDistance <= DRAG_THRESHOLD && 
        dragDuration < CLICK_THRESHOLD && 
        dragVelocity < 0.5) { // 속도가 0.5px/ms 미만인 경우
      if (isDragging) {
        // 드래그 중이었다면 원위치로
        setDragOffset(0);
        setIsDragging(false);
        setBlurred(false);
      }
      return;
    }
    
    if (!isDragging) {
      setDragOffset(0);
      return;
    }
    
    setIsDragging(false);
    const nearestIndex = Math.round(-dragOffset / titleSpacing);
    const boundedIndex = Math.max(0, Math.min(scenes.length - 1, currentIndex + nearestIndex));
    
    // 부드러운 애니메이션으로 스냅
    const startOffset = dragOffset;
    const targetOffset = -(boundedIndex - currentIndex) * titleSpacing;
    const startTime = performance.now();
    const duration = 500; // 800ms에서 500ms로 단축

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
        if (boundedIndex !== currentIndex) {
          setCurrentScene(boundedIndex);
          setTimeout(() => {
            setBlurred(false);
          }, 100);
        } else {
          setBlurred(false);
        }
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
          onMouseLeave={(e) => {
            setIsMouseDown(false);
            handleDragEnd(e);
          }}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (isDragging) return;
              
              if (distance === 0) {
                toggleExpanded();
              } else {
                setBlurred(true);
                setCurrentScene(index);
                setTimeout(() => {
                  setBlurred(false);
                }, 800);
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
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const windowHeight = useWindowSize(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isMouseDown, setIsMouseDown] = useState(false);

  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 80 : 120;
  }, [windowHeight]);

  const [dragStartTime, setDragStartTime] = useState(0);
  const CLICK_THRESHOLD = 150; // 클릭으로 인정할 최대 시간 (ms)
  const [dragStartY, setDragStartY] = useState(0);
  const DRAG_THRESHOLD = 10; // 드래그로 인정할 최소 거리 (px)

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY - dragOffset);
    setDragStartY(clientY);
    setDragStartTime(Date.now());
    setIsMouseDown(true);
  };

  // 드래그 중
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded || !isMouseDown) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dragDistance = Math.abs(clientY - dragStartY);
    
    if (!isDragging && dragDistance > DRAG_THRESHOLD) {
      setIsDragging(true);
      setBlurred(true);
    }
    
    if (isDragging) {
      const newOffset = clientY - startY;
      setDragOffset(newOffset);
    }
  };

  // 드래그 종료
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.changedTouches?.[0].clientY : e.clientY;
    const dragDistance = Math.abs(clientY - dragStartY);
    const dragDuration = Date.now() - dragStartTime;
    const dragVelocity = dragDistance / dragDuration;
    
    setIsMouseDown(false);

    // 드래그 동작이 아닌 경우
    if (dragDistance <= DRAG_THRESHOLD && 
        dragDuration < CLICK_THRESHOLD && 
        dragVelocity < 0.5) {
      if (isDragging) {
        setDragOffset(0);
        setIsDragging(false);
        setBlurred(false);
      }
      return;
    }
    
    if (!isDragging) {
      setDragOffset(0);
      return;
    }
    
    setIsDragging(false);
    let nearestIndex = Math.round(-dragOffset / titleSpacing);
    
    // 첫 번째와 마지막 타이틀의 경우 이동 제한
    if (currentIndex === 0) {
      nearestIndex = Math.min(nearestIndex, 0); // 첫 번째는 아래로만
    } else if (currentIndex === scenes.length - 1) {
      nearestIndex = Math.max(nearestIndex, 0); // 마지막은 위로만
    }
    
    const boundedIndex = Math.max(0, Math.min(scenes.length - 1, currentIndex + nearestIndex));
    
    // 부드러운 애니메이션으로 스냅
    const startOffset = dragOffset;
    const targetOffset = -(boundedIndex - currentIndex) * titleSpacing;
    const startTime = performance.now();
    const duration = 500; // 800ms에서 500ms로 단축

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 첫 번째와 마지막 타이틀의 경우 easeOutExpo 사용 (바운스 없음)
      const easeProgress = (currentIndex === 0 || currentIndex === scenes.length - 1) 
        ? easing.easeOutExpo(progress) 
        : easing.easeOutElastic(progress);
      
      const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      setDragOffset(currentOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        if (boundedIndex !== currentIndex) {
          setCurrentScene(boundedIndex);
          setTimeout(() => {
            setBlurred(false);
          }, 100);
        } else {
          setBlurred(false);
        }
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
          onMouseLeave={(e) => {
            setIsMouseDown(false);
            handleDragEnd(e);
          }}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (isDragging) return;
              
              if (distance === 0) {
                toggleExpanded();
              } else {
                setBlurred(true);
                setCurrentScene(index);
                setTimeout(() => {
                  setBlurred(false);
                }, 800);
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