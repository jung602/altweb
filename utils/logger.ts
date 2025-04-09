import { EventEmitter } from './EventEmitter';

/**
 * 로그 레벨 타입
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 세부 로그 레벨
 */
export type DetailLevel = 'none' | 'basic' | 'detailed' | 'verbose';

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
  group: 'color: #9C27B0; font-style: italic;',
  memory: 'color: #E91E63; font-weight: bold;',
  performance: 'color: #FF5722;',
  viewport: 'color: #00BCD4;',
  resource: 'color: #CDDC39;'
};

/**
 * 개발 모드 여부 확인
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * 확장된 Logger 클래스
 */
export class Logger extends EventEmitter {
  private static instance: Logger;
  private detailLevel: DetailLevel;
  private styles: Record<string, string>;
  
  private constructor() {
    super();
    this.detailLevel = isDev ? 'detailed' : 'basic';
    this.styles = LOG_STYLES;
  }
  
  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * 로그 레벨 설정
   */
  public setLogLevel(level: DetailLevel): void {
    this.detailLevel = level;
  }
  
  /**
   * 현재 로그 레벨 반환
   */
  public getLogLevel(): DetailLevel {
    return this.detailLevel;
  }
  
  /**
   * 일반 로그 출력
   */
  public log(message: string, style: keyof typeof this.styles = 'info', condition: boolean = true): void {
    if (this.detailLevel === 'none' || !condition) return;
    
    console.log(`%c${message}`, this.styles[style] || this.styles.info);
    this.emit('log', { message, style });
  }
  
  /**
   * 조건부 로그 출력
   */
  public conditionalLog(message: string, condition: boolean = isDev, level: LogLevel = 'info'): void {
    if (!condition) return;
    
    switch (level) {
      case 'debug':
        this.log(message, 'debug', condition);
        break;
      case 'info':
        this.log(message, 'info', condition);
        break;
      case 'warn':
        this.warn(message, condition);
        break;
      case 'error':
        this.error(message);
        break;
    }
  }
  
  /**
   * 개발 모드 로그 출력
   */
  public devLog(message: string, level: LogLevel = 'info'): void {
    this.conditionalLog(message, isDev, level);
  }
  
  /**
   * 경고 메시지 출력
   */
  public warn(message: string, condition: boolean = true): void {
    if (this.detailLevel === 'none' || !condition) return;
    
    console.warn(`%c${message}`, this.styles.warn);
    this.emit('warning', { message });
  }
  
  /**
   * 오류 메시지 출력
   */
  public error(message: string): void {
    console.error(`%c${message}`, this.styles.error);
    this.emit('error', { message });
  }
  
  /**
   * 성공 메시지 출력
   */
  public success(message: string, condition: boolean = isDev): void {
    if (this.detailLevel === 'none' || !condition) return;
    
    console.log(`%c${message}`, this.styles.success);
    this.emit('success', { message });
  }
  
  /**
   * 로그 그룹 시작
   */
  public group(title: string, collapsed: boolean = false, condition: boolean = isDev): void {
    if (this.detailLevel === 'none' || !condition) return;
    
    if (collapsed) {
      console.groupCollapsed(`%c${title}`, this.styles.title);
    } else {
      console.group(`%c${title}`, this.styles.title);
    }
    this.emit('groupStart', { title, collapsed });
  }
  
  /**
   * 로그 그룹 종료
   */
  public groupEnd(condition: boolean = isDev): void {
    if (this.detailLevel === 'none' || !condition) return;
    
    console.groupEnd();
    this.emit('groupEnd');
  }
  
  /**
   * 성능 측정 시작
   */
  public startPerformance(label: string, condition: boolean = isDev): void {
    if (!condition) return;
    console.time(label);
    this.emit('perfStart', { label });
  }
  
  /**
   * 성능 측정 종료
   */
  public endPerformance(label: string, condition: boolean = isDev): void {
    if (!condition) return;
    console.timeEnd(label);
    this.emit('perfEnd', { label });
  }
  
  /**
   * 메모리 정리 통계 출력
   */
  public memoryCleanup(stats: any): void {
    if (this.detailLevel === 'none') return;
    
    this.group('메모리 정리 통계', this.detailLevel === 'basic');
    
    this.log(
      `정리된 리소스: ${stats.meshCount} 메시, ${stats.materialCount} 재질, ` +
      `${stats.geometryCount} 지오메트리, ${stats.textureCount} 텍스처`,
      'memory'
    );
    
    if (stats.textureMemory && stats.geometryMemory && stats.totalMemory) {
      this.log(
        `추정 메모리 해제: 텍스처: ${stats.textureMemory}, ` +
        `지오메트리: ${stats.geometryMemory}, ` +
        `총: ${stats.totalMemory}`,
        'memory'
      );
    }
    
    if (stats.resourceManager) {
      const { active, count, inactiveCount, disposedCount } = stats.resourceManager;
      
      this.log(
        `리소스 관리: ${active ? '활성화' : '비활성화'}, 관리 리소스 ${count}개` +
        (inactiveCount !== undefined ? `, 비활성 ${inactiveCount}개` : '') +
        (disposedCount !== undefined ? `, 정리됨 ${disposedCount}개` : ''),
        'resource'
      );
    }
    
    if (stats.duplicateTextures !== undefined && stats.rawTextureCount !== undefined) {
      const uniqueTextureCount = stats.rawTextureCount - stats.duplicateTextures;
      
      this.log(
        `텍스처 중복 정보: ${uniqueTextureCount}개 고유 (중복 ${stats.duplicateTextures}개 제외됨)`,
        'resource'
      );
    }
    
    this.groupEnd();
    this.emit('memoryCleanup', stats);
  }
}

/**
 * 로거 싱글톤 인스턴스
 */
export const logger = Logger.getInstance();

/**
 * 조건부 로그 출력 함수 (래퍼)
 */
export function conditionalLog(
  message: string,
  condition: boolean = isDev,
  level: LogLevel = 'info'
): void {
  logger.conditionalLog(message, condition, level);
}

/**
 * 개발 모드 로그 출력 함수 (래퍼)
 */
export function devLog(message: string, level: LogLevel = 'info'): void {
  logger.devLog(message, level);
}

/**
 * 성공 로그 출력 함수 (래퍼)
 */
export function successLog(message: string, condition: boolean = isDev): void {
  logger.success(message, condition);
}

/**
 * 로그 그룹 시작 함수 (래퍼)
 */
export function startGroup(title: string, condition: boolean = isDev): void {
  logger.group(title, false, condition);
}

/**
 * 로그 그룹 종료 함수 (래퍼)
 */
export function endGroup(condition: boolean = isDev): void {
  logger.groupEnd(condition);
}

/**
 * 성능 측정 시작 함수 (래퍼)
 */
export function startPerformance(label: string, condition: boolean = isDev): void {
  logger.startPerformance(label, condition);
}

/**
 * 성능 측정 종료 함수 (래퍼)
 */
export function endPerformance(label: string, condition: boolean = isDev): void {
  logger.endPerformance(label, condition);
} 