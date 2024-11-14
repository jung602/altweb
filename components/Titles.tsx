'use client';

import { useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';

export function Titles() {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center pointer-events-none overflow-hidden">
      <div className="flex w-full">
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
        
        <div className="relative w-[400px]">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`
                absolute top-0 left-0
                w-[400px]
                px-4
                select-none
                text-center
                transition-all duration-1000 ease-in-out
                transform
              `}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%)`,
                opacity: index === currentIndex ? 1 : 0.6
              }}
            >
              <p className="text-sm text-gray-600 font-geist-mono">
                {scene.author}
              </p>
              <h2 className="text-sm font-geist-sans">
                {scene.title}
              </h2>
              <h3 className="text-sm font-geist-sans text-gray-700">
                {scene.subtitle}
              </h3>
            </div>
          ))}
        </div>
        
        <div className="flex-shrink-0 w-[calc(50vw-200px)]" />
      </div>
    </div>
  );
}

export default Titles;