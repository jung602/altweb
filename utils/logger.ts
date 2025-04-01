/**
 * 로그 레벨 타입
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 로그 스타일 설정
 */
export const LOG_STYLES = {
  debug: 'color: #9E9E9E;',
  info: 'color: #2196F3;',
  warn: 'color: #FF9800; font-weight: bold;',
  error: 'color: #F44336; font-weight: bold;',
  success: 'color: #4CAF50;',
  title: 'color: #4CAF50; font-weight: bold; font-size: 12px;',
  group: 'color: #9C27B0; font-style: italic;'
};

/**
 * 개발 모드 여부 확인
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * 조건부 로깅 함수
 * @param message - 로그 메시지
 * @param condition - 로깅 조건 (기본값: 개발 모드)
 * @param level - 로그 레벨 (기본값: 'info')
 */
export function conditionalLog(
  message: string,
  condition: boolean = isDev,
  level: LogLevel = 'info'
): void {
  if (!condition) return;
  
  switch (level) {
    case 'debug':
      console.debug(`%c${message}`, LOG_STYLES.debug);
      break;
    case 'info':
      console.log(`%c${message}`, LOG_STYLES.info);
      break;
    case 'warn':
      console.warn(`%c${message}`, LOG_STYLES.warn);
      break;
    case 'error':
      console.error(`%c${message}`, LOG_STYLES.error);
      break;
  }
}

/**
 * 개발 모드에서만 로깅하는 함수
 * @param message - 로그 메시지
 * @param level - 로그 레벨 (기본값: 'info')
 */
export function devLog(message: string, level: LogLevel = 'info'): void {
  conditionalLog(message, isDev, level);
}

/**
 * 성공 메시지 로깅 함수
 * @param message - 로그 메시지
 * @param condition - 로깅 조건 (기본값: 개발 모드)
 */
export function successLog(message: string, condition: boolean = isDev): void {
  if (!condition) return;
  console.log(`%c${message}`, LOG_STYLES.success);
}

/**
 * 그룹화된 로그 시작
 * @param title - 그룹 제목
 * @param condition - 로깅 조건 (기본값: 개발 모드)
 */
export function startGroup(title: string, condition: boolean = isDev): void {
  if (!condition) return;
  console.group(`%c${title}`, LOG_STYLES.title);
}

/**
 * 그룹화된 로그 종료
 * @param condition - 로깅 조건 (기본값: 개발 모드)
 */
export function endGroup(condition: boolean = isDev): void {
  if (!condition) return;
  console.groupEnd();
}

/**
 * 성능 측정 시작
 * @param label - 성능 측정 라벨
 * @param condition - 측정 조건 (기본값: 개발 모드)
 */
export function startPerformance(label: string, condition: boolean = isDev): void {
  if (!condition) return;
  console.time(label);
}

/**
 * 성능 측정 종료
 * @param label - 성능 측정 라벨
 * @param condition - 측정 조건 (기본값: 개발 모드)
 */
export function endPerformance(label: string, condition: boolean = isDev): void {
  if (!condition) return;
  console.timeEnd(label);
} 