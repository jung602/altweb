/**
 * 환경 설정 관리 모듈
 * 애플리케이션 환경(개발, 프로덕션 등)에 따른 설정 관리를 담당합니다.
 */

/** 지원하는 환경 타입 */
export type Environment = 'development' | 'production' | 'test';

/** 환경별 설정을 위한 인터페이스 */
export interface EnvironmentConfig<T> {
  /** 기본 설정 */
  default: T;
  /** 개발 환경 설정 (선택 사항) */
  development?: Partial<T>;
  /** 프로덕션 환경 설정 (선택 사항) */
  production?: Partial<T>;
  /** 테스트 환경 설정 (선택 사항) */
  test?: Partial<T>;
}

/**
 * 환경 변수 초기화 상태
 * @private
 */
let _envInitialized = false;

/**
 * 환경 변수 캐시
 * @private
 */
const _envCache: Record<string, string> = {};

/**
 * 환경 변수 초기화
 * 주요 환경 변수를 메모리에 캐싱합니다.
 */
export function initializeEnvironment(): void {
  if (_envInitialized) return;

  // 기본 환경 변수 캐싱
  _envCache['NODE_ENV'] = process.env.NODE_ENV || 'development';
  _envCache['DEBUG'] = process.env.DEBUG || 'false';
  _envCache['PERFORMANCE_MODE'] = process.env.PERFORMANCE_MODE || 'balanced';
  _envCache['MODEL_QUALITY'] = process.env.MODEL_QUALITY || 'high';
  _envCache['PRELOAD_STRATEGY'] = process.env.PRELOAD_STRATEGY || 'auto';

  _envInitialized = true;
}

/**
 * 현재 환경을 반환합니다.
 * process.env.NODE_ENV 값을 기반으로 환경을 판단합니다.
 */
export const getCurrentEnvironment = (): Environment => {
  initializeEnvironment();
  
  const env = _envCache['NODE_ENV'];
  if (env === 'production' || env === 'development' || env === 'test') {
    return env;
  }
  return 'development'; // 기본값은 개발 환경
};

/**
 * 환경별 설정을 적용하여 최종 설정 객체를 반환합니다.
 * @param config 환경별 설정 객체
 * @returns 현재 환경에 맞게 설정이 병합된 객체
 */
export const applyEnvironmentConfig = <T>(config: EnvironmentConfig<T>): T => {
  const currentEnv = getCurrentEnvironment();
  const envConfig = config[currentEnv];
  
  // 기본 설정과 현재 환경 설정을 병합
  if (envConfig) {
    return { ...config.default, ...envConfig };
  }
  
  // 환경별 설정이 없으면 기본 설정 반환
  return config.default;
};

/**
 * 환경별 설정값을 즉시 가져옵니다.
 * @param defaultValue 기본값
 * @param developmentValue 개발 환경 값 (선택 사항)
 * @param productionValue 프로덕션 환경 값 (선택 사항)
 * @param testValue 테스트 환경 값 (선택 사항)
 * @returns 현재 환경에 맞는 값
 */
export const getEnvironmentValue = <T>(
  defaultValue: T,
  developmentValue?: T,
  productionValue?: T,
  testValue?: T
): T => {
  const currentEnv = getCurrentEnvironment();
  
  switch (currentEnv) {
    case 'development':
      return developmentValue !== undefined ? developmentValue : defaultValue;
    case 'production':
      return productionValue !== undefined ? productionValue : defaultValue;
    case 'test':
      return testValue !== undefined ? testValue : defaultValue;
    default:
      return defaultValue;
  }
};

/**
 * 환경 변수 값을 가져옵니다.
 * @param key 환경 변수 키
 * @param defaultValue 기본값
 * @returns 환경 변수 값 또는 기본값
 */
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  initializeEnvironment();
  
  // 캐시된 환경 변수 확인
  if (_envCache[key] !== undefined) {
    return _envCache[key];
  }
  
  // Node.js 환경인 경우 process.env 사용
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key] || defaultValue;
    _envCache[key] = value;
    return value;
  }
  
  // 브라우저 환경인 경우 window.__ENV__ 사용 (런타임 환경 변수)
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    const value = (window as any).__ENV__[key];
    _envCache[key] = value;
    return value;
  }
  
  return defaultValue;
};

/**
 * 퍼포먼스 모드를 가져옵니다.
 * @returns 현재 설정된 퍼포먼스 모드 ('high-performance', 'balanced', 'power-saving')
 */
export const getPerformanceMode = (): 'high-performance' | 'balanced' | 'power-saving' => {
  const mode = getEnvVar('PERFORMANCE_MODE', 'balanced');
  
  switch (mode) {
    case 'high-performance':
    case 'balanced':
    case 'power-saving':
      return mode;
    default:
      return 'balanced';
  }
};

/**
 * 모델 품질 설정을 가져옵니다.
 * @returns 현재 설정된 모델 품질 ('low', 'medium', 'high')
 */
export const getModelQuality = (): 'low' | 'medium' | 'high' => {
  const quality = getEnvVar('MODEL_QUALITY', 'high');
  
  switch (quality) {
    case 'low':
    case 'medium':
    case 'high':
      return quality;
    default:
      return 'high';
  }
};

/**
 * 디버그 모드 여부를 확인합니다.
 * @returns 디버그 모드 여부
 */
export const isDebugMode = (): boolean => {
  return getEnvVar('DEBUG', 'false') === 'true';
}; 