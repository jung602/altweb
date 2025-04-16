import { WebGLRendererParameters } from 'three';
import { EffectComposerProps } from '@react-three/postprocessing';
import { applyEnvironmentConfig, EnvironmentConfig } from './environment';

// 기본 렌더러 설정
export const rendererConfig: EnvironmentConfig<WebGLRendererParameters> = {
  default: {
    antialias: true,
    alpha: true,
    powerPreference: 'default',
    precision: 'highp',
  },
  development: {
    // 개발 환경에서는 기본 설정 사용
  },
  production: {
    // 프로덕션 환경에서는 성능 최적화를 위한 설정
    powerPreference: 'high-performance',
  }
};

// 이펙트 컴포저 설정
export const effectComposerConfig: EnvironmentConfig<Omit<EffectComposerProps, 'children'>> = {
  default: {
    multisampling: 4,
    frameBufferType: undefined, // 기본값 사용
  },
  development: {
    // 개발 환경에서는 낮은 멀티샘플링 설정 (성능 개선)
    multisampling: 0,
  },
  production: {
    // 프로덕션 환경에서는 고품질 설정
    multisampling: 8,
  }
};

// 픽셀 비율 설정
export const pixelRatioConfig: EnvironmentConfig<number> = {
  default: 1.0,
  development: window.devicePixelRatio > 1 ? 1.0 : window.devicePixelRatio,
  production: Math.min(window.devicePixelRatio, 2.0) // 최대 2.0으로 제한
};

// 최종 설정 내보내기
export const RENDERER_CONFIG = applyEnvironmentConfig(rendererConfig);
export const EFFECT_COMPOSER_CONFIG = applyEnvironmentConfig(effectComposerConfig);
export const PIXEL_RATIO = applyEnvironmentConfig(pixelRatioConfig); 