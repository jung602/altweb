import { SpringConfig } from '../types';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';

/**
 * 스프링 애니메이션 설정
 * 환경별로 다른 스프링 설정을 적용합니다.
 */

// 기본 스프링 설정
const springConfigBase: SpringConfig = {
  mass: 1,
  tension: 280,
  friction: 60,
  precision: 0.001
};

// 환경별 스프링 설정
const springConfigEnv: EnvironmentConfig<SpringConfig> = {
  default: springConfigBase,
  development: {
    // 개발 환경에서는 조금 더 빠른 애니메이션 (디버깅 용이)
    tension: 300,
    friction: 50
  },
  production: {
    // 프로덕션 환경에서는 부드러운 애니메이션
    tension: 280,
    friction: 60,
    precision: 0.0005 // 더 높은 정밀도
  },
  test: {
    // 테스트 환경에서는 빠른 애니메이션 (테스트 속도 향상)
    tension: 500,
    friction: 40,
    precision: 0.01 // 더 낮은 정밀도
  }
};

// 환경별 설정이 적용된 최종 설정
export const SPRING_CONFIG = applyEnvironmentConfig(springConfigEnv); 