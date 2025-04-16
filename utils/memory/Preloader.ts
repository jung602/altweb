/**
 * 모델 프리로딩 관리자
 * 모델의 로딩 상태 및 캐시를 관리합니다.
 */

import { ModelComponentType } from '../../types/model';
import { logger } from '../logger';
import { isModelLoaded as checkModelLoaded, preloadModels, clearModelCache } from './ModelLoader';
import { MODEL_PRELOAD_MAP } from '../../config/model';
import { PerformanceMode, getCurrentPerformanceMode } from '../performance';

/**
 * 프리로더 클래스
 * 모델 프리로딩을 관리하는 싱글톤 클래스
 */
export class Preloader {
  private static instance: Preloader;
  private preloadQueue: ModelComponentType[] = [];
  private isProcessing: boolean = false;
  private preloadIntervalId: number | null = null;

  // 싱글톤 패턴
  private constructor() {
    // 프라이빗 생성자
  }

  /**
   * 프리로더 인스턴스를 반환합니다.
   */
  public static getInstance(): Preloader {
    if (!Preloader.instance) {
      Preloader.instance = new Preloader();
    }
    return Preloader.instance;
  }

  /**
   * 특정 모델이 로드되었는지 확인합니다.
   * @param component 확인할 모델 컴포넌트
   * @returns 로드 여부
   */
  public isModelLoaded(component: ModelComponentType): boolean {
    return checkModelLoaded(component);
  }

  /**
   * 캐시를 초기화합니다.
   * @param keepComponents 유지할 컴포넌트 목록 (선택 사항)
   */
  public clearCache(keepComponents?: ModelComponentType[]): void {
    if (keepComponents && keepComponents.length > 0) {
      // 유지할 컴포넌트를 제외한 모든 컴포넌트 캐시 삭제
      Object.keys(MODEL_PRELOAD_MAP)
        .filter(key => !keepComponents.includes(key as ModelComponentType))
        .forEach(key => {
          clearModelCache(key as ModelComponentType);
        });
      
      logger.log(`캐시 초기화 (${keepComponents.length}개 컴포넌트 유지)`, 'resource');
    } else {
      // 모든 캐시 삭제
      clearModelCache();
      logger.log('모든 캐시 초기화', 'resource');
    }

    // 프리로드 대기열 초기화
    this.resetPreloadQueue();
  }

  /**
   * 프리로드 대기열을 초기화합니다.
   */
  private resetPreloadQueue(): void {
    this.preloadQueue = [];
    this.isProcessing = false;
    
    // 기존 인터벌 정리
    if (this.preloadIntervalId !== null) {
      window.clearInterval(this.preloadIntervalId);
      this.preloadIntervalId = null;
    }
  }

  /**
   * 모델을 프리로드 대기열에 추가합니다.
   * @param components 프리로드할 모델 컴포넌트 목록 또는 단일 컴포넌트
   * @param immediate 즉시 처리 여부 (기본값: false)
   */
  public enqueueModels(
    components: ModelComponentType | ModelComponentType[], 
    immediate: boolean = false
  ): void {
    const componentArray = Array.isArray(components) ? components : [components];
    
    // 이미 로드된 모델 제외
    const unloadedComponents = componentArray.filter(
      comp => !this.isModelLoaded(comp)
    );
    
    // 대기열에 없는 컴포넌트만 추가
    const newComponents = unloadedComponents.filter(
      comp => !this.preloadQueue.includes(comp)
    );
    
    if (newComponents.length === 0) {
      return;
    }
    
    this.preloadQueue.push(...newComponents);
    logger.log(`프리로드 대기열에 ${newComponents.length}개 모델 추가`, 'resource');
    
    if (immediate) {
      this.processPreloadQueue();
    } else if (!this.isProcessing && this.preloadIntervalId === null) {
      // 아직 처리 중이 아니고 인터벌이 설정되지 않은 경우에만 간격 설정
      this.startPreloadInterval();
    }
  }

  /**
   * 프리로드 간격을 시작합니다.
   */
  private startPreloadInterval(): void {
    // 퍼포먼스 모드에 따른 간격 조정
    const performanceMode = getCurrentPerformanceMode();
    let interval = 2000; // 기본 간격: 2초
    
    if (performanceMode === 'high-performance') {
      interval = 1000; // 고성능 모드: 1초
    } else if (performanceMode === 'power-saving') {
      interval = 3000; // 저성능 모드: 3초
    }
    
    this.preloadIntervalId = window.setInterval(
      () => this.processPreloadQueue(), 
      interval
    );
  }

  /**
   * 프리로드 대기열을 처리합니다.
   */
  public async processPreloadQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // 퍼포먼스 모드에 따라 동시에 처리할 모델 수 결정
      const performanceMode = getCurrentPerformanceMode();
      let batchSize = 1; // 기본값
      
      if (performanceMode === 'high-performance') {
        batchSize = 3; // 고성능 모드: 3개씩
      } else if (performanceMode === 'balanced') {
        batchSize = 2; // 중간 성능 모드: 2개씩
      } else if (performanceMode === 'power-saving') {
        batchSize = 1; // 저성능 모드: 1개씩
      }
      
      const batch = this.preloadQueue.splice(0, batchSize);
      
      if (batch.length > 0) {
        logger.log(`프리로드 배치 처리: ${batch.length}개 모델`, 'resource');
        await preloadModels(batch);
      }
    } catch (error) {
      logger.error(`프리로드 큐 처리 중 오류: ${error}`);
    } finally {
      this.isProcessing = false;
      
      // 대기열이 비었으면 인터벌 중지
      if (this.preloadQueue.length === 0 && this.preloadIntervalId !== null) {
        window.clearInterval(this.preloadIntervalId);
        this.preloadIntervalId = null;
        logger.log('프리로드 대기열 처리 완료', 'resource');
      }
    }
  }

  /**
   * 모든 모델을 즉시 프리로드합니다.
   * @param components 프리로드할 모델 컴포넌트 목록
   */
  public async preloadAllModels(components: ModelComponentType[]): Promise<void> {
    // 인터벌 중지
    if (this.preloadIntervalId !== null) {
      window.clearInterval(this.preloadIntervalId);
      this.preloadIntervalId = null;
    }
    
    // 이미 로드된 모델 제외
    const unloadedComponents = components.filter(
      comp => !this.isModelLoaded(comp)
    );
    
    if (unloadedComponents.length === 0) {
      logger.log('모든 모델이 이미 로드됨', 'resource');
      return;
    }
    
    logger.log(`${unloadedComponents.length}개 모델 일괄 프리로드 시작`, 'resource');
    
    // 대기열 초기화 및 전체 프리로드
    this.resetPreloadQueue();
    await preloadModels(unloadedComponents);
    
    logger.log('일괄 프리로드 완료', 'resource');
  }
}

// 싱글톤 인스턴스 생성 및 export
export const preloader = Preloader.getInstance();

/**
 * 캐시를 정리합니다.
 * @param keepComponents 유지할 모델 컴포넌트 목록 (지정하지 않으면 모두 삭제)
 */
export function clearModelCaches(keepComponents?: ModelComponentType[]): void {
  preloader.clearCache(keepComponents);
} 