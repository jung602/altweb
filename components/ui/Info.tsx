import { useEffect, useState } from 'react';
import { X , CornerDownRight } from 'lucide-react';

interface InfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const Info = ({ isOpen, onClose }: InfoProps) => {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && !mounted) {
      setMounted(true);
      setTimeout(() => setIsAnimating(true), 50);
      document.body.style.overflow = 'hidden';
    } 
    
    if (!isOpen && mounted) {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <>
     <div 
        className="fixed inset-0 z-[1001] bg-transparent"
        onClick={onClose}
      />
       <div 
        onClick={onClose}
        className={`z-[1001] fixed inset-x-0 top-0 z-50 w-[100dvw] transition-transform duration-500 ease-in-out
          ${isAnimating ? 'translate-y-0' : '-translate-y-full'}`}
      >
      <div 
        className="bg-slate-50/80 backdrop-blur p-1 rounded-md m-3"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="md:block hidden absolute top-2 right-2 transition-colors"
        >
          <X className="w-4 h-4 text-slate-800 hover:text-slate-800/70" />
        </button>
        <div className='pt-14 md:pt-16 grid grid-cols-1 leading-5 md:grid-cols-2 items-end bg-slate-100/80 shadow-[0px_4px_10px_rgba(0,0,0,0.1)] p-2 rounded text-base font-geist-sans text-slate-800'>
          <div>
            <p>
            Altroom brings real spaces into the digital realm through digital twins, faithfully recreating their essence.
            It’s not just about replication. Altroom captures the unique characteristics of each space and reimagine its possibilities from a fresh perspective.
            Experiments with reality in the digital realm, seeking out untapped possibilities within the familiar.
            </p>
          </div>
            <div className='flex md:flex-col cursor-pointer mt-4 ml-0 md:mt-0 md:ml-3'>
            <a target="_blank" href="mailto:altsroom753@gmail.com" className='flex mr-3 items-center hover:text-slate-800/70'> <CornerDownRight strokeWidth={2.2} className="w-3 h-3 mr-1" /> Email </a>
            <a target="_blank" href="https://www.instagram.com/altroom_3d/" className='flex mr-3 items-center hover:text-slate-800/70'> <CornerDownRight strokeWidth={2.2} className="w-3 h-3 mr-1" /> Instagram </a>
            <a target="_blank" href="https://www.tiktok.com/@altroom3d" className='flex mr-3 items-center hover:text-slate-800/70'> <CornerDownRight strokeWidth={2.2} className="w-3 h-3 mr-1" /> Tiktok </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Info;