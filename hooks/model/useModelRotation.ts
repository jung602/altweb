import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface UseModelRotationProps {
  modelRef: React.RefObject<THREE.Group>;
  isCurrentModel: boolean;
  isExpanded: boolean;
  initialRotation: number;
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
}

export function useModelRotation({
  modelRef,
  isCurrentModel,
  isExpanded,
  initialRotation,
  handlePointerDown,
  handlePointerUp
}: UseModelRotationProps) {
  // 현재 rotation 값을 직접 저장
  const rotationRef = useRef(initialRotation);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const rotationVelocity = useRef(0);
  const inertiaAnimationRef = useRef<number | null>(null);
  const dampingFactor = 0.95;

  // 회전 효과를 적용하는 함수
  const applyRotation = useCallback((newRotation: number) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = newRotation;
      rotationRef.current = newRotation;
    }
  }, [modelRef]);
  
  // 관성 애니메이션 처리
  const applyInertia = useCallback(() => {
    if (!isDragging.current && Math.abs(rotationVelocity.current) > 0.00002) {
      rotationVelocity.current *= dampingFactor;
      
      // 직접 rotation 값 업데이트
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
  
  // 드래그로 Y축 회전 처리하는 함수
  const handleModelPointerMove = useCallback((e: any) => {
    if (isDragging.current && isCurrentModel && !isExpanded) {
      const deltaX = e.clientX - lastMouseX.current;
      
      // 회전 계수 계산
      const rotationFactor = (deltaX / window.innerWidth) * Math.PI * 0.8;
      
      // 관성 효과를 위한 속도 계산
      rotationVelocity.current = rotationFactor * 0.3;
      
      // 직접 rotation 값 업데이트
      applyRotation(rotationRef.current + rotationFactor);
      
      lastMouseX.current = e.clientX;
    }
  }, [isCurrentModel, isExpanded, applyRotation]);
  
  // 드래그 시작 처리
  const handleModelPointerDown = useCallback((e: any) => {
    if (isCurrentModel) {
      e.stopPropagation();
      
      // isExpanded가 아닐 때만 회전 인터랙션 활성화
      if (!isExpanded) {
        lastMouseX.current = e.clientX;
        isDragging.current = true;
        
        // 관성 애니메이션 중지
        if (inertiaAnimationRef.current) {
          cancelAnimationFrame(inertiaAnimationRef.current);
          inertiaAnimationRef.current = null;
        }
      }
      
      // 기존 이벤트 핸들러 호출 (onClick 이벤트 유지)
      handlePointerDown(e);
    }
  }, [isCurrentModel, isExpanded, handlePointerDown]);
  
  // 드래그 종료 처리
  const handleModelPointerUp = useCallback((e: any) => {
    if (isCurrentModel) {
      e.stopPropagation();
      
      // isExpanded가 아닐 때만 회전 인터랙션 관련 처리
      if (!isExpanded && isDragging.current) {
        isDragging.current = false;
        
        // 관성 애니메이션 시작
        if (Math.abs(rotationVelocity.current) > 0.0001) {
          inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
        }
      }
      
      // 기존 이벤트 핸들러 호출 (onClick 이벤트 유지)
      handlePointerUp(e);
    }
  }, [isCurrentModel, isExpanded, handlePointerUp, applyInertia]);
  
  // 초기 회전 상태로 돌아가는 함수
  const resetRotation = useCallback(() => {
    if (modelRef.current) {
      // 관성 애니메이션 중지
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
      rotationVelocity.current = 0;
      
      // 자연스러운 애니메이션으로 초기 회전 상태로 되돌리기
      const startRotation = rotationRef.current;
      const startTime = performance.now();
      const duration = 800; // 애니메이션 지속 시간 (밀리초)
      
      const animateReset = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 이징 함수 적용 (ease-out-cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // 현재 회전에서 목표 회전까지 보간
        const newRotation = startRotation + (initialRotation - startRotation) * easeOutCubic;
        
        // 회전 적용
        rotationRef.current = newRotation;
        if (modelRef.current) {
          modelRef.current.rotation.y = newRotation;
        }
        
        // 애니메이션이 완료되지 않았으면 계속 진행
        if (progress < 1) {
          inertiaAnimationRef.current = requestAnimationFrame(animateReset);
        } else {
          // 애니메이션 완료 - 정확히 목표 값으로 설정
          rotationRef.current = initialRotation;
          if (modelRef.current) {
            modelRef.current.rotation.y = initialRotation;
          }
          inertiaAnimationRef.current = null;
        }
      };
      
      // 애니메이션 시작
      inertiaAnimationRef.current = requestAnimationFrame(animateReset);
      
      // 강제로 다시 렌더링하도록 상태 갱신
      if (isDragging.current) {
        isDragging.current = false;
      }
    }
  }, [initialRotation, modelRef]);

  // 컴포넌트 마운트 시 초기 회전 설정
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = initialRotation;
      rotationRef.current = initialRotation;
    }
  }, [initialRotation, modelRef]);
  
  // 전역 이벤트 리스너 등록
  useEffect(() => {
    if (isCurrentModel) {
      window.addEventListener('pointermove', handleModelPointerMove);
      
      // 창 밖으로 나가도 드래그가 해제되도록 window에 pointerup 이벤트 추가
      const handleGlobalPointerUp = (e: any) => {
        if (isDragging.current) {
          handleModelPointerUp(e);
        }
      };
      
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
      
      return () => {
        window.removeEventListener('pointermove', handleModelPointerMove);
        window.removeEventListener('pointerup', handleGlobalPointerUp);
        window.removeEventListener('pointercancel', handleGlobalPointerUp);
        
        // 클린업 시 관성 애니메이션 취소
        if (inertiaAnimationRef.current) {
          cancelAnimationFrame(inertiaAnimationRef.current);
          inertiaAnimationRef.current = null;
        }
      };
    }
  }, [isCurrentModel, handleModelPointerMove, handleModelPointerUp]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
    };
  }, []);

  // 자동 회전 처리 - 드래그나 관성 중이 아닐 때만, 확장되었을 때는 자동 회전하지 않음
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
      rotationRef.current = rotationRef.current + 0.0003;
      modelRef.current.rotation.y = rotationRef.current;
    }
  });

  return {
    rotationY: rotationRef.current,
    handleModelPointerDown,
    handleModelPointerUp,
    resetRotation
  };
} 