'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { SceneConfig } from '../types/scene';
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
        ${isExpanded ? 'top-4' : 'top-[50vh]'}`}
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
  if (Math.abs(distance) === 1) return 0.6;
  return 0;
};

export function HorizontalTitles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const windowWidth = useWindowSize(true);

  const titleSpacing = useMemo(() => {
    return windowWidth < 768 ? 130 : 150;
  }, [windowWidth]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center">
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = () => {
              if (distance !== 0) {
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
  const windowHeight = useWindowSize(false);

  const titleSpacing = useMemo(() => {
    return windowHeight < 768 ? 80 : 120;
  }, [windowHeight]);

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-hidden">
      <div className="absolute inset-0">
        <div className="flex flex-col items-center justify-center">
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            if (isExpanded && distance !== 0) return null;
            
            const handleClick = () => {
              if (distance !== 0) {
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