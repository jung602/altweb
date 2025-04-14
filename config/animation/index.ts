import { AnimationConfig } from '../types';
import { SPRING_CONFIG } from './spring';
import { TRANSITION_CONFIG } from './transition';

/**
 * 애니메이션 설정
 */
export const ANIMATION_CONFIG: AnimationConfig = {
  SPRING: SPRING_CONFIG,
  TRANSITION: TRANSITION_CONFIG
};

export { SPRING_CONFIG } from './spring';
export { TRANSITION_CONFIG } from './transition'; 