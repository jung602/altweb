'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { SceneConfig } from '../types/scene';
import { MapPin } from 'lucide-react';

const TitleItem = ({ scene, opacity, transform, isExpanded }: {
  scene: SceneConfig;
  opacity: number;
  transform: string;
  isExpanded?: boolean;
}) => (
  <div
    className={`absolute text-center transition-all duration-500 ease-out
      ${isExpanded ? 'top-4' : 'bottom-16'}`}
    style={{
      transform: isExpanded ? 'translate-x-1/2' : transform,
      opacity,
      visibility: opacity === 0 ? 'hidden' : 'visible',
    }}
  >
    <p className={`font-geist-mono text-white  ${isExpanded ? 'text-sm' : 'text-xs'}`}>(0{scene.id})</p>
    <h2 className={`font-geist-sans text-white ${isExpanded ? 'text-sm' : 'text-xs'}`}>
      {scene.title}
    </h2>
    <h3 className={`font-geist-mono flex items-center justify-center text-slate-400 mt-[-2px] ${isExpanded ? 'text-sm' : 'text-xs'}`}>
    <MapPin strokeWidth={1.5} className="w-3 h-3 mr-1" />
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
    return windowWidth < 768 ? 130 : 150;
  }, [windowWidth]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] flex items-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center">
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
    return windowHeight < 768 ? 50 : 70;
  }, [windowHeight]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0">
        <div className="flex flex-col items-center justify-center">
          {scenes.map((scene, index) => {
            const distance = Math.abs(index - currentIndex);
            if (isExpanded && distance !== 0) return null;
            
            return (
              <TitleItem
                key={scene.id}
                scene={scene}
                opacity={calculateOpacity(distance)}
                transform={`translateY(${(index - currentIndex) * titleSpacing}px)`}
                isExpanded={isExpanded}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}