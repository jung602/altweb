import { TransitionConfig } from '../types';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';

/**
 * 트랜지션 애니메이션 설정
 * 환경별로 다른 트랜지션 설정을 적용합니다.
 */

// 기본 트랜지션 설정
const transitionConfigBase: TransitionConfig = {
  duration: 500,
  ease: [0.43, 0.13, 0.23, 0.96]
};

// 환경별 트랜지션 설정
const transitionConfigEnv: EnvironmentConfig<TransitionConfig> = {
  default: transitionConfigBase,
  development: {
    // 개발 환경에서는 조금 더 빠른 트랜지션 (디버깅 용이)
    duration: 400,
    ease: [0.4, 0.1, 0.2, 0.95]
  },
  production: {
    // 프로덕션 환경에서는 기본 설정 사용
  },
  test: {
    // 테스트 환경에서는 매우 빠른 트랜지션 (테스트 속도 향상)
    duration: 200,
    ease: [0.4, 0, 0.6, 1]
  }
};

// 환경별 설정이 적용된 최종 설정
export const TRANSITION_CONFIG = applyEnvironmentConfig(transitionConfigEnv); 