import React, { memo, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/sceneConfig';
import { useFrame } from '@react-three/fiber';

export interface ControlsProps {
  isExpanded: boolean;
  isActive: boolean;
  isCenter: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface ControlsRef {
  reset: () => void;
  object?: THREE.PerspectiveCamera;
}

export const Controls = memo(forwardRef<ControlsRef, ControlsProps>(
  ({ isExpanded, isActive, isCenter, onStart, onEnd }, ref) => {
    const controlsRef = useRef<any>(null);
    const touchStartTime = useRef<number>(0);
    const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (controlsRef.current) {
          controlsRef.current.reset();
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      },
      get object() {
        return controlsRef.current?.object;
      }
    }));

    const controlsConfig = useMemo(() => ({
      ref: controlsRef,
      enabled: true,
      enableZoom: isExpanded,
      enablePan: isExpanded,
      enableRotate: true,
      autoRotate: !isExpanded,
      autoRotateSpeed: 0.1,
      minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      maxPolarAngle: isExpanded ? Math.PI : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      minDistance: isExpanded ? 380 * 0.8 : 380,
      maxDistance: isExpanded ? 380 * 1.3 : 380,
      touches: {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE
      },
      rotateSpeed: 0.5,
      touchStart: (event: any) => {
        touchStartTime.current = Date.now();
        touchStartPos.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      },
      touchMove: (event: any) => {
        const deltaTime = Date.now() - touchStartTime.current;
        const deltaX = event.touches[0].clientX - touchStartPos.current.x;
        const deltaY = event.touches[0].clientY - touchStartPos.current.y;
        
        // 수평 이동이 명확할 때만 회전 활성화
        if (Math.abs(deltaX) > 20) { // 작은 수평 움직임은 무시
          if (!isExpanded) {
            // 확장모드가 아닐 때는 y축 회전만 가능하도록 제한
            const euler = new THREE.Euler().setFromQuaternion(controlsRef.current.object.quaternion, 'YXZ');
            euler.x = ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE;
            controlsRef.current.object.quaternion.setFromEuler(euler);
          }
          controlsRef.current.enabled = true;
          event.preventDefault(); // 브라우저 기본 동작 방지
        } else {
          controlsRef.current.enabled = false;
        }
      },
      touchEnd: () => {
        controlsRef.current.enabled = true;
      }
    }), [isExpanded, isActive, isCenter]);

    useFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    });

    return (
      <OrbitControls 
        {...controlsConfig} 
        onStart={onStart}
        onEnd={onEnd}
      />
    );
  }
));

Controls.displayName = 'Controls';