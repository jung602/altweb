import React from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasConfig, CameraConfig } from '../../../config/types';
import { setupRenderer } from '../../../config/renderer/index';

/**
 * 씬 캔버스 컴포넌트
 * 3D 씬을 렌더링하기 위한 캔버스 및 카메라 설정
 */
interface SceneCanvasProps {
  cameraConfig: CameraConfig;
  canvasConfig: CanvasConfig;
  children: React.ReactNode;
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
        dpr={[1, 2]} // 기본 해상도 설정
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