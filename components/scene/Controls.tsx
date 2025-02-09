import React, { memo, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/sceneConfig';

export interface ControlsProps {
  isExpanded: boolean;
  isInteracting: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export const Controls = memo(({ isExpanded, isInteracting, onStart, onEnd }: ControlsProps) => {
  const controlsConfig = useMemo(() => ({
    enabled: true,
    enableZoom: isExpanded,
    enablePan: false,
    enableRotate: true,
    autoRotate: !isInteracting && !isExpanded,
    autoRotateSpeed: ORBIT_CONTROLS_CONFIG.AUTO_ROTATE_SPEED,
    minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    maxPolarAngle: isExpanded ? ORBIT_CONTROLS_CONFIG.MAX_POLAR_ANGLE : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    minAzimuthAngle: ORBIT_CONTROLS_CONFIG.MIN_AZIMUTH_ANGLE,
    maxAzimuthAngle: ORBIT_CONTROLS_CONFIG.MAX_AZIMUTH_ANGLE,
    minZoom: ORBIT_CONTROLS_CONFIG.ZOOM_SCALE.MIN,
    maxZoom: ORBIT_CONTROLS_CONFIG.ZOOM_SCALE.MAX,
    touches: {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    }
  }), [isExpanded, isInteracting]);
  
  return <OrbitControls {...controlsConfig} onStart={onStart} onEnd={onEnd} />;
}) as React.NamedExoticComponent<ControlsProps>; 