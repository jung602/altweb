import { Position3D } from '../common';

/**
 * 3D 장면의 레이블 타입
 */
export interface Label {
  title: string;
  content: string;
  position: Position3D;
} 