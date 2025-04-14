import { SceneRenderConfig } from '../types';

/**
 * 씬 렌더링 설정
 */
export const SCENE_RENDER_CONFIG: SceneRenderConfig = {
  RENDER_DISTANCE: 2, // 현재 인덱스로부터 몇 개의 씬을 렌더링할지
  LOAD_DELAY_MULTIPLIER: 100, // 로딩 딜레이 계수
  Z_INDEX: {
    CENTER: 12,
    SIDE: 11
  }
}; 