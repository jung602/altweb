import React, { memo, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/cameraConfig';
import { useFrame } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';

export interface ControlsProps {
  isExpanded: boolean;
  isActive: boolean;
  isCenter: boolean;
  currentIndex: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface ControlsRef {
  reset: () => void;
  object?: THREE.PerspectiveCamera;
}

export const Controls = memo(forwardRef<ControlsRef, ControlsProps>(
  ({ isExpanded, isActive, isCenter, currentIndex, onStart, onEnd }, ref) => {
    const controlsRef = useRef<any>(null);
    const isDragging = useRef(false);
    
    // Spring 애니메이션을 사용하여 부드러운 회전 유지
    const [rotationSpring, rotationApi] = useSpring(() => ({
      rotationY: 0,
      config: {
        ...ANIMATION_CONFIG.SPRING,
        friction: 15,  // 낮은 마찰력으로 부드러운 회전
        tension: 70    // 적절한 장력으로 반응성 유지
      }
    }));

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
      },
      get object() {
        return controlsRef.current?.object;
      },
    }));

    const config = useMemo(() => ({
      minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      maxPolarAngle: isExpanded ? Math.PI : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      minDistance: ORBIT_CONTROLS_CONFIG.MIN_DISTANCE,
      maxDistance: ORBIT_CONTROLS_CONFIG.MAX_DISTANCE,
      enableZoom: isExpanded,
      enablePan: false,
      // 현재 선택된 모델(isActive)이고 확장되지 않은 상태일 때만 회전 활성화
      // 혹은 확장된 상태에서는 항상 활성화
      enableRotate: isExpanded || (isActive && !isExpanded),
      enableDamping: true, // 스무딩 활성화
      dampingFactor: 0.05, // 감쇠 계수
      rotateSpeed: isExpanded ? 1.0 : 0.5, // 확장되지 않은 상태에서는 회전 속도 감소
      // 현재 선택된 모델(isActive)이고 확장되지 않은 상태이며 드래그 중이 아닐 때만 자동 회전
      autoRotate: isActive && !isExpanded && !isDragging.current,
      autoRotateSpeed: 0.5,
      onStart: () => {
        isDragging.current = true;
        if (onStart) onStart();
      },
      onEnd: () => {
        isDragging.current = false;
        if (onEnd) onEnd();
      }
    }), [isExpanded, isActive, onStart, onEnd]);

    // 확장되지 않은 상태에서 X축 회전 제한
    useFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.update();
        
        if (!isExpanded && controlsRef.current.getPolarAngle) {
          // 항상 MAX_POLAR_ANGLE로 고정
          controlsRef.current.setPolarAngle(ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE);
        }
      }
    });

    return <OrbitControls ref={controlsRef} {...config} />;
  }
));

Controls.displayName = 'Controls';