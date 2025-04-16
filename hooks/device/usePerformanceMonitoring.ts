import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PerformanceStats, performanceStats } from '../../utils/performance';

export function usePerformanceMonitoring(gl: THREE.WebGLRenderer) {
  // 렌더링 플래그
  const renderingRef = useRef({ isBefore: false, isAfter: false });
  
  // 통합된 성능 모니터 인스턴스 (싱글톤으로 변경)
  const performanceMonitorRef = useRef(performanceStats);

  // 개발 모드에서만 성능 모니터링 활성화
  const isDev = process.env.NODE_ENV === 'development';

  // 성능 모니터 초기화
  useEffect(() => {
    if (!isDev) return;
    
    if (!performanceMonitorRef.current.isActive()) {
      performanceMonitorRef.current.initialize(gl);
      performanceMonitorRef.current.activate();
    }
    
    return () => {
      if (performanceMonitorRef.current.isActive()) {
        performanceMonitorRef.current.dispose();
      }
    };
  }, [gl, isDev]);
  
  // 렌더링 루프에 성능 모니터 업데이트 추가
  useFrame((_state, _delta) => {
    if (!isDev) return;
    
    const monitor = performanceMonitorRef.current;
    if (!monitor || !monitor.isActive()) return;
    
    // 각 프레임의 시작 부분에서 beforeRender 호출
    if (!renderingRef.current.isBefore) {
      monitor.beforeRender();
      renderingRef.current.isBefore = true;
      renderingRef.current.isAfter = false;
    }
    // 프레임의 나머지 부분을 렌더링한 후 afterRender 호출
    else if (!renderingRef.current.isAfter) {
      monitor.afterRender();
      renderingRef.current.isAfter = true;
      // 일반 업데이트도 수행
      monitor.update();
    }
    // 다음 프레임을 위해 리셋
    else {
      renderingRef.current.isBefore = false;
      renderingRef.current.isAfter = false;
    }
  });

  return performanceMonitorRef;
} 