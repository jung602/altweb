'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { SceneConfig } from '../types/scene';

const TitleItem = ({ scene, opacity, transform, isExpanded }: {
  scene: SceneConfig;
  opacity: number;
  transform: string;
  isExpanded?: boolean;
}) => (
  <div
    className={`absolute w-[400px] text-center transition-all duration-500 ease-out
      ${isExpanded ? '-top-[48dvh]' : 'top-0'}`}
    style={{
      transform: isExpanded ? 'none' : transform,
      opacity,
      visibility: opacity === 0 ? 'hidden' : 'visible'
    }}
  >
    <p className={`font-geist-mono ${isExpanded ? 'text-gray-400 text-xl' : 'text-sm text-gray-400'}`}>{scene.author}</p>
    <h2 className={`font-geist-sans ${isExpanded ? 'text-2xl' : 'text-sm'} text-white`}>
      {scene.title}
    </h2>
    <h3 className={`font-geist-mono ${isExpanded ? 'text-gray-400 text-xl' : 'text-sm text-gray-400'}`}>
    {scene.subtitle}
    </h3>
  </div>
);

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
  if (distance === 1) return 0.6;
  return 0;
};

export function HorizontalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const windowWidth = useWindowSize(true);

  const titleSpacing = useMemo(() => {
    return windowWidth < 768 ? 200 : 300;
  }, [windowWidth]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] flex items-center pointer-events-none overflow-hidden">
      <div className="flex w-full">
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
        <div className="relative w-[400px]">
          {scenes.map((scene, index) => {
            const distance = Math.abs(index - currentIndex);
            if (isExpanded && distance !== 0) return null;
            
            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={calculateOpacity(distance)}
                transform={`translateX(${(index - currentIndex) * titleSpacing}px)`}
                isExpanded={isExpanded}
              />
            );
          })}
        </div>
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
      </div>
    </div>
  );
}

export function VerticalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const windowHeight = useWindowSize(false);

  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 100 : 150;
  }, [windowHeight]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {scenes.map((scene, index) => {
            const distance = Math.abs(index - currentIndex);
            if (isExpanded && distance !== 0) return null;
            
            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={calculateOpacity(distance)}
                transform={`translate(-50%, ${(index - currentIndex) * titleSpacing}px)`}
                isExpanded={isExpanded}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}