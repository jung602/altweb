// components//LavelNav.tsx
import { useState } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { ArrowRight, ArrowDown, ArrowLeft } from 'lucide-react';

export const LabelNavigation = () => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const isLabelsVisible = useSceneStore((state) => state.isLabelsVisible);
  const areLabelsOpen = useSceneStore((state) => state.areLabelsOpen);
  const setLabelsVisible = useSceneStore((state) => state.setLabelsVisible);
  const setLabelsOpen = useSceneStore((state) => state.setLabelsOpen);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!isExpanded) return null;

  return (
    <nav 
    onClick={handleClick}
    className="fixed flex bottom-0 mb-4 left-1/2 -translate-x-1/2 translate-y-0 z-[1000] items-stretch gap-[5px] bg-slate-50/80 backdrop-blur p-[6px] rounded">
            <button 
        className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
      ><ArrowLeft className="w-4 h-4" /></button>
      <button 
        onClick={() => setLabelsVisible(!isLabelsVisible)}
        className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
      >
        {isLabelsVisible ? 'HIDE' : 'VIEW'}
      </button>
      <button 
        onClick={() => setLabelsOpen(!areLabelsOpen)}
        className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
      >
        {areLabelsOpen ? 'CLOSE' : 'OPEN'}
      </button>
      <button 
        className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
      ><ArrowRight className="w-4 h-4" /></button>
    </nav>
  );
};