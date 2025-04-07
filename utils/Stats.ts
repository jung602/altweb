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
  private active: boolean;
  private maxValue: number;
  private ignoreMaxed: boolean;
  private logLevel: string;
  private metrics: PerformanceMetrics;
  private lastTime: number;
  private frames: number;
  private renderQuery: WebGLQuery | null;
  private queryCreated: boolean;
  private context: WebGL2RenderingContext | null;
  private extension: any;
  private domElement: HTMLDivElement = document.createElement('div');

  constructor(options: StatsOptions = {}) {
    super();

    this.active = options.active || false;
    this.maxValue = options.maxValue || 40;
    this.ignoreMaxed = options.ignoreMaxed ?? true;
    this.logLevel = options.logLevel || 'basic';

    this.metrics = {
      fps: this.createPanelData(60),
      ms: this.createPanelData(200),
      memory: this.createPanelData(30),
      render: this.createPanelData(this.maxValue)
    };

    this.lastTime = performance.now();
    this.frames = 0;
    this.renderQuery = null;
    this.queryCreated = false;
    this.context = null;
    this.extension = null;

    this.createPanel();

    if (this.active) {
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

  private createPanel(): void {
    this.domElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      cursor: pointer;
      opacity: 0.9;
      z-index: 10000;
      background-color: #000;
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre;
      line-height: 1.5em;
    `;

    this.domElement.addEventListener('click', () => {
      this.active ? this.deactivate() : this.activate();
    });
  }

  public activate(): void {
    this.active = true;
    document.body.appendChild(this.domElement);
    this.emit('activated');
  }

  public deactivate(): void {
    this.active = false;
    if (this.domElement.parentNode) {
      document.body.removeChild(this.domElement);
    }
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
      this.context.beginQuery(this.extension.TIME_ELAPSED_EXT, this.renderQuery);
    }
  }

  public afterRender(): void {
    if (!this.active || !this.context || !this.extension || !this.queryCreated) return;

    this.context.endQuery(this.extension.TIME_ELAPSED_EXT);
  }

  public update(): void {
    if (!this.active) return;

    const time = performance.now();
    this.frames++;

    if (time >= this.lastTime + 1000) {
      const fps = (this.frames * 1000) / (time - this.lastTime);
      const ms = (time - this.lastTime) / this.frames;

      this.updateMetrics('fps', fps);
      this.updateMetrics('ms', ms);

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
    if (!this.active) return;

    const { fps, ms, memory, render } = this.metrics;
    
    this.domElement.textContent = `
FPS: ${fps.value.toFixed(1)} (${this.getMinMax(fps.history)})
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
    this.removeAllListeners();
    if (this.renderQuery && this.context) {
      this.context.deleteQuery(this.renderQuery);
    }
  }
} 