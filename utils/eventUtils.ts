import { ThreeEvent } from '@react-three/fiber';
import React from 'react';

/**
 * 이벤트 전파를 중지하는 이벤트 핸들러 래퍼 함수
 * @param handler - 원본 이벤트 핸들러
 * @returns 이벤트 전파를 중지하는 새 핸들러
 */
export function stopPropagation<E extends React.SyntheticEvent | Event | ThreeEvent<any>>(
  handler?: (event: E) => void
) {
  return (event: E) => {
    event.stopPropagation();
    handler?.(event);
  };
}

/**
 * 이벤트 기본 동작을 중지하고 선택적으로 전파도 중지하는 핸들러 래퍼 함수
 * @param handler - 원본 이벤트 핸들러
 * @param stopProp - 이벤트 전파도 중지할지 여부 (기본값: true)
 * @returns 이벤트 기본 동작과 선택적으로 전파를 중지하는 새 핸들러
 */
export function preventDefault<E extends React.SyntheticEvent | Event>(
  handler?: (event: E) => void,
  stopProp: boolean = true
) {
  return (event: E) => {
    event.preventDefault();
    if (stopProp) {
      event.stopPropagation();
    }
    handler?.(event);
  };
}

/**
 * 커서 스타일을 변경하는 이벤트 핸들러 래퍼 함수
 * @param style - 설정할 커서 스타일
 * @param handler - 원본 이벤트 핸들러
 * @returns 커서 스타일을 변경하는 새 핸들러
 */
export function setCursor<E extends React.SyntheticEvent | Event | ThreeEvent<any>>(
  style: string,
  handler?: (event: E) => void
) {
  return (event: E) => {
    document.body.style.cursor = style;
    handler?.(event);
  };
}

/**
 * 두 핸들러를 연결하여 하나의 이벤트에 두 동작을 수행하는 핸들러 생성
 * @param handler1 - 첫 번째 이벤트 핸들러
 * @param handler2 - 두 번째 이벤트 핸들러
 * @returns 두 핸들러를 순차적으로 실행하는 새 핸들러
 */
export function combineHandlers<E extends React.SyntheticEvent | Event | ThreeEvent<any>>(
  handler1?: (event: E) => void,
  handler2?: (event: E) => void
) {
  return (event: E) => {
    handler1?.(event);
    handler2?.(event);
  };
} 