/**
 * 포인터 위치 인터페이스
 */
export interface PointerPosition {
  x: number;
  y: number;
}

/**
 * useInteraction 훅 옵션 인터페이스
 */
export interface UseInteractionOptions {
  enabled?: boolean;
  threshold?: number;
  onDragStart?: (position: PointerPosition) => void;
  onDrag?: (position: PointerPosition, delta: PointerPosition) => void;
  onDragEnd?: () => void;
  onClick?: (position: PointerPosition) => void;
}

/**
 * useInteraction 훅 결과 인터페이스
 */
export interface UseInteractionResult {
  isDragging: boolean;
  position: PointerPosition | null;
  delta: PointerPosition | null;
} 