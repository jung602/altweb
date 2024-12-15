// components/Navigation.tsx
import { useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

interface NavigationProps {
  onLayoutChange: (isVertical: boolean) => void;
}

export const Navigation = ({ onLayoutChange }: NavigationProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const [isVertical, setIsVertical] = useState(true);

  if (isExpanded) return null;

  const handleLayoutChange = () => {
    const newIsVertical = !isVertical;
    setIsVertical(newIsVertical);
    onLayoutChange(newIsVertical);
  };

  return (
    <nav className="fixed flex top-0 left-1/2 -translate-x-1/2 translate-y-0 mt-5 z-[1000] items-stretch gap-[5px] bg-[#d9d9d9] p-[6px] rounded">
      <button className="bg-white rounded-[50px] text-black no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-sm hover:bg-gray-50 transition-colors">
        info
      </button>
      <button className="bg-white rounded-[50px] text-black no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-sm hover:bg-gray-50 transition-colors">
        index
      </button>
      <button 
        onClick={handleLayoutChange}
        className="bg-white rounded-[50px] text-black no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-sm hover:bg-gray-50 transition-colors"
      >
        {isVertical ? (
          <ArrowRight className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>
    </nav>
  );
};