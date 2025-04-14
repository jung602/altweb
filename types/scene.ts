// types/scene.ts
// 이 파일은 타입 마이그레이션을 위해 유지되며, 새 타입 구조를 사용하도록 안내합니다.

// 기존 타입들을 새 구조에서 재내보내기
export { MODEL_COMPONENTS } from './model/components';
export type { ModelComponentType } from './model/components';
export type { Label } from './scene/label';
export type { ReflectorConfig, ReflectorItemConfig } from './scene/reflector';
export type { SceneConfig } from './scene/config';

/**
 * @deprecated 이 파일은 이전 버전과의 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 아래 경로를 직접 import 하세요:
 * - 'types/model': MODEL_COMPONENTS, ModelComponentType, ModelConfig 등
 * - 'types/scene': SceneConfig, Label, ReflectorConfig 등
 * - 'types/common': Position3D, Rotation3D 등
 * - 'types/controls': PointerPosition, UseInteractionOptions 등
 * 
 * 또는 모든 타입을 다음에서 import 할 수 있습니다:
 * - 'types': 모든 타입을 한 번에 import
 */