// components/Navigation.tsx
import { useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import Info from './Info';

interface NavigationProps {
  onLayoutChange: (isVertical: boolean) => void;
}

export const Navigation = ({ onLayoutChange }: NavigationProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const [isVertical, setIsVertical] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  if (isExpanded) return null;

  const handleLayoutChange = () => {
    const newIsVertical = !isVertical;
    setIsVertical(newIsVertical);
    onLayoutChange(newIsVertical);
  };

  return (
    <>
      <Info isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      
      <nav className="fixed flex top-0 mt-4 left-1/2 -translate-x-1/2 translate-y-0 z-[1000] items-stretch gap-[5px] bg-slate-50/80 backdrop-blur p-[6px] rounded">
      <button 
          onClick={() => setIsInfoOpen(!isInfoOpen)} 
          className="bg-slate-100 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
        >
          INFO
        </button>
        <button className="bg-slate-100 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors">
          INDEX
        </button>
        <button 
          onClick={handleLayoutChange}
          className="bg-slate-100 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-sm hover:bg-gray-50 transition-colors"
        >
          {isVertical ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
        </button>
      </nav>
    </>
  );
};