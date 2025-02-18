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
      minPolarAngle: ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      maxPolarAngle: ORBIT_CONTROLS_CONFIG.MAX_POLAR_ANGLE,
      minAzimuthAngle: ORBIT_CONTROLS_CONFIG.MIN_AZIMUTH_ANGLE,
      maxAzimuthAngle: ORBIT_CONTROLS_CONFIG.MAX_AZIMUTH_ANGLE,
      minDistance: ORBIT_CONTROLS_CONFIG.MIN_DISTANCE,
      maxDistance: ORBIT_CONTROLS_CONFIG.MAX_DISTANCE,
      enableZoom: isExpanded,
      enablePan: false,
      enableRotate: isExpanded,
      onStart,
      onEnd
    }), [isExpanded, onStart, onEnd]);

    return <OrbitControls ref={controlsRef} {...config} />;
  }
));

Controls.displayName = 'Controls';