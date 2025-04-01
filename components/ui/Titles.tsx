'use client';

import { useMemo } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import { TitleItem } from './TitleItem';

/**
 * 타이틀 불투명도 계산 함수
 * @param distance - 현재 인덱스와의 거리
 * @returns 불투명도 값
 */
const calculateOpacity = (distance: number) => {
  if (distance === 0) return 1;
  return 0.6;
};

/**
 * 수직 타이틀 컴포넌트
 * 씬 타이틀을 수직으로 표시하는 컴포넌트
 */
export function VerticalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  
  // 기존의 useWindowSize 훅 사용
  const { height: windowHeight } = useResponsiveDevice();

  // 타이틀 간격 계산
  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 100 : 120;
  }, [windowHeight]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden notranslate" data-notranslate="true">
      <div className="absolute inset-0">
        <div 
          className="flex flex-col items-center justify-center"
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            
            const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
              e.stopPropagation();
              
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
                opacity={isExpanded && distance !== 0 ? 0 : calculateOpacity(distance)}
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