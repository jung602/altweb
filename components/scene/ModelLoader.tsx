import { memo, useEffect, ComponentProps } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ModelComponentType } from "../../types/scene"
import { ThreeEvent } from '@react-three/fiber'
import { stopPropagation, setCursor } from '../../utils/eventUtils'
import { useModel } from '../../hooks/model'
import { setSceneEmissionIntensity } from '../../utils/memory'
import { OrbitControlsInterface } from '../../types/controls/orbitControls'

/**
 * ModelLoader 컴포넌트의 props 인터페이스
 */
interface ModelLoaderProps extends Omit<ComponentProps<'primitive'>, 'object'> {
  component: ModelComponentType
  controlsRef?: React.MutableRefObject<OrbitControlsInterface | null>
  isCurrentModel?: boolean
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave?: (e: ThreeEvent<PointerEvent>) => void
}

export const ModelLoader = memo(({ component, controlsRef, isCurrentModel = true, ...props }: ModelLoaderProps) => {
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

  // 모델 로드 후 emission 밝기 설정
  useEffect(() => {
    if (scene) {
      if (!isCurrentModel) {
        // 이전/다음 모델의 경우 emission 밝기를 0.5로 설정
        setSceneEmissionIntensity(scene, 0.3, {
          logInfo: isDev
        });
      } else {
        // 현재 모델이 되면 emission 밝기를 1.0으로 복원
        setSceneEmissionIntensity(scene, 1.0, {
          logInfo: isDev
        });
      }
    }
  }, [scene, isCurrentModel, isDev]);

  // 이벤트 핸들러
  const pointerEnterHandler = stopPropagation<ThreeEvent<PointerEvent>>(
    setCursor('pointer', (e: ThreeEvent<PointerEvent>) => {
      if (props.onPointerEnter) props.onPointerEnter(e);
    })
  );

  const pointerLeaveHandler = stopPropagation<ThreeEvent<PointerEvent>>(
    setCursor('auto', (e: ThreeEvent<PointerEvent>) => {
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