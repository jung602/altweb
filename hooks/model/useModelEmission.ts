import { useEffect } from 'react';
import * as THREE from 'three';
import { setSceneEmissionIntensity } from '../../utils/memory';

interface UseModelEmissionProps {
  modelRef: React.RefObject<THREE.Group>;
  isCurrentModel: boolean;
}

export function useModelEmission({
  modelRef,
  isCurrentModel
}: UseModelEmissionProps) {
  // 이전/다음 모델일 경우 emission 텍스처 밝기 조정
  useEffect(() => {
    if (modelRef.current) {
      if (!isCurrentModel) {
        // 이전/다음 모델의 경우 emission 밝기를 0.5로 설정
        setSceneEmissionIntensity(modelRef.current, 0.5, {
          logInfo: process.env.NODE_ENV === 'development'
        });
      } else {
        // 현재 모델이 되면 emission 밝기를 1.0으로 복원
        setSceneEmissionIntensity(modelRef.current, 1.0, {
          logInfo: process.env.NODE_ENV === 'development'
        });
      }
    }
  }, [isCurrentModel, modelRef]);
} 