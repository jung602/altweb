// components//LavelNav.tsx
import { useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export const LabelNavigation = () => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, [isExpanded]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePrevScene = () => {
    const newIndex = currentIndex === 0 ? scenes.length - 1 : currentIndex - 1;
    setCurrentScene(newIndex);
  }

  const handleNextScene = () => {
    const newIndex = currentIndex === scenes.length - 1 ? 0 : currentIndex + 1;
    setCurrentScene(newIndex);
  }

  if (!isExpanded) return null;

  return (
    <>
      {/*  
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
        </button> */}  
      <nav 
        onClick={handleClick}
        className="fixed flex bottom-0 ml-4 mb-4 left-0 translate-y-0 z-[1000] items-stretch gap-[5px] bg-slate-50/80 backdrop-blur p-[6px] rounded">
        <button 
          onClick={handlePrevScene}
          className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
        ><ArrowLeft className="w-4 h-4" /></button>
      </nav>
      <nav 
        onClick={handleClick}
        className="fixed flex right-0 bottom-0 mr-4 mb-4 translate-y-0 z-[1000] items-stretch gap-[5px] bg-slate-50/80 backdrop-blur p-[6px] rounded">

        <button 
          onClick={handleNextScene}
          className="bg-slate-100 hover:bg-slate-100/50 rounded-[50px] text-slate-800 no-underline shadow-[0px_4px_10px_rgba(0,0,0,0.1)] text-center leading-[15px] px-2 py-[7px] font-geist-sans text-xs hover:bg-gray-50 transition-colors"
        ><ArrowRight className="w-4 h-4" /></button>
      </nav>
    </>
  );
};