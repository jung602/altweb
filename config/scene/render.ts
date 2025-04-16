import { SceneRenderConfig } from '../types';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';

/**
 * 씬 렌더링 설정
 * 환경별로 다른 렌더링 설정을 적용합니다.
 */

// 기본 씬 렌더링 설정
const sceneRenderConfigBase: SceneRenderConfig = {
  RENDER_DISTANCE: 2, // 현재 인덱스로부터 몇 개의 씬을 렌더링할지
  LOAD_DELAY_MULTIPLIER: 100, // 로딩 딜레이 계수
  Z_INDEX: {
    CENTER: 12,
    SIDE: 11
  }
};

// 환경별 씬 렌더링 설정
const sceneRenderConfigEnv: EnvironmentConfig<SceneRenderConfig> = {
  default: sceneRenderConfigBase,
  development: {
    // 개발 환경에서는 더 적은 수의 씬을 렌더링하여 성능 개선
    RENDER_DISTANCE: 1,
    LOAD_DELAY_MULTIPLIER: 50, // 더 빠른 로딩 (디버깅용)
  },
  production: {
    // 프로덕션 환경에서는 사용자 경험을 위해 더 많은 씬을 미리 렌더링
    RENDER_DISTANCE: 2,
    LOAD_DELAY_MULTIPLIER: 100,
  },
  test: {
    // 테스트 환경에서는 최소한의 렌더링으로 빠른 테스트 실행
    RENDER_DISTANCE: 0, // 현재 씬만 렌더링
    LOAD_DELAY_MULTIPLIER: 0, // 딜레이 없음
  }
};

// 환경별 설정이 적용된 최종 씬 렌더링 설정
export const SCENE_RENDER_CONFIG = applyEnvironmentConfig(sceneRenderConfigEnv); 