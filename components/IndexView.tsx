import { useSceneStore } from '../store/sceneStore';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const setIsExpanded = useSceneStore((state) => state.setExpanded);
  const { width } = useWindowSize();

  if (!isIndexView) return null;

  const handleItemClick = (index: number) => {
    setCurrentScene(index);
    setIsExpanded(true);
  };

  return (
    <div className="fixed inset-0 w-[100dvw] h-[100dvh] pointer-events-none overflow-auto pt-20">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-6 p-6 max-w-[1400px] mx-auto pointer-events-auto">        
          {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="w-full h-[100px] bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 cursor-pointer
              hover:bg-slate-800/50 transition-colors duration-300"
            onClick={() => handleItemClick(index)}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <p className="font-geist-mono text-xs text-white">(0{scene.id})</p>
              </div>
              <div>
                <h2 className="font-geist-sans text-sm text-white mb-1">
                  {scene.title}
                </h2>
                <h3 className="font-geist-mono flex items-center text-slate-400 text-xs">
                  <MapPin strokeWidth={1.5} className="w-3 h-3 mr-1" />
                  {scene.location}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};