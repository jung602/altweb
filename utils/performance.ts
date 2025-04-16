/**
 * 성능 최적화 유틸리티
 * 현재 환경 및 기기 성능에 맞게 최적화 설정을 적용합니다.
 */

import * as THREE from 'three';
import { getPerformanceMode, getModelQuality, isDebugMode } from '../config/environment';
import { logger } from './logger';

/**
 * 기기 정보 인터페이스
 */
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  devicePixelRatio: number;
  cpuCores: number;
  gpuTier: 'low' | 'medium' | 'high' | 'unknown';
  memoryGB: number | null;
}

/**
 * 성능 모드 타입
 */
export type PerformanceMode = 'high-performance' | 'balanced' | 'power-saving';

/**
 * 성능 통계 클래스
 * Three.js 렌더러의 성능을 모니터링합니다.
 */
export class PerformanceStats {
  private renderer: THREE.WebGLRenderer | null = null;
  private active: boolean = false;
  private frameCount: number = 0;
  private startTime: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private renderStartTime: number = 0;
  private renderEndTime: number = 0;
  private renderTime: number = 0;
  private memoryInfo: any = null;
  private onUpdateCallback: ((stats: any) => void) | null = null;
  
  /**
   * 성능 모니터 초기화
   * @param renderer - Three.js 렌더러
   */
  public initialize(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.active = false;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFpsUpdate = this.startTime;
    this.currentFps = 0;
    this.renderTime = 0;
    
    // 메모리 정보 초기화
    if ('performance' in window && 'memory' in (performance as any)) {
      this.memoryInfo = (performance as any).memory;
    }
  }
  
  /**
   * 성능 모니터링 활성화
   */
  public activate(): void {
    this.active = true;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFpsUpdate = this.startTime;
    logger.log('성능 모니터링 활성화됨', 'debug');
  }
  
  /**
   * 성능 모니터링 비활성화
   */
  public deactivate(): void {
    this.active = false;
    logger.log('성능 모니터링 비활성화됨', 'debug');
  }
  
  /**
   * 렌더링 시작 전 호출
   */
  public beforeRender(): void {
    if (!this.active) return;
    this.renderStartTime = performance.now();
  }
  
  /**
   * 렌더링 후 호출
   */
  public afterRender(): void {
    if (!this.active) return;
    this.renderEndTime = performance.now();
    this.renderTime = this.renderEndTime - this.renderStartTime;
  }
  
  /**
   * 모니터링 업데이트
   */
  public update(): void {
    if (!this.active) return;
    
    const now = performance.now();
    this.frameCount++;
    
    // 1초마다 FPS 업데이트
    if (now >= this.lastFpsUpdate + 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // 콜백이 등록되어 있으면 호출
      if (this.onUpdateCallback) {
        this.onUpdateCallback(this.getStats());
      }
    }
  }
  
  /**
   * 현재 성능 통계 가져오기
   */
  public getStats(): any {
    return {
      fps: this.currentFps,
      renderTime: this.renderTime,
      memory: this.memoryInfo ? {
        usedJSHeapSize: this.memoryInfo.usedJSHeapSize,
        jsHeapSizeLimit: this.memoryInfo.jsHeapSizeLimit,
        totalJSHeapSize: this.memoryInfo.totalJSHeapSize
      } : null
    };
  }
  
  /**
   * 활성화 상태 확인
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * 업데이트 콜백 설정
   */
  public setUpdateCallback(callback: (stats: any) => void): void {
    this.onUpdateCallback = callback;
  }
  
  /**
   * 정리
   */
  public dispose(): void {
    this.active = false;
    this.renderer = null;
    this.onUpdateCallback = null;
  }
}

/** 
 * 디바이스 정보를 수집하고 분석하는 유틸리티
 */
export class DeviceProfiler {
  private static instance: DeviceProfiler;
  private _deviceInfo: DeviceInfo;
  private _perfMode: PerformanceMode;
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): DeviceProfiler {
    if (!DeviceProfiler.instance) {
      DeviceProfiler.instance = new DeviceProfiler();
    }
    return DeviceProfiler.instance;
  }

  /**
   * 생성자
   */
  private constructor() {
    this._deviceInfo = this.detectDeviceInfo();
    this._perfMode = this.determinePerformanceMode();
  }
  
  /**
   * 기기 정보 감지
   */
  private detectDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    const isDesktop = !isMobile && !isTablet;
    
    // 브라우저 정보
    let browser = 'unknown';
    let browserVersion = 'unknown';
    
    if (ua.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    }
    
    // OS 정보
    let os = 'unknown';
    let osVersion = 'unknown';
    
    if (ua.indexOf('Windows') > -1) {
      os = 'Windows';
      const match = ua.match(/Windows NT (\d+\.\d+)/);
      if (match) osVersion = match[1];
    } else if (ua.indexOf('Mac OS X') > -1) {
      os = 'macOS';
      const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.indexOf('Android') > -1) {
      os = 'Android';
      const match = ua.match(/Android (\d+\.\d+)/);
      if (match) osVersion = match[1];
    } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
      os = 'iOS';
      const match = ua.match(/OS (\d+_\d+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    }
    
    // CPU 코어 수
    const cpuCores = navigator.hardwareConcurrency || 2;
    
    // 메모리
    let memoryGB = null;
    if ('deviceMemory' in navigator) {
      memoryGB = (navigator as any).deviceMemory;
    }
    
    // GPU 티어 추정
    let gpuTier: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
    if (isDesktop && cpuCores >= 8 && window.devicePixelRatio >= 2) {
      gpuTier = 'high';
    } else if (isDesktop && cpuCores >= 4) {
      gpuTier = 'medium';
    } else if (isDesktop) {
      gpuTier = 'low';
    } else if (isTablet && window.devicePixelRatio >= 2) {
      gpuTier = 'medium';
    } else {
      gpuTier = 'low';
    }
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      browser,
      browserVersion,
      os,
      osVersion,
      devicePixelRatio: window.devicePixelRatio,
      cpuCores,
      gpuTier,
      memoryGB
    };
  }
  
  /**
   * 성능 모드 결정
   */
  private determinePerformanceMode(): PerformanceMode {
    // 환경 변수에서 지정한 모드가 있으면 우선 적용
    const configMode = getPerformanceMode();
    if (configMode) return configMode;
    
    // 기기 특성에 따라 자동 결정
    const { isMobile, isTablet, cpuCores, gpuTier } = this._deviceInfo;
    
    if (isMobile || gpuTier === 'low') {
      return 'power-saving';
    } else if (isTablet || gpuTier === 'medium' || cpuCores <= 4) {
      return 'balanced';
    } else {
      return 'high-performance';
    }
  }
  
  /**
   * 현재 성능 모드 가져오기
   */
  public getPerformanceMode(): PerformanceMode {
    return this._perfMode;
  }
  
  /**
   * 기기 정보 가져오기
   */
  public getDeviceInfo(): DeviceInfo {
    return this._deviceInfo;
  }
  
  /**
   * 모델 품질 결정
   */
  public determineModelQuality(): 'low' | 'medium' | 'high' {
    // 설정에서 명시적으로 모델 품질을 지정한 경우 우선 적용
    const configQuality = getModelQuality();
    if (configQuality) return configQuality;
    
    // 성능 모드에 따라 자동 결정
    switch (this._perfMode) {
      case 'high-performance':
        return 'high';
      case 'balanced':
        return 'medium';
      case 'power-saving':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// 싱글톤 인스턴스 생성
export const deviceProfiler = DeviceProfiler.getInstance();

// 성능 통계 싱글톤 인스턴스
export const performanceStats = new PerformanceStats();

/**
 * 현재 성능 모드 가져오기
 */
export function getCurrentPerformanceMode(): PerformanceMode {
  return deviceProfiler.getPerformanceMode();
}

/**
 * 모델 품질 설정 가져오기
 */
export function getModelQualitySetting(): 'low' | 'medium' | 'high' {
  return deviceProfiler.determineModelQuality();
} 