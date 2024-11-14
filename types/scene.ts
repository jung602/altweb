import { Alt1 } from "@/models/alt1"
import { Alt2 } from "@/models/alt2"

export type ModelComponent = keyof typeof ModelComponents;

// 모델 컴포넌트 매핑을 타입 레벨에서 정의
export const ModelComponents = {
  Alt1: Alt1,
  Alt2: Alt2,
} as const;

export interface SceneConfig {
  id: number;
  title: string;
  subtitle: string;
  author: string;
  model: {
    component: ModelComponent;
    scale: number;
    position: [number, number, number];
  };
  camera: {
    position: [number, number, number];
    fov: number;
  };
  lights: {
    directional: {
      position: [number, number, number];
      intensity: number;
    };
  };
}