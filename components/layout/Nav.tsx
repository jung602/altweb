import { useState } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import Info from '../ui/Info';

interface NavigationProps {}

export const Navigation = ({}: NavigationProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setIndexView = useSceneStore((state) => state.setIndexView);
  const isIndexView = useSceneStore((state) => state.isIndexView);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  if (isExpanded) return null;

  return (
    <>
      <Info isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      
      <nav className="fixed flex top-0 mt-4 left-1/2 -translate-x-1/2 translate-y-0 z-[1000] items-stretch gap-[5px] bg-slate-50/80 backdrop-blur p-[6px] rounded">
        <button 
          onClick={() => setIsInfoOpen(!isInfoOpen)} 
          className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
        >
          INFO
        </button>
        <button 
          onClick={() => setIndexView(!isIndexView)}
          className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
        >
          {isIndexView ? 'BACK' : 'INDEX'}
        </button>
      </nav>
    </>
  );
};