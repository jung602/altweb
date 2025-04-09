import * as THREE from 'three';
import { EventEmitter } from './EventEmitter';

interface StatsOptions {
  active?: boolean;
  maxValue?: number;
  ignoreMaxed?: boolean;
  logLevel?: 'none' | 'basic' | 'detailed';
}

interface PanelData {
  value: number;
  maxValue: number;
  history: number[];
  historySize: number;
}

interface PerformanceMetrics {
  fps: PanelData;
  ms: PanelData;
  memory: PanelData;
  render: PanelData;
}

export class Stats extends EventEmitter {
  private active: boolean = false;
  private maxValue: number = 1000;
  private ignoreMaxed: boolean = false;
  private logLevel: string = 'basic';
  private metrics: PerformanceMetrics = {
    fps: { value: 0, maxValue: 120, history: [], historySize: 30 },
    ms: { value: 0, maxValue: 1000, history: [], historySize: 30 },
    memory: { value: 0, maxValue: 100, history: [], historySize: 30 },
    render: { value: 0, maxValue: 1000, history: [], historySize: 30 }
  };
  private lastTime: number = performance.now();
  private frames: number = 0;
  private renderQuery: WebGLQuery | null = null;
  private queryCreated: boolean = false;
  private context: WebGL2RenderingContext | null = null;
  private extension: any | null = null;
  private domElement: HTMLElement | null = null;
  private lastRafTime: number = 0;
  private deltaHistory: number[] = [];
  private rafCallbackId: number | null = null;

  constructor() {
    super();
    
    // 개발 환경에서만 Stats를 활성화
    if (process.env.NODE_ENV === 'development') {
      this.domElement = document.createElement('div');
      this.domElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        pointer-events: none;
        white-space: pre;
      `;
      document.body.appendChild(this.domElement);
      this.activate();
    }
  }

  private createPanelData(maxValue: number): PanelData {
    return {
      value: 0,
      maxValue,
      history: [],
      historySize: 30
    };
  }

  public activate(): void {
    if (!this.domElement) return;
    this.active = true;
    this.startRAFMeasurement();
    this.emit('activated');
  }

  public deactivate(): void {
    if (!this.domElement) return;
    this.active = false;
    this.stopRAFMeasurement();
    this.emit('deactivated');
  }

  public setRenderContext(context: WebGL2RenderingContext): void {
    this.context = context;
    this.extension = this.context.getExtension('EXT_disjoint_timer_query_webgl2');

    if (!this.extension) {
      console.warn('EXT_disjoint_timer_query_webgl2 not supported');
      this.context = null;
    }
  }

  public beforeRender(): void {
    if (!this.active || !this.context || !this.extension) return;

    this.queryCreated = false;
    let queryResultAvailable = false;

    if (this.renderQuery) {
      queryResultAvailable = this.context.getQueryParameter(
        this.renderQuery,
        this.context.QUERY_RESULT_AVAILABLE
      );
      const disjoint = this.context.getParameter(this.extension.GPU_DISJOINT_EXT);

      if (queryResultAvailable && !disjoint) {
        const elapsedNanos = this.context.getQueryParameter(
          this.renderQuery,
          this.context.QUERY_RESULT
        );
        const panelValue = Math.min(elapsedNanos / 1000 / 1000, this.maxValue);

        if (!(panelValue === this.maxValue && this.ignoreMaxed)) {
          this.updateMetrics('render', panelValue);
        }
      }
    }

    if (queryResultAvailable || !this.renderQuery) {
      this.queryCreated = true;
      this.renderQuery = this.context.createQuery();
      if (this.renderQuery) {
        this.context.beginQuery(this.extension.TIME_ELAPSED_EXT, this.renderQuery);
      }
    }
  }

  public afterRender(): void {
    if (!this.active || !this.context || !this.extension || !this.queryCreated) return;

    if (this.renderQuery) {
      this.context.endQuery(this.extension.TIME_ELAPSED_EXT);
    }
  }

  private startRAFMeasurement(): void {
    if (this.rafCallbackId !== null) return;
    
    const rafCallback = (timestamp: number) => {
      if (this.lastRafTime > 0) {
        const delta = timestamp - this.lastRafTime;
        this.deltaHistory.push(delta);
        if (this.deltaHistory.length > 30) this.deltaHistory.shift();
        
        // 실시간 FPS 계산 (직전 프레임에서)
        const instantFps = 1000 / delta;
        
        // 평균 FPS 계산 (최근 30프레임)
        const avgDelta = this.deltaHistory.reduce((a, b) => a + b, 0) / this.deltaHistory.length;
        const avgFps = 1000 / avgDelta;
        
        // 더 안정적인 값을 위해 평균 FPS 사용
        this.updateMetrics('fps', Math.min(avgFps, this.maxValue));
        this.updateMetrics('ms', delta);
      }
      
      this.lastRafTime = timestamp;
      this.rafCallbackId = requestAnimationFrame(rafCallback);
    };
    
    this.rafCallbackId = requestAnimationFrame(rafCallback);
  }
  
  private stopRAFMeasurement(): void {
    if (this.rafCallbackId !== null) {
      cancelAnimationFrame(this.rafCallbackId);
      this.rafCallbackId = null;
    }
  }

  public update(): void {
    if (!this.active) return;

    const time = performance.now();
    this.frames++;

    if (time >= this.lastTime + 1000) {
      // 메모리 통계만 이 메서드에서 업데이트
      if (window.performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        this.updateMetrics('memory', memoryUsage * 100);
      }

      this.lastTime = time;
      this.frames = 0;

      this.updatePanel();
    }
  }

  private updateMetrics(type: keyof PerformanceMetrics, value: number): void {
    const metric = this.metrics[type];
    metric.value = value;
    metric.history.push(value);
    if (metric.history.length > metric.historySize) {
      metric.history.shift();
    }

    this.emit('metricUpdated', { type, value });
  }

  private updatePanel(): void {
    if (!this.active || !this.domElement) return;

    const { fps, ms, memory, render } = this.metrics;
    
    this.domElement.textContent = `
FPS: ${fps.value.toFixed(1)}/${fps.maxValue} (${this.getMinMax(fps.history)})
Frame Time: ${ms.value.toFixed(1)}ms (${this.getMinMax(ms.history)})
Memory: ${memory.value.toFixed(1)}% (${this.getMinMax(memory.history)})
Render Time: ${render.value.toFixed(1)}ms (${this.getMinMax(render.history)})
    `.trim();
  }

  private getMinMax(values: number[]): string {
    if (values.length === 0) return 'N/A';
    const min = Math.min(...values);
    const max = Math.max(...values);
    return `${min.toFixed(1)}-${max.toFixed(1)}`;
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  public dispose(): void {
    this.deactivate();
    this.stopRAFMeasurement();
    this.removeAllListeners();
    if (this.renderQuery && this.context) {
      this.context.deleteQuery(this.renderQuery);
    }
  }
} 