import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useSpring } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';
import { ANIMATION_CONFIG } from '../../config/animation';

interface UseModelTransformProps {
  modelRef: React.RefObject<THREE.Group>;
  isCurrentModel: boolean;
  isExpanded: boolean;
  initialRotation: number;
  baseScale: number;
  basePosition: [number, number, number];
  index: number;
  width: number;
  getResponsiveScale: (scale: number) => number;
  getResponsivePosition: (position: [number, number, number]) => [number, number, number];
  handlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
  handlePointerUp: (e: ThreeEvent<PointerEvent>) => void;
}

export function useModelTransform({
  modelRef,
  isCurrentModel,
  isExpanded,
  initialRotation,
  baseScale,
  basePosition,
  index,
  width,
  getResponsiveScale,
  getResponsivePosition,
  handlePointerDown,
  handlePointerUp
}: UseModelTransformProps) {
  // rotation state (inertia)
  const rotationRef = useRef(initialRotation);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const rotationVelocity = useRef(0);
  const inertiaAnimationRef = useRef<number | null>(null);
  const dampingFactor = 0.95;

  const applyRotation = useCallback((newRotation: number) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = newRotation;
      rotationRef.current = newRotation;
    }
  }, [modelRef]);

  const applyInertia = useCallback(() => {
    if (!isDragging.current && Math.abs(rotationVelocity.current) > 0.00002) {
      rotationVelocity.current *= dampingFactor;
      applyRotation(rotationRef.current + rotationVelocity.current);
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
    } else {
      rotationVelocity.current = 0;
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
    }
  }, [applyRotation]);

  const handleModelPointerMove = useCallback((e: PointerEvent) => {
    if (isDragging.current && isCurrentModel && !isExpanded) {
      const deltaX = e.clientX - lastMouseX.current;
      const rotationFactor = (deltaX / window.innerWidth) * Math.PI * 0.8;
      rotationVelocity.current = rotationFactor * 0.3;
      applyRotation(rotationRef.current + rotationFactor);
      lastMouseX.current = e.clientX;
    }
  }, [isCurrentModel, isExpanded, applyRotation]);

  const handleModelPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isCurrentModel) {
      e.stopPropagation();
      if (!isExpanded) {
        lastMouseX.current = e.clientX;
        isDragging.current = true;
        if (inertiaAnimationRef.current) {
          cancelAnimationFrame(inertiaAnimationRef.current);
          inertiaAnimationRef.current = null;
        }
      }
      handlePointerDown(e);
    }
  }, [isCurrentModel, isExpanded, handlePointerDown]);

  const handleModelPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isCurrentModel) {
      e.stopPropagation();
      if (!isExpanded && isDragging.current) {
        isDragging.current = false;
        if (Math.abs(rotationVelocity.current) > 0.0001) {
          inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
        }
      }
      handlePointerUp(e);
    }
  }, [isCurrentModel, isExpanded, handlePointerUp, applyInertia]);

  const resetRotation = useCallback(() => {
    if (!modelRef.current) return;
    if (inertiaAnimationRef.current) {
      cancelAnimationFrame(inertiaAnimationRef.current);
      inertiaAnimationRef.current = null;
    }
    rotationVelocity.current = 0;
    const startRotation = rotationRef.current;
    const startTime = performance.now();
    const duration = 800;
    const animateReset = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const newRotation = startRotation + (initialRotation - startRotation) * easeOutCubic;
      rotationRef.current = newRotation;
      if (modelRef.current) modelRef.current.rotation.y = newRotation;
      if (progress < 1) {
        inertiaAnimationRef.current = requestAnimationFrame(animateReset);
      } else {
        rotationRef.current = initialRotation;
        if (modelRef.current) modelRef.current.rotation.y = initialRotation;
        inertiaAnimationRef.current = null;
      }
    };
    inertiaAnimationRef.current = requestAnimationFrame(animateReset);
    if (isDragging.current) isDragging.current = false;
  }, [initialRotation, modelRef]);

  useEffect(() => {
    if (!isCurrentModel) return;
    window.addEventListener('pointermove', handleModelPointerMove);
    const handleGlobalPointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        if (Math.abs(rotationVelocity.current) > 0.0001) {
          inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
        }
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleModelPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
    };
  }, [isCurrentModel, handleModelPointerMove, applyInertia]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = initialRotation;
      rotationRef.current = initialRotation;
    }
  }, [initialRotation, modelRef]);

  // scale spring
  const responsiveScale = getResponsiveScale(baseScale);
  const targetScaleFactor = isExpanded ? 1.0 : 0.9;
  const { scale } = useSpring({
    scale: responsiveScale * targetScaleFactor,
    config: {
      mass: 1.2,
      tension: 210,
      friction: 24,
      clamp: false
    }
  });

  // position spring
  const responsivePosition = getResponsivePosition(basePosition);
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;
  const yPos = responsivePosition[1] + (index * -ySpacing);
  const spring = useSpring({
    positionX: responsivePosition[0],
    positionY: yPos,
    positionZ: responsivePosition[2],
    config: {
      ...ANIMATION_CONFIG.SPRING,
      friction: 60,
      tension: 280
    }
  });

  // 자동 회전 처리 - 예전 방식 그대로 구현
  useEffect(() => {
    if (!isCurrentModel || isExpanded) return;
    
    let animationId: number;
    
    const autoRotate = () => {
      if (
        modelRef.current && 
        !isDragging.current && 
        Math.abs(rotationVelocity.current) < 0.0001 &&
        !inertiaAnimationRef.current
      ) {
        // 예전과 동일한 회전 속도
        rotationRef.current += 0.0003;
        
        // 360도(2π) 완료되면 0으로 초기화
        if (rotationRef.current >= Math.PI * 2) {
          rotationRef.current = 0;
        }
        
        modelRef.current.rotation.y = rotationRef.current;
      }
      animationId = requestAnimationFrame(autoRotate);
    };
    
    animationId = requestAnimationFrame(autoRotate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isCurrentModel, isExpanded]);

  useEffect(() => {
    if (!isExpanded) resetRotation();
  }, [isExpanded, resetRotation]);

  return {
    rotationY: rotationRef.current,
    handleModelPointerDown,
    handleModelPointerUp,
    resetRotation,
    finalScale: scale,
    positionSpring: spring
  };
}


