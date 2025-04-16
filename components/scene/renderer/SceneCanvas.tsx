import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CanvasConfig, CameraConfig } from '../../../config/types';
import { setupRenderer } from '../../../config/renderer/index';

interface SceneCanvasProps {
  children: React.ReactNode;
  cameraConfig: CameraConfig;
  canvasConfig: CanvasConfig;
  className?: string;
}

/**
 * 3D 씬 렌더링을 위한 Canvas 컴포넌트
 * Canvas 설정 및 렌더러 초기화를 담당
 */
export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  cameraConfig,
  canvasConfig,
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={cameraConfig}
        gl={canvasConfig.gl}
        onCreated={({ gl }) => {
          setupRenderer(gl);
        }}
        shadows
      >
        {children}
      </Canvas>
    </div>
  );
};

export default SceneCanvas; 