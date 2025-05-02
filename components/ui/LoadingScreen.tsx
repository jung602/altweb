import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 측에서만 마운트 여부 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 로딩 진행률 업데이트 로직을 useCallback으로 최적화
  const updateProgress = useCallback(() => {
    if (loadingProgress < 100) {
      // 진행 속도를 비선형적으로 조절
      const increment = Math.max(1, Math.floor((100 - loadingProgress) / 10));
      setLoadingProgress(prev => Math.min(prev + increment, 100));
    }
  }, [loadingProgress]);

  useEffect(() => {
    if (isLoading && loadingProgress < 100) {
      // 리플로우 및 리페인트 최소화를 위해 requestAnimationFrame 사용
      const timer = setTimeout(() => {
        requestAnimationFrame(updateProgress);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingProgress, updateProgress]);

  // 클라이언트 측에서만 렌더링
  if (!isMounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 w-screen h-[100dvh] z-[9999] overflow-hidden"
          initial={{ 
            backgroundColor: 'rgba(0, 0, 0, 1)',
            opacity: 1,
            backdropFilter: 'blur(8px)' 
          }}
          exit={{ 
            backgroundColor: 'rgba(0, 0, 0, 0)',
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: {
              backgroundColor: {
                duration: 0.8,
                ease: "easeInOut",
              },
              opacity: {
                duration: 0.5,
                delay: 0.8,
                ease: "easeInOut"
              },
              backdropFilter: {
                duration: 0.8,
                ease: "easeInOut"
              }
            }
          }}
          style={{
            userSelect: 'none',
            // GPU 가속을 위한 속성 추가
            willChange: 'opacity, backdrop-filter',
            transform: 'translateZ(0)'
          }}
        >
          <motion.div 
            className="fixed bottom-3 right-4 mix-blend-difference"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.8
            }}
            style={{ 
              willChange: 'opacity',
              transform: 'translateZ(0)'
            }}
          >
            <motion.div
              className="text-slate-50 font-geist-sans text-[12rem] leading-[0.8] font-light tracking-tighter text-right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5,
                // 부드러운 애니메이션을 위한 설정 추가
                type: 'spring',
                damping: 20,
                stiffness: 100
              }}
              style={{
                userSelect: 'none',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            >
              {loadingProgress}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen; 