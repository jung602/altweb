/**
 * 설정 시스템 통합 내보내기
 * 환경별(개발, 테스트, 프로덕션) 설정 관리 시스템
 */

// 환경 설정 관리 시스템 내보내기
export {
  getCurrentEnvironment,
  applyEnvironmentConfig,
  getEnvironmentValue,
  getEnvVar
} from './environment';

// 카메라 관련 설정
export {
  DEFAULT_CAMERA_CONFIG,
  EXPANDED_CAMERA_CONFIG,
  ORBIT_CONTROLS_CONFIG,
  getCameraConfig
} from './camera';

// 렌더러 관련 설정
export {
  RENDERER_CONFIG,
  setupRenderer
} from './renderer';

// 씬 관련 설정
export {
  SCENE_RENDER_CONFIG,
  CANVAS_CONFIG
} from './scene';

// 애니메이션 관련 설정
export {
  ANIMATION_CONFIG,
  SPRING_CONFIG,
  TRANSITION_CONFIG
} from './animation';

// 모델 관련 설정
export {
  MODEL_PRELOAD_MAP
} from './model';

// 타입 내보내기
export * from './types';

/**
 * 환경별 설정 사용 예시:
 * 
 * import { applyEnvironmentConfig } from './config';
 * 
 * const myConfig = applyEnvironmentConfig({
 *   default: { value: 'default' },
 *   development: { value: 'dev' },
 *   production: { value: 'prod' }
 * });
 * 
 * console.log(myConfig.value); // 현재 환경에 따라 'default', 'dev', 또는 'prod'
 */ 