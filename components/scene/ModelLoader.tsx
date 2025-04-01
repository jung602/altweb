import { memo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ModelComponentType } from "../../types/scene"
import { ThreeEvent } from '@react-three/fiber'
import { stopThreePropagation, setThreeCursor } from '../../utils/eventUtils'
import { useModel } from '../../hooks/useModel'

interface ModelLoaderProps {
  component: ModelComponentType
  controlsRef?: React.RefObject<any>
  [key: string]: any
}

export const ModelLoader = memo(({ component, controlsRef, ...props }: ModelLoaderProps) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const isDev = process.env.NODE_ENV === 'development'
  
  // R3F의 useThree 훅을 사용하여 렌더러 직접 접근
  const { gl } = useThree();

  // 통합된 모델 관리 훅 사용
  const { scene, isNewModelReady, previousScene } = useModel({
    component,
    basePath,
    onLoad: () => {
      // 모델 로드 완료 시 컨트롤 리셋
      if (controlsRef?.current) {
        controlsRef.current.reset();
      }
    },
    isDev,
    renderer: gl // WebGLRenderer를 직접 전달
  })

  // Three.js 이벤트에 특화된 유틸리티 함수를 사용한 이벤트 핸들러
  const pointerEnterHandler = stopThreePropagation<ThreeEvent<PointerEvent>>(
    setThreeCursor('pointer', (e: ThreeEvent<PointerEvent>) => {
      if (props.onPointerEnter) props.onPointerEnter(e);
    })
  );

  const pointerLeaveHandler = stopThreePropagation<ThreeEvent<PointerEvent>>(
    setThreeCursor('auto', (e: ThreeEvent<PointerEvent>) => {
      if (props.onPointerLeave) props.onPointerLeave(e);
    })
  );

  // 현재 표시할 씬 결정 (새 모델이 준비되었으면 새 모델, 아니면 이전 모델)
  const currentScene = isNewModelReady ? scene : (previousScene || scene);
  const isVisible = isNewModelReady || !!previousScene;

  return (
    <primitive 
      object={currentScene} 
      {...props}
      visible={isVisible}
      onPointerOver={pointerEnterHandler}
      onPointerOut={pointerLeaveHandler}
    />
  )
})

ModelLoader.displayName = 'ModelLoader' 