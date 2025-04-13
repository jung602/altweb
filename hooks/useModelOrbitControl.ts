import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ORBIT_CONTROLS_CONFIG } from '../config/cameraConfig';

interface UseModelOrbitControlProps {
  modelRef: React.RefObject<THREE.Group>;
  controlsRef: React.RefObject<any>;
  isCurrentModel: boolean;
  isExpanded: boolean;
  enabled: boolean;
}

/**
 * OrbitControls를 설정하고 관리하는 커스텀 훅
 */
export function useModelOrbitControl({
  modelRef,
  controlsRef,
  isCurrentModel,
  isExpanded,
  enabled = true
}: UseModelOrbitControlProps) {
  
  useEffect(() => {
    // 타겟 설정 (모델 중심점으로)
    if (controlsRef?.current && modelRef.current && isCurrentModel && isExpanded && enabled) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // OrbitControls가 있으면 타겟 설정
      if (controlsRef.current.target) {
        controlsRef.current.target.copy(center);
      }
      
      // OrbitControls 세부 설정
      if (typeof controlsRef.current.update === 'function') {
        controlsRef.current.update();
      }
      
      // 마우스 인터랙션 후 블러 해제를 위한 이벤트 리스너 설정
      const handleInteractionEnd = () => {
        if (typeof controlsRef.current.autoBlur === 'boolean') {
          controlsRef.current.autoBlur = true;
        }
        controlsRef.current.update();
      };
      
      // 각 인터랙션 종료 이벤트에 리스너 추가
      controlsRef.current.addEventListener('end', handleInteractionEnd);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        if (controlsRef.current) {
          controlsRef.current.removeEventListener('end', handleInteractionEnd);
        }
      };
    }
  }, [modelRef, isCurrentModel, isExpanded, enabled, controlsRef]);

  // 리셋 함수 제공
  const resetOrbitControls = () => {
    if (controlsRef?.current && typeof controlsRef.current.reset === 'function') {
      controlsRef.current.reset();
    }
  };

  // OrbitControls 리셋 함수 반환
  return {
    resetOrbitControls
  };
} 