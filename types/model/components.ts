/**
 * 사용 가능한 모델 컴포넌트의 상수 목록
 */
export const MODEL_COMPONENTS = ['Alt1', 'Alt2', 'Alt3', 'Alt4', 'Alt5', 'Alt6', 'Alt7', 'Alt8', 'Alt9'] as const;

/**
 * 모델 컴포넌트 타입
 */
export type ModelComponentType = typeof MODEL_COMPONENTS[number]; 