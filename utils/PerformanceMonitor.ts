import * as THREE from 'three';
import { Stats as CustomStats } from './Stats';
import { logger } from './logger';

/**
 * 성능 모니터링을 위한 통합 관리 클래스
 */
export class PerformanceMonitor {
  private active: boolean;
  private customStats: CustomStats | null = null;
  private rafCallbackId: number | null = null;

  constructor(active: boolean = false) {
    this.active = active;
  }

  public initialize(gl: THREE.WebGLRenderer): void {
    if (!this.active) return;
    
    // 커스텀 Stats 초기화
    this.customStats = new CustomStats();
    
    // WebGL 컨텍스트 설정
    const context = gl.getContext();
    if (context instanceof WebGL2RenderingContext && this.customStats) {
      this.customStats.setRenderContext(context);
    }

    // 성능 이슈 감지 리스너 추가
    if (this.customStats) {
      this.customStats.on('metricUpdated', ({ type, value }) => {
        if (type === 'fps' && value < 30) {
          logger.warn(`낮은 FPS 감지: ${value.toFixed(1)}`);
        } else if (type === 'memory' && value > 80) {
          logger.warn(`높은 메모리 사용량: ${value.toFixed(1)}%`);
        }
      });
    }
  }

  public beforeRender(): void {
    if (!this.active || !this.customStats) return;
    this.customStats.beforeRender();
  }

  public afterRender(): void {
    if (!this.active || !this.customStats) return;
    this.customStats.afterRender();
  }

  public update(): void {
    if (!this.active) return;
    
    if (this.customStats) {
      this.customStats.update();
    }
  }

  public dispose(): void {
    if (this.customStats) {
      this.customStats.dispose();
      this.customStats = null;
    }
    
    if (this.rafCallbackId !== null) {
      cancelAnimationFrame(this.rafCallbackId);
      this.rafCallbackId = null;
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public getMetrics() {
    if (!this.customStats) return null;
    return this.customStats.getMetrics();
  }
} 