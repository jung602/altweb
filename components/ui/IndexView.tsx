import { useSceneStore } from '../../store/sceneStore';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const IndexView = () => {
  const scenes = useSceneStore((state) => state.scenes);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isIndexView = useSceneStore((state) => state.isIndexView);
  const setExpanded = useSceneStore((state) => state.setExpanded);
  const { width } = useWindowSize();
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
      className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-auto pt-20"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 800ms ease-in-out',
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 max-w-[1400px] mx-auto pointer-events-auto">        
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="text-slate-50/70 w-full backdrop-blur-sm rounded-lg p-4 cursor-pointer
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
            <div className="grid grid-flow-col grid-row-2 h-full gap-x-0 gap-y-0">

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