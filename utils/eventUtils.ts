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
 * 이벤트 전파와 기본 동작을 모두 중지하는 이벤트 핸들러 래퍼 함수
 * @param handler - 원본 이벤트 핸들러
 * @returns 이벤트 전파와 기본 동작을 중지하는 새 핸들러
 */
export function preventDefault<E extends React.SyntheticEvent | Event>(
  handler?: (event: E) => void
) {
  return (event: E) => {
    event.preventDefault();
    handler?.(event);
  };
}

/**
 * 이벤트 전파와 기본 동작을 모두 중지하는 이벤트 핸들러 래퍼 함수
 * @param handler - 원본 이벤트 핸들러
 * @returns 이벤트 전파와 기본 동작을 중지하는 새 핸들러
 */
export function stopAll<E extends React.SyntheticEvent | Event>(
  handler?: (event: E) => void
) {
  return (event: E) => {
    event.stopPropagation();
    event.preventDefault();
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
 * Three.js 이벤트에 특화된 이벤트 핸들러 래퍼 함수
 * @param handler - 원본 이벤트 핸들러
 * @returns 이벤트 전파를 중지하는 새 핸들러
 */
export function stopThreePropagation<E extends ThreeEvent<any>>(
  handler?: (event: E) => void
) {
  return (event: E) => {
    event.stopPropagation();
    handler?.(event);
  };
}

/**
 * Three.js 이벤트에 특화된 커서 스타일 변경 함수
 * @param style - 설정할 커서 스타일
 * @param handler - 원본 이벤트 핸들러
 * @returns 커서 스타일을 변경하는 새 핸들러
 */
export function setThreeCursor<E extends ThreeEvent<any>>(
  style: string,
  handler?: (event: E) => void
) {
  return (event: E) => {
    document.body.style.cursor = style;
    handler?.(event);
  };
} 