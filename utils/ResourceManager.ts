import * as THREE from 'three';
import { EventEmitter } from './EventEmitter';
import { 
  disposeMesh, 
  disposeSceneResources
} from './memory/ResourceDisposal';
import { 
  disposeTexture, 
  disposeTexturesFromMaterial 
} from './memory/TextureUtils';
import { disposeGeometry } from './memory/GeometryUtils';
import { logger } from './logger';

interface ResourceItem {
  resource: THREE.Object3D | THREE.Material | THREE.Texture | THREE.BufferGeometry;
  type: 'scene' | 'material' | 'texture' | 'geometry';
  lastUsed: number;
  isDisposed: boolean;
}

interface ResourceManagerOptions {
  maxInactiveTime?: number;  // 리소스가 사용되지 않은 최대 시간 (ms)
  checkInterval?: number;    // 메모리 체크 간격 (ms)
  logLevel?: 'none' | 'basic' | 'detailed';
}

/**
 * 리소스 관리자 클래스
 * 씬, 머티리얼, 텍스처, 지오메트리와 같은 Three.js 리소스를 관리하고
 * 일정 시간 사용되지 않은 리소스를 자동으로 처분합니다.
 */
export class ResourceManager extends EventEmitter {
  private resources: Map<string, ResourceItem> = new Map();
  private options: Required<ResourceManagerOptions>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(options: ResourceManagerOptions = {}) {
    super();
    this.resources = new Map();
    this.options = {
      maxInactiveTime: options.maxInactiveTime || 5 * 60 * 1000, // 기본 5분
      checkInterval: options.checkInterval || 60 * 1000, // 기본 1분
      logLevel: options.logLevel || 'basic'
    };
    this.cleanupInterval = null;
    this.startCleanupInterval();
  }

  /**
   * 리소스 등록
   * @param id 리소스 식별자
   * @param resource 관리할 Three.js 리소스
   * @param type 리소스 유형
   */
  registerResource(
    id: string,
    resource: THREE.Object3D | THREE.Material | THREE.Texture | THREE.BufferGeometry,
    type: ResourceItem['type']
  ): void {
    this.resources.set(id, {
      resource,
      type,
      lastUsed: Date.now(),
      isDisposed: false
    });

    this.emit('resourceRegistered', { id, type });
  }

  /**
   * 리소스 사용 시간 업데이트
   * @param id 리소스 식별자
   */
  updateResourceUsage(id: string): void {
    const item = this.resources.get(id);
    if (item && !item.isDisposed) {
      item.lastUsed = Date.now();
    }
  }

  /**
   * 특정 리소스 해제
   * @param resource 처분할 리소스
   * @param type 리소스 유형
   */
  private disposeResource(resource: any, type: ResourceItem['type']): void {
    if (!resource) return;

    try {
      switch (type) {
        case 'scene':
          if (resource instanceof THREE.Scene || resource instanceof THREE.Group) {
            disposeSceneResources(resource, {
              logDisposal: this.options.logLevel !== 'none',
              logLevel: this.options.logLevel,
              resourceManager: this
            });
          }
          break;

        case 'geometry':
          if (resource instanceof THREE.BufferGeometry) {
            disposeGeometry(resource);
          }
          break;

        case 'material':
          if (resource instanceof THREE.Material) {
            disposeTexturesFromMaterial(resource);
            resource.dispose();
          }
          break;

        case 'texture':
          if (resource instanceof THREE.Texture) {
            disposeTexture(resource);
          }
          break;
      }
    } catch (error) {
      logger.error(`리소스 해제 중 오류 발생: ${error}`);
    }
  }

  /**
   * 사용하지 않는 리소스 정리
   */
  private cleanupUnusedResources(): void {
    const now = Date.now();
    let disposedCount = 0;

    for (const [id, item] of this.resources.entries()) {
      if (!item.isDisposed && (now - item.lastUsed > this.options.maxInactiveTime)) {
        this.disposeResource(item.resource, item.type);
        item.isDisposed = true;
        disposedCount++;
      }
    }

    if (disposedCount > 0 && this.options.logLevel !== 'none') {
      logger.log(`${disposedCount}개의 사용하지 않는 리소스 정리됨`, 'resource');
    }

    this.emit('cleanup', { disposedCount });
  }

  /**
   * 자동 정리 타이머 시작
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedResources();
    }, this.options.checkInterval);
  }

  /**
   * 수동 리소스 정리 실행
   */
  public cleanup(): void {
    this.cleanupUnusedResources();
  }

  /**
   * 모든 리소스 해제 및 관리자 정리
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 모든 리소스 해제
    this.resources.forEach((item) => {
      if (item && !item.isDisposed && item.resource) {
        this.disposeResource(item.resource, item.type);
        item.isDisposed = true;
      }
    });

    this.resources.clear();
    this.emit('disposed');
  }

  /**
   * 모든 리소스 강제 정리
   */
  public forceCleanup(): void {
    let disposedCount = 0;

    // 모든 리소스 해제
    this.resources.forEach((item, id) => {
      if (!item.isDisposed && item.resource) {
        this.disposeResource(item.resource, item.type);
        item.isDisposed = true;
        disposedCount++;
      }
    });

    if (disposedCount > 0 && this.options.logLevel !== 'none') {
      logger.log(`${disposedCount}개의 리소스 강제 정리됨`, 'resource');
    }

    // 정리 이벤트 발생
    this.emit('forceCleanup', { disposedCount });
  }

  /**
   * 특정 접두사로 시작하는 리소스 정리
   * @param prefix 정리할 리소스 ID 접두사
   * @returns 정리된 리소스 수
   */
  public disposeResources(prefix: string): number {
    let disposedCount = 0;

    for (const [id, item] of this.resources.entries()) {
      if (id.startsWith(prefix) && !item.isDisposed && item.resource) {
        this.disposeResource(item.resource, item.type);
        item.isDisposed = true;
        disposedCount++;
      }
    }

    if (disposedCount > 0 && this.options.logLevel !== 'none') {
      logger.log(`'${prefix}' 접두사를 가진 ${disposedCount}개의 리소스 정리됨`, 'resource');
    }

    return disposedCount;
  }
} 