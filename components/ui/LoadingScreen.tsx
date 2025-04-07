import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 측에서만 마운트 여부 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading && loadingProgress < 100) {
      const timer = setTimeout(() => {
        setLoadingProgress(prev => {
          if (prev < 100) {
            // 진행 속도를 비선형적으로 조절
            const increment = Math.max(1, Math.floor((100 - prev) / 10));
            return Math.min(prev + increment, 100);
          }
          return prev;
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingProgress]);

  // 클라이언트 측에서만 렌더링
  if (!isMounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 w-screen h-[100dvh] backdrop-blur-md z-[9999] overflow-hidden"
          initial={{ 
            backgroundColor: 'rgba(0, 0, 0, 1)',
            opacity: 1 
          }}
          exit={{ 
            backgroundColor: 'rgba(0, 0, 0, 0)',
            opacity: 0,
            transition: {
              backgroundColor: {
                duration: 0.8,
                ease: "easeInOut",
              },
              opacity: {
                duration: 0.5,
                delay: 0.8,
                ease: "easeInOut"
              }
            }
          }}
          style={{
            userSelect: 'none'
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
          >
            <motion.div
              className="text-slate-50 font-geist-sans text-[12rem] leading-[0.8] font-light tracking-tighter text-right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                userSelect: 'none'
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