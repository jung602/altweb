import { OrbitControls as ThreeOrbitControls } from 'three-stdlib';

/**
 * OrbitControls 타입 정의
 * @react-three/drei의 OrbitControls 컴포넌트에서 생성된 인스턴스의 타입
 */
export type OrbitControlsType = ThreeOrbitControls;

/**
 * OrbitControls 제어를 위한 간소화된 인터페이스
 * 전체 OrbitControls 인스턴스 대신 필요한 메서드만 노출
 */
export interface OrbitControlsInterface {
  reset: () => void;
  update: () => void;
} 