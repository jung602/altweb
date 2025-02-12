import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import type { ModelComponentType } from '../../types/scene';
import Label from '../ui/Label';
import { useSpring, animated } from '@react-spring/three';
import { Stats, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { ModelLoader } from './ModelLoader';
import { debounce } from 'lodash';
import { GroupProps } from '@react-three/fiber';
import { CANVAS_CONFIG, ORBIT_CONTROLS_CONFIG, ANIMATION_CONFIG } from '../../config/sceneConfig';
import { SceneContent } from './SceneContent';
import { Canvas } from '@react-three/fiber';
import { Controls, ControlsRef } from './Controls';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
  /** 씬의 활성화 상태 */
  isActive: boolean;
  /** 씬의 너비 (선택적) */
  width?: number;
  /** 씬의 높이 (선택적) */
  height?: number;
  /** reflector 활성화 여부 */
  reflectorEnabled?: boolean;
  /** 씬이 가운데 위치해 있는지 여부 */
  isCenter?: boolean;
}

/**
 * 3D 모델 props 인터페이스
 * @interface ModelProps
 */
interface ModelProps {
  /** 모델의 URL */
  url: string;
  [key: string]: any;
}

/**
 * 컨트롤 props 인터페이스
 * @interface ControlsProps
 */
interface ControlsProps {
  /** 확장 상태 여부 */
  isExpanded: boolean;
  /** 상호작용 중인지 여부 */
  isInteracting: boolean;
  /** 상호작용 시작 핸들러 */
  onStart: () => void;
  /** 상호작용 종료 핸들러 */
  onEnd: () => void;
}

// 모델 컴포넌트를 별도로 분리하여 메모이제이션
const Model = memo(({ component, ...props }: { component: ModelComponentType } & GroupProps) => {
  return <ModelLoader component={component} {...props} />;
}, (prevProps, nextProps) => prevProps.component === nextProps.component);

// Scene 컴포넌트도 메모이제이션
export const Scene = memo(({ config, isActive, width = 2000, height = 2000, reflectorEnabled = true, isCenter = false }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ControlsRef>(null);
  const initializedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // 기본 거리 값 (고정)
  const BASE_DISTANCE = 29;
  
  // 기본 zoom 계산 함수
  const calculateZoom = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const baseWidth = 1920;
    const scale = viewportWidth / baseWidth;

    // 화면 크기에 따른 세밀한 zoom 조정
    if (viewportWidth < 768) {  // 모바일
      return Math.max(0.7, scale * 1.3);
    } else if (viewportWidth < 1440) {  // 작은 데스크톱
      return Math.max(.9, scale * 1.2);
    } else if (viewportWidth < 1920) {  // 큰 데스크톱
      return Math.max(1.1, scale * 1);
    }else {  // 큰 데스크톱
      return Math.max(1.2, scale * .75);
    }
  }, []);

  // spring 애니메이션 설정
  const [{ zoom }, api] = useSpring(() => ({
    zoom: calculateZoom(),
    config: ANIMATION_CONFIG.SPRING,
    immediate: true
  }));

  // 카메라 상태 업데이트 함수
  const updateCameraState = useCallback((immediate = false) => {
    const newZoom = calculateZoom();
    
    // 현재 값과 새로운 값이 같으면 업데이트하지 않음
    if (zoom.get() === newZoom) {
      return;
    }

    api.start({
      zoom: newZoom,
      immediate,
      config: ANIMATION_CONFIG.SPRING,
      onChange: () => {
        if (controlsRef.current?.object) {
          const camera = controlsRef.current.object as THREE.PerspectiveCamera;
          camera.zoom = isExpanded 
            ? Math.min(Math.max(zoom.get(), 0.8), 1.3) 
            : zoom.get();
          camera.updateProjectionMatrix();
        }
      }
    });
  }, [calculateZoom, api, zoom, isExpanded]);

  // 초기 설정 및 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      updateCameraState(false);
    };

    // 초기 설정
    if (!initializedRef.current) {
      updateCameraState(true);
      initializedRef.current = true;
    }

    // 리사이즈 이벤트 리스너
    const debouncedResize = debounce(handleResize, 200);
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      debouncedResize.cancel();
    };
  }, [updateCameraState]);

  // isExpanded 변경 시 크기 재조정 및 controls 초기화
  useEffect(() => {
    if (!isExpanded && initializedRef.current) {
      updateCameraState(true);
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  }, [isExpanded, updateCameraState]);

  const handleScroll = (e: WheelEvent) => {
    if (isExpanded && isHoveringCanvas) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (isExpanded) {
      window.addEventListener('wheel', handleScroll, { passive: false });
      return () => window.removeEventListener('wheel', handleScroll);
    }
  }, [isExpanded, handleScroll]);

  const handleInteraction = {
    pointerDown: (e: React.PointerEvent) => {
      isDragging.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
    },
    pointerMove: (e: React.PointerEvent) => {
      if (!startPos.current) return;
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);
      if (deltaX > 5 || deltaY > 5) isDragging.current = true;
    },
    pointerUp: (e: React.PointerEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-label]')) return;
      if (!isDragging.current && isActive) toggleExpanded();
      startPos.current = { x: 0, y: 0 };
    }
  };

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="scene-container w-full h-full transition-all duration-500 ease-out cursor-pointer overflow-visible"
      onPointerDown={handleInteraction.pointerDown}
      onPointerMove={handleInteraction.pointerMove}
      onPointerUp={handleInteraction.pointerUp}
    >
      {isVisible && (
        <div 
          className="absolute w-dvw h-dvh left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          onMouseEnter={() => setIsHoveringCanvas(true)}
          onMouseLeave={() => setIsHoveringCanvas(false)}
        >
          <Canvas
            style={{ height: '100%', width: '100%' }}
            frameloop={isActive && isVisible ? 'always' : 'never'}
            camera={{
              position: [5 * BASE_DISTANCE, 6.5 * BASE_DISTANCE, -10 * BASE_DISTANCE],
              fov: 1,
              near: 40,
              far: 1000,
              zoom: zoom.get()
            }}
            gl={{
              antialias: true,
              preserveDrawingBuffer: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1,
              outputColorSpace: THREE.LinearSRGBColorSpace,
            }}
            shadows
          >
            {process.env.NODE_ENV === 'development' && <Stats />}
            <Suspense fallback={null}>
              <animated.group>
                <Controls
                  ref={controlsRef}
                  isExpanded={isExpanded}
                  isInteracting={isDragging.current}
                  isActive={isActive}
                  isCenter={isCenter}
                  onStart={() => isDragging.current = true}
                  onEnd={() => isDragging.current = false}
                />
                <SceneContent
                  config={config}
                  width={width}
                  height={height}
                  reflectorEnabled={reflectorEnabled}
                />
              </animated.group>
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.config === nextProps.config &&
    prevProps.reflectorEnabled === nextProps.reflectorEnabled &&
    prevProps.isCenter === nextProps.isCenter;
});