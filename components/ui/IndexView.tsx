import { useSceneStore } from '../../store/sceneStore';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useResponsiveDevice } from '../../hooks/device';

export const IndexView = () => {
  const scenes = useSceneStore((state) => state.scenes);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isIndexView = useSceneStore((state) => state.isIndexView);
  const setExpanded = useSceneStore((state) => state.setExpanded);
  const { width } = useResponsiveDevice();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 IndexView 상태 설정
    const store = useSceneStore.getState();
    if (!store.isIndexView) {
      store.setIndexView(true);
    }
    
    // 페이드 인 효과를 위한 지연
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isIndexView) return null;

  const handleItemClick = (index: number) => {
    setCurrentScene(index);
    setExpanded(true);
  };

  return (
    <div 
      className="fixed inset-0 w-[100dvw] h-[100dvh] overflow-auto pt-20 transition-all duration-300"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 800ms ease-in-out',
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 p-1 max-w-[1400px] mx-auto">        
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="text-slate-50/70 mx-6 sm:mx-12 lg:mx-0 lg:w-full backdrop-blur-sm rounded-lg p-4 cursor-pointer
              hover:text-slate-50 transition-all duration-300"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 500ms ease-out ${index * 100}ms`,
            }}
            onClick={() => handleItemClick(index)}
          >
            <div className="relative w-full aspect-square overflow-hidden">
                  <Image 
                    src={scene.thumbnail} 
                    alt={scene.title} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
            <div className="grid grid-flow-col grid-row-1 gap-x-0 gap-y-0 justify-between text-right">

                <p className="font-geist-mono row-span-2 text-xs ">(0{scene.id})</p>
                <div>
                <p className="font-geist-sans col-span-2 text-xs mb-1">{scene.title}</p>
                <p className="font-geist-mono flex items-start text-slate-500 text-xs">
                <MapPin strokeWidth={1.5} className="w-3 h-3 mr-1" />
                  {scene.location}
                </p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};