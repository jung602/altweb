'use client';

import React, { useMemo, useCallback } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { useResponsiveDevice } from '../../hooks/device';
import { TitleItem } from './TitleItem';

/**
 * 수직 타이틀 컴포넌트
 * 씬 타이틀을 수직으로 표시하는 컴포넌트
 */
export const VerticalTitles = React.memo(() => {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  
  // 기존의 useWindowSize 훅 사용
  const { height: windowHeight } = useResponsiveDevice();

  /**
   * 타이틀 불투명도 계산 함수 - 현재 인덱스와의 거리에 따른 불투명도 반환
   * 메모이제이션을 사용해 불필요한 재계산 방지
   */
  const calculateOpacity = useCallback((distance: number) => {
    if (distance === 0) return 1;
    return 0.6; 
  }, []);

  // 타이틀 간격 계산 - useMemo로 메모이제이션
  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 100 : 120;
  }, [windowHeight]);

  // 클릭 핸들러를 useCallback으로 메모이제이션하여 재생성 방지
  const createHandleClick = useCallback((index: number, distance: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    if (distance === 0) {
      // 현재 선택된 모델 클릭 시 확장/축소 토글
      toggleExpanded();
    } else {
      // 다른 모델 클릭 시 해당 모델로 이동
      setBlurred(true);
      setCurrentScene(index);
      
      // 애니메이션 완료 후 블러 효과 제거 (800ms)
      setTimeout(() => {
        setBlurred(false);
      }, 800);
    }
  }, [toggleExpanded, setBlurred, setCurrentScene]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden notranslate" data-notranslate="true">
      <div className="absolute inset-0">
        <div className="flex flex-col items-center justify-center">
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            
            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={isExpanded && distance !== 0 ? 0 : calculateOpacity(distance)}
                transform={`translateY(${distance * titleSpacing}px)`}
                isExpanded={isExpanded}
                isCurrent={distance === 0}
                onClick={createHandleClick(index, distance)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

// displayName 추가
VerticalTitles.displayName = 'VerticalTitles';