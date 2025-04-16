import { AnimationConfig } from '../types';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';
import { SPRING_CONFIG } from './spring';
import { TRANSITION_CONFIG } from './transition';

// 환경별 통합 애니메이션 설정
const animationConfigEnv: EnvironmentConfig<AnimationConfig> = {
  default: {
    SPRING: SPRING_CONFIG,
    TRANSITION: TRANSITION_CONFIG
  },
  // 각 환경에 대한 추가 설정이 필요한 경우 여기에 정의
  // 현재는 spring.ts와 transition.ts에서 이미 환경별 설정이 적용되어 있음
};

// 환경별 설정이 적용된 최종 애니메이션 설정
export const ANIMATION_CONFIG = applyEnvironmentConfig(animationConfigEnv);

// 개별 설정 내보내기
export { SPRING_CONFIG } from './spring';
export { TRANSITION_CONFIG } from './transition'; 