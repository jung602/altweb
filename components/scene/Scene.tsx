import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import { ModelLoader } from './ModelLoader';
import { Controls } from './Controls';
import { Reflector } from './Reflector';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import { useInteraction } from '../../hooks/useInteraction';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';
import { useFrame, useThree } from '@react-three/fiber';
import { setSceneEmissionIntensity } from '../../utils/materialOptimizer';
import { Stats } from '../../utils/Stats';
import { logger } from '../../utils/logger';
import StatsJS from 'stats.js';
import { Stats as CustomStats } from '../../utils/Stats';

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
  /** 모든 씬 설정 객체 배열 */
  allConfigs: SceneConfig[];
  /** 현재 활성화된 씬 인덱스 */
  currentIndex: number;
  controlsRef?: React.RefObject<any>;
}

// 각 모델 렌더링을 담당하는 분리된 컴포넌트
const Model = memo(({ 
  sceneConfig,
  index, 
  currentIndex, 
  isExpanded,
  handlePointerDown,
  handlePointerUp,
  setModelHovered,
  setBlurred,
  controlsRef
}: {
  sceneConfig: SceneConfig;
  index: number;
  currentIndex: number;
  isExpanded: boolean;
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
  setModelHovered: (isHovered: boolean) => void;
  setBlurred?: (isBlurred: boolean) => void;
  controlsRef?: React.RefObject<any>;
}) => {
  const { getResponsiveScale, getResponsivePosition, width } = useResponsiveDevice();
  
  // 기본 위치 및 스케일 계산
  const baseScale = sceneConfig.model.scale;
  const responsiveScale = getResponsiveScale(baseScale);
  const scaleFactor = isExpanded ? 1.0 : 0.9;
  const finalScale = responsiveScale * scaleFactor;
  
  // 위치 계산
  const basePosition = sceneConfig.model.position;
  const responsivePosition = getResponsivePosition(basePosition);
  
  // 브라우저 너비 기준: 768px 이하면 4, 768px 초과 1440px 이하면 5, 1440px 초과면 6
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;
  const yPos = responsivePosition[1] + (index * -ySpacing);
  
  // 스프링 애니메이션 적용
  const spring = useSpring({
    scale: finalScale,
    positionX: responsivePosition[0],
    positionY: yPos,
    positionZ: responsivePosition[2],
    config: {
      ...ANIMATION_CONFIG.SPRING,
      friction: 26,
      tension: 170
    }
  });

  // 모델 회전을 위한 상태 관리
  const [rotationSpring, rotationApi] = useSpring(() => ({
    rotationY: sceneConfig.model.rotation[1],
    config: {
      ...ANIMATION_CONFIG.SPRING,
      friction: 1,  // 부드러운 회전을 위한 마찰 설정
      tension: 1    // 자연스러운 움직임을 위한 장력 설정
    }
  }));

  const isCurrentModel = index === currentIndex;
  const modelRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastTime = useRef(0);
  const rotationVelocity = useRef(0);
  const previouslyCurrentRef = useRef(isCurrentModel);
  const inertiaAnimationRef = useRef<number | null>(null);
  
  // 관성 애니메이션 처리
  const applyInertia = useCallback(() => {
    if (!isDragging.current && Math.abs(rotationVelocity.current) > 0.0001) {
      // 관성 효과 - 천천히 속도 감소
      rotationVelocity.current *= 0.99;
      
      rotationApi.start({
        rotationY: rotationSpring.rotationY.get() + rotationVelocity.current,
        immediate: true
      });
      
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
    } else {
      rotationVelocity.current = 0;
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
    }
  }, [rotationApi, rotationSpring.rotationY]);
  
  // 모델별 사용자 상호작용 처리
  const handleModelPointerDown = (e: any) => {
    // 기존 이벤트 핸들러 호출
    handlePointerDown(e);
    
    // 드래그 시작 지점 기록
    lastMouseX.current = e.clientX;
    lastTime.current = performance.now();
    isDragging.current = true;
    
    // 관성 애니메이션 중지
    if (inertiaAnimationRef.current) {
      cancelAnimationFrame(inertiaAnimationRef.current);
      inertiaAnimationRef.current = null;
    }
    rotationVelocity.current = 0;
  };
  
  const handleModelPointerUp = (e: any) => {
    // 기존 이벤트 핸들러 호출
    handlePointerUp(e);
    
    // 드래그 종료 및 관성 시작
    isDragging.current = false;
    
    // 관성 애니메이션 시작
    if (Math.abs(rotationVelocity.current) > 0.0001) {
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
    }
  };

  // 포인터 이동 처리
  const handleModelPointerMove = (e: any) => {
    if (isDragging.current && !isExpanded && isCurrentModel) {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime.current;
      const deltaX = e.clientX - lastMouseX.current;
      
      // 회전 계수 계산 - 화면 너비에 비례
      const rotationFactor = (deltaX / window.innerWidth) * Math.PI * 1.2;
      
      // 속도 계산 (시간 기반)
      if (deltaTime > 0) {
        rotationVelocity.current = rotationFactor / deltaTime * 16; // 60fps 기준 정규화
      }
      
      // 회전 애니메이션 적용 - 마찰이 낮아 더 쉽게 움직이고 관성이 있음
      rotationApi.start({
        rotationY: rotationSpring.rotationY.get() + rotationFactor,
        config: {
          ...ANIMATION_CONFIG.SPRING,
          friction: 12,  // 더 낮은 마찰력으로 부드러운 회전
          tension: 60    // 적절한 장력으로 반응성 유지
        }
      });
      
      lastMouseX.current = e.clientX;
      lastTime.current = currentTime;
    }
  };

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    if (isCurrentModel && !isExpanded) {
      window.addEventListener('pointermove', handleModelPointerMove);
      
      return () => {
        window.removeEventListener('pointermove', handleModelPointerMove);
        // 클린업 시 관성 애니메이션 취소
        if (inertiaAnimationRef.current) {
          cancelAnimationFrame(inertiaAnimationRef.current);
          inertiaAnimationRef.current = null;
        }
      };
    }
  }, [isCurrentModel, isExpanded, handleModelPointerMove]);

  // 자동 회전 처리 - 드래그나 관성 중이 아닐 때만
  useFrame(() => {
    if (
      modelRef.current && 
      isCurrentModel && 
      !isExpanded && 
      !isDragging.current && 
      Math.abs(rotationVelocity.current) < 0.0001 &&
      !inertiaAnimationRef.current
    ) {
      // 스프링 애니메이션으로 부드러운 회전
      rotationApi.start({
        rotationY: rotationSpring.rotationY.get() + 0.0003, // 약간 더 느리게
        config: {
          ...ANIMATION_CONFIG.SPRING,
          friction: 200, // 높은 마찰력으로 부드러운 회전
          tension: 40   // 더 낮은 장력으로 부드러운 회전
        }
      });
    }
  });

  // 현재 모델이 변경되었을 때 초기 상태로 회전 애니메이션 적용
  useEffect(() => {
    if (previouslyCurrentRef.current && !isCurrentModel) {
      // 이전에 현재 모델이었다가 다른 모델로 넘어간 경우
      // 부드러운 애니메이션으로 초기 회전 상태로 돌아가기
      
      // 관성 애니메이션 중지
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
      rotationVelocity.current = 0;
      
      rotationApi.start({
        rotationY: sceneConfig.model.rotation[1],
        config: {
          ...ANIMATION_CONFIG.SPRING,
          friction: 35,
          tension: 80
        }
      });
    }
    
    // 현재 상태 기록
    previouslyCurrentRef.current = isCurrentModel;
  }, [isCurrentModel, sceneConfig.model.rotation, rotationApi, applyInertia]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
      }
    };
  }, []);

  // 이전/다음 모델일 경우 emission 텍스처 밝기 조정
  useEffect(() => {
    // modelRef.current는 모델 로딩 후 설정됨
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
  }, [isCurrentModel]);

  return (
    <animated.group
      ref={modelRef}
      position-x={spring.positionX}
      position-y={spring.positionY}
      position-z={spring.positionZ}
      scale-x={spring.scale}
      scale-y={spring.scale}
      scale-z={spring.scale}
      rotation-x={sceneConfig.model.rotation[0]}
      rotation-y={rotationSpring.rotationY}
      rotation-z={sceneConfig.model.rotation[2]}
      onPointerEnter={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          setModelHovered(true);
        }
      }}
      onPointerLeave={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          setModelHovered(false);
        }
      }}
      onPointerDown={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          handleModelPointerDown(e);
        }
      }}
      onPointerUp={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          handleModelPointerUp(e);
        }
      }}
    >
      <React.Suspense fallback={null}>
        <ModelLoader 
          component={sceneConfig.model.component}
          controlsRef={controlsRef}
          isCurrentModel={isCurrentModel}
        />
      </React.Suspense>
      
      {/* Reflector 항상 표시 */}
      <Reflector config={sceneConfig.reflector} isCurrentModel={isCurrentModel} />
      
      {/* 확장된 상태에서만 Controls 표시 */}
      {isExpanded && isCurrentModel && (
        <Controls
          ref={controlsRef}
          isExpanded={isExpanded}
          isActive={isCurrentModel}
          isCenter={isCurrentModel}
          currentIndex={currentIndex}
          onStart={() => {
            // 인터랙션 시작 시 추가 로직이 필요한 경우 여기에 작성
          }}
          onEnd={() => {
            // OrbitControls 회전 종료 시 블러 효과 제거
            if (setBlurred) {
              setBlurred(false);
            }
          }}
        />
      )}
    </animated.group>
  );
});

Model.displayName = 'Model';

export const Scene = memo(({ config, allConfigs, currentIndex, controlsRef }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const groupRef = useRef<THREE.Group>(null);
  const isDev = process.env.NODE_ENV === 'development';

  // 모델별 controlsRef를 관리하는 객체
  const modelControlsRefs = useRef<{[key: number]: React.RefObject<any>}>({});

  // 이전 인덱스 추적
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  
  // 로드된 모델을 추적
  const [visibleModels, setVisibleModels] = useState<number[]>([
    Math.max(0, currentIndex - 1),
    currentIndex,
    Math.min(allConfigs.length - 1, currentIndex + 1)
  ].filter((idx, i, arr) => arr.indexOf(idx) === i)); // 중복 제거
  
  // 언로드 타이머
  const unloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 모델별 회전 상태 관리를 위한 로직
  const [rotationSpring, rotationApi] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    config: ANIMATION_CONFIG.SPRING
  }));

  // 기본 인터랙션 설정
  const {
    handlePointerDown,
    handlePointerUp,
    isUserInteracting,
    isDragging
  } = useInteraction({
    isExpanded,
    toggleExpanded,
    setBlurred,
    // 회전 관련 설정 제거 (개별 모델에서 처리하도록 변경)
    // rotationApi,
    // rotationY: rotationSpring.rotationY,
    debug: isDev,
    enableRotation: false, // 전역 회전 비활성화
    enableMouseTracking: true
  });

  // 현재 기기의 반응형 정보 가져오기
  const { width } = useResponsiveDevice();
  
  // 브라우저 너비 기준: 768px 이하면 4, 768px 초과 1440px 이하면 5, 1440px 초과면 6
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;

  // 전체 모델 그룹의 y축 위치 애니메이션
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });

  // Stats 인스턴스를 위한 ref 추가
  const statsRef = useRef<Stats | null>(null);
  // WebGL 컨텍스트 접근을 위한 three hook 사용
  const { gl } = useThree();
  // 렌더링 플래그
  const renderingRef = useRef({ isBefore: false, isAfter: false });

  // Stats 인스턴스 생성
  const threeStatsRef = useRef<StatsJS | null>(null);
  const customStatsRef = useRef<CustomStats | null>(null);
  
  // Stats 초기화
  useEffect(() => {
    // 개발 환경에서만 Stats 초기화
    if (process.env.NODE_ENV !== 'development') return;
    
    // Three.js Stats 생성
    const threeStats = new StatsJS();
    threeStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    threeStats.dom.style.cssText = 'position:fixed;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000;';
    document.body.appendChild(threeStats.dom);
    threeStatsRef.current = threeStats;
    
    // 커스텀 Stats 생성
    const customStats = new CustomStats();
    customStatsRef.current = customStats;
    
    // 디버깅용 로그 추가
    console.log('커스텀 Stats maxValue:', customStats.getMetrics().fps.maxValue);
    
    // WebGL 렌더러에 접근하여 커스텀 Stats에 설정
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const gl = canvas.getContext('webgl2');
      if (gl && customStats) {
        customStats.setRenderContext(gl as WebGL2RenderingContext);
      }
    }
    
    return () => {
      // 정리
      if (threeStatsRef.current) {
        document.body.removeChild(threeStatsRef.current.dom);
      }
      if (customStatsRef.current) {
        customStatsRef.current.dispose();
      }
    };
  }, []);
  
  // 렌더링 루프에 Stats 업데이트 추가
  useFrame(() => {
    // 개발 환경에서만 Stats 업데이트
    if (process.env.NODE_ENV !== 'development') return;
    
    if (threeStatsRef.current) {
      threeStatsRef.current.update();
    }
    if (customStatsRef.current) {
      customStatsRef.current.update();
    }
  });

  // Stats 인스턴스를 위한 ref 추가
  useEffect(() => {
    // 개발 환경에서만 Stats 초기화
    if (process.env.NODE_ENV !== 'development') return;
    
    if (isDev && !statsRef.current) {
      statsRef.current = new Stats();
      
      // 디버깅용 로그 추가
      console.log('기존 Stats maxValue:', statsRef.current.getMetrics().fps.maxValue);

      // WebGL 컨텍스트 설정
      const context = gl.getContext();
      if (context instanceof WebGL2RenderingContext) {
        statsRef.current.setRenderContext(context);
      }

      // 성능 이슈 감지 리스너 추가
      statsRef.current.on('metricUpdated', ({ type, value }) => {
        if (type === 'fps' && value < 30) {
          logger.warn(`낮은 FPS 감지: ${value.toFixed(1)}`);
        } else if (type === 'memory' && value > 80) {
          logger.warn(`높은 메모리 사용량: ${value.toFixed(1)}%`);
        }
      });
    }

    return () => {
      if (statsRef.current) {
        statsRef.current.dispose();
        statsRef.current = null;
      }
    };
  }, [isDev, gl]);

  // 렌더링 전/후 및 업데이트 시 Stats 메서드 호출
  // useFrame은 React Three Fiber의 렌더 루프에서 실행됨
  useFrame((_state, _delta) => {
    // 개발 환경에서만 Stats 업데이트
    if (process.env.NODE_ENV !== 'development') return;
    
    if (statsRef.current) {
      // 각 프레임의 시작 부분에서 beforeRender 호출
      if (!renderingRef.current.isBefore) {
        statsRef.current.beforeRender();
        renderingRef.current.isBefore = true;
        renderingRef.current.isAfter = false;
      }
      
      // 프레임의 나머지 부분을 렌더링한 후 afterRender 호출
      else if (!renderingRef.current.isAfter) {
        statsRef.current.afterRender();
        renderingRef.current.isAfter = true;
        // 일반 업데이트도 수행
        statsRef.current.update();
      }
      // 다음 프레임을 위해 리셋
      else {
        renderingRef.current.isBefore = false;
        renderingRef.current.isAfter = false;
      }
    }
  });

  // 컨트롤 리셋
  useEffect(() => {
    if (!isExpanded && controlsRef?.current) {
      controlsRef.current.reset();
    }
    
    // 모든 모델의 controlsRef를 리셋
    Object.values(modelControlsRefs.current).forEach(ref => {
      if (ref.current) {
        ref.current.reset();
      }
    });
  }, [isExpanded, controlsRef]);

  // 현재, 이전, 다음 모델만 로드하도록 관리 및 isExpanded 상태에 따라 메모리 해제
  useEffect(() => {
    // isExpanded 상태일 때는 현재 모델만 유지하고 다른 모델은 메모리에서 해제
    if (isExpanded) {
      if (visibleModels.length > 1 || !visibleModels.includes(currentIndex)) {
        setVisibleModels([currentIndex]);
      }
      return;
    }

    // 인덱스가 변경되었거나 isExpanded가 false로 변경된 경우 
    if (currentIndex !== prevIndex || visibleModels.length === 1) {
      // 현재 모델, 이전 모델, 다음 모델 순서로 배열 구성 (현재 모델이 1순위)
      const newVisibleModels = [
        currentIndex, // 현재 모델 먼저 로드 (1순위)
        Math.max(0, currentIndex - 1), // 이전 모델
        Math.min(allConfigs.length - 1, currentIndex + 1) // 다음 모델
      ].filter((idx, i, arr) => arr.indexOf(idx) === i); // 중복 제거
      
      setVisibleModels(newVisibleModels);
      setPrevIndex(currentIndex);
    }
  }, [currentIndex, allConfigs.length, visibleModels, prevIndex, isExpanded]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 모델 메모리 해제
      setVisibleModels([]);
    };
  }, []);

  return (
    <group>
      <color attach="background" args={['black']} />
      
      {/* 각 모델을 y축으로 -6 간격으로 배치하는 그룹 전체를 애니메이션으로 이동 */}
      <animated.group position-y={modelsPositionY.y}>
        {allConfigs.map((sceneConfig, index) => {
          // 모델별로 고유한 ref 생성 및 관리
          if (!modelControlsRefs.current[index]) {
            modelControlsRefs.current[index] = React.createRef();
          }
          // 현재 모델이 로드되어 있는지 확인
          return visibleModels.includes(index) && (
            <Model
              key={`model-${index}`}
              sceneConfig={sceneConfig}
              index={index}
              currentIndex={currentIndex}
              isExpanded={isExpanded}
              handlePointerDown={handlePointerDown}
              handlePointerUp={handlePointerUp}
              setModelHovered={setModelHovered}
              setBlurred={setBlurred}
              controlsRef={modelControlsRefs.current[index]}
            />
          );
        })}
      </animated.group>
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.config === nextProps.config && 
         prevProps.currentIndex === nextProps.currentIndex;
});

Scene.displayName = 'Scene';