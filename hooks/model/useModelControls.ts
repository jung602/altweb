import { useEffect } from 'react';
import { RefObject } from 'react';
import { OrbitControlsType, OrbitControlsInterface } from '../../types/controls/orbitControls';

interface UseModelControlsProps {
  isExpanded: boolean;
  controlsRef?: RefObject<OrbitControlsInterface | null>;
  modelControlsRefs: {[key: number]: RefObject<OrbitControlsType | null>};
}

export function useModelControls({
  isExpanded,
  controlsRef,
  modelControlsRefs
}: UseModelControlsProps) {
  // 컨트롤 리셋
  useEffect(() => {
    if (!isExpanded && controlsRef?.current) {
      controlsRef.current.reset();
    }
    
    // 모든 모델의 controlsRef를 리셋
    Object.values(modelControlsRefs).forEach(ref => {
      if (ref.current) {
        ref.current.reset();
      }
    });
  }, [isExpanded, controlsRef, modelControlsRefs]);
} 