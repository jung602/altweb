import { ModelComponentType } from '../../types/model';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';

/**
 * 모델 프리로드 상태 관리
 * 환경별로 다른 프리로드 전략을 적용합니다.
 */

// 기본 프리로드 맵
const modelPreloadMapBase: Record<ModelComponentType, boolean> = {
  Alt1: false,
  Alt2: false,
  Alt3: false,
  Alt4: false,
  Alt5: false,
  Alt6: false,
  Alt7: false,
  Alt8: false,
  Alt9: false,
};

// 환경별 프리로드 설정
const modelPreloadMapEnv: EnvironmentConfig<Record<ModelComponentType, boolean>> = {
  default: modelPreloadMapBase,
  development: {
    // 개발 환경에서는 필요한 모델만 프리로드
    Alt1: true,  // 개발 중인 주요 모델만 프리로드
  },
  production: {
    // 프로덕션 환경에서는 모든 모델 프리로드하여 사용자 경험 향상
    Alt1: true,
    Alt2: true,
    Alt3: true,
    // 나머지는 필요에 따라 로드
  },
  test: {
    // 테스트 환경에서는 테스트 대상 모델만 프리로드
    Alt1: true,
  }
};

// 환경별 설정이 적용된 최종 프리로드 맵
export const MODEL_PRELOAD_MAP = applyEnvironmentConfig(modelPreloadMapEnv); 