import { ModelConfig } from '../model';
import { Label } from './label';
import { ReflectorConfig } from './reflector';

/**
 * 씬 구성 타입
 */
export interface SceneConfig {
  id: string;
  title: string;
  description: string;
  location: string;
  thumbnail: string;
  model: ModelConfig;
  labels?: Label[];
  reflector?: ReflectorConfig;
} 