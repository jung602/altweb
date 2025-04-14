import * as THREE from 'three';
import { Position3D } from '../types/common';

/**
 * 카메라 설정 타입
 */
export interface CameraConfig {
  position: Position3D;
  fov: number;
  near: number;
  far: number;
  zoom: number;
}

/**
 * OrbitControls 설정 타입
 */
export interface OrbitControlsConfig {
  MIN_POLAR_ANGLE: number;
  MAX_POLAR_ANGLE: number;
  MIN_AZIMUTH_ANGLE: number;
  MAX_AZIMUTH_ANGLE: number;
  MIN_DISTANCE: number;
  MAX_DISTANCE: number;
  ZOOM_SCALE: {
    MIN: number;
    MAX: number;
  };
}

/**
 * 렌더러 설정 타입
 */
export interface RendererConfig {
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
}

/**
 * WebGL 설정 타입
 */
export interface WebGLConfig {
  antialias: boolean;
  preserveDrawingBuffer: boolean;
  alpha: boolean;
  powerPreference: "high-performance" | "low-power" | "default";
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  outputColorSpace: THREE.ColorSpace;
}

/**
 * 캔버스 설정 타입
 */
export interface CanvasConfig {
  gl: WebGLConfig;
  dpr: [number, number];
}

/**
 * 씬 렌더링 설정 타입
 */
export interface SceneRenderConfig {
  RENDER_DISTANCE: number;
  LOAD_DELAY_MULTIPLIER: number;
  Z_INDEX: {
    CENTER: number;
    SIDE: number;
  };
}

/**
 * 스프링 애니메이션 설정 타입
 */
export interface SpringConfig {
  mass: number;
  tension: number;
  friction: number;
  precision: number;
}

/**
 * 트랜지션 애니메이션 설정 타입
 */
export interface TransitionConfig {
  duration: number;
  ease: [number, number, number, number];
}

/**
 * 애니메이션 설정 타입
 */
export interface AnimationConfig {
  SPRING: SpringConfig;
  TRANSITION: TransitionConfig;
} 