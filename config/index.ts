/**
 * 통합 설정 내보내기
 */

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