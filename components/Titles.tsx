'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { SceneConfig } from '../types/scene';

// 공통으로 사용되는 Title 컴포넌트
const TitleItem = ({ scene, opacity, transform }: {
  scene: SceneConfig;
  opacity: number;
  transform: string;
}) => (
  <div
    key={scene.id}
    className="absolute text-center w-[400px]"
    style={{
      transform,
      opacity,
      transition: 'all 800ms ease',
      visibility: opacity === 0 ? 'hidden' : 'visible'
    }}
  >
    <p className="text-sm text-gray-400 font-geist-mono">{scene.author}</p>
    <h2 className="text-sm text-white font-geist-sans">{scene.title}</h2>
    <h3 className="text-sm font-geist-sans text-gray-400">{scene.subtitle}</h3>
  </div>
);

// 공통으로 사용되는 Hook
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

// 공통으로 사용되는 opacity 계산 함수
const calculateOpacity = (distance: number) => {
  if (distance === 0) return 1;
  if (distance === 1) return 0.6;
  return 0;
};

export function HorizontalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const windowWidth = useWindowSize(true);

  const titleSpacing = useMemo(() => {
    return windowWidth < 768 ? 200 : 300;
  }, [windowWidth]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] flex items-center pointer-events-none overflow-hidden">
      <div className="flex w-full">
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
        <div className="relative w-[400px]">
          {scenes.map((scene, index) => (
            <TitleItem
              key={scene.id}
              scene={scene}
              opacity={calculateOpacity(Math.abs(index - currentIndex))}
              transform={`translateX(${(index - currentIndex) * titleSpacing}px)`}
            />
          ))}
        </div>
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
      </div>
    </div>
  );
}

export function VerticalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const windowHeight = useWindowSize(false);

  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 100 : 150;
  }, [windowHeight]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {scenes.map((scene, index) => (
            <TitleItem
              key={scene.id}
              scene={scene}
              opacity={calculateOpacity(Math.abs(index - currentIndex))}
              transform={`translate(-50%, ${(index - currentIndex) * titleSpacing}px)`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}