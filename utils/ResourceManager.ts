import * as THREE from 'three';
import { EventEmitter } from './EventEmitter';

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

type MaterialWithMaps = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;
type TextureWithDispose = THREE.Texture & { dispose: () => void };

export class ResourceManager extends EventEmitter {
  private resources: Map<string, ResourceItem> = new Map();
  private options: Required<ResourceManagerOptions>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(options: ResourceManagerOptions = {}) {
    super();
    this.resources = new Map();
    this.options = {
      maxInactiveTime: options.maxInactiveTime || 5 * 60 * 1000,
      checkInterval: options.checkInterval || 60 * 1000,
      logLevel: options.logLevel || 'basic'
    };
    this.cleanupInterval = null;
    this.startCleanupInterval();
  }

  /**
   * 리소스 등록
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
   */
  updateResourceUsage(id: string): void {
    const item = this.resources.get(id);
    if (item && !item.isDisposed) {
      item.lastUsed = Date.now();
    }
  }

  /**
   * 특정 리소스 해제
   */
  private disposeResource(resource: any, type: ResourceItem['type']): void {
    if (!resource) return;

    try {
      switch (type) {
        case 'scene':
          if (resource instanceof THREE.Scene || resource instanceof THREE.Group) {
            resource.traverse((object: THREE.Object3D) => {
              if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                  object.geometry.dispose();
                }
                if (object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach((material: THREE.Material) => {
                      this.disposeMaterial(material);
                    });
                  } else {
                    this.disposeMaterial(object.material);
                  }
                }
              }
            });
          }
          break;

        case 'geometry':
          if (resource instanceof THREE.BufferGeometry) {
            resource.dispose();
          }
          break;

        case 'material':
          if (resource instanceof THREE.Material) {
            this.disposeMaterial(resource);
          }
          break;

        case 'texture':
          if (resource instanceof THREE.Texture) {
            resource.dispose();
          }
          break;
      }
    } catch (error) {
      console.error(`리소스 해제 중 오류 발생: ${error}`);
    }
  }

  /**
   * Material의 모든 리소스 해제
   */
  private disposeMaterial(material: THREE.Material): void {
    // 구체적인 Material 타입으로 캐스팅
    const mat = material as MaterialWithMaps;
    
    // 기본 텍스처 맵
    if (mat.map) this.disposeTextureMap(mat.map);

    // PBR 관련 맵
    if ('metalnessMap' in mat) this.disposeTextureMap(mat.metalnessMap);
    if ('roughnessMap' in mat) this.disposeTextureMap(mat.roughnessMap);
    if ('normalMap' in mat) this.disposeTextureMap(mat.normalMap);
    if ('bumpMap' in mat) this.disposeTextureMap(mat.bumpMap);
    if ('displacementMap' in mat) this.disposeTextureMap(mat.displacementMap);
    if ('aoMap' in mat) this.disposeTextureMap(mat.aoMap);
    if ('emissiveMap' in mat) this.disposeTextureMap(mat.emissiveMap);
    if ('lightMap' in mat) this.disposeTextureMap(mat.lightMap);
    if ('alphaMap' in mat) this.disposeTextureMap(mat.alphaMap);
    if ('envMap' in mat) this.disposeTextureMap(mat.envMap);

    // 기타 맵
    if ('specularMap' in mat) this.disposeTextureMap(mat.specularMap);
    if ('gradientMap' in mat) this.disposeTextureMap(mat.gradientMap);

    material.dispose();
  }

  /**
   * 텍스처 맵 해제
   */
  private disposeTextureMap(map: unknown): void {
    if (map && typeof map === 'object' && 'dispose' in map) {
      (map as TextureWithDispose).dispose();
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
        disposedCount++;
      }
    }

    if (disposedCount > 0 && this.options.logLevel !== 'none') {
      console.log(`Cleaned up ${disposedCount} unused resources`);
    }

    this.emit('cleanup', { disposedCount });
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedResources();
    }, this.options.checkInterval);
  }

  public cleanup(): void {
    this.cleanupUnusedResources();
  }

  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.resources.forEach((item) => {
      if (item && item.resource) {
        this.disposeResource(item.resource, item.type);
      }
    });
    
    this.resources.clear();
    this.emit('disposed');
  }

  /**
   * 모든 리소스를 강제로 즉시 정리
   * 새로고침 시 메모리 누수 방지용
   */
  public forceCleanup(): void {
    // 모든 리소스 정리
    const disposedItems: string[] = [];

    this.resources.forEach((item, id) => {
      if (!item.isDisposed) {
        this.disposeResource(item.resource, item.type);
        item.isDisposed = true;
        disposedItems.push(id);
      }
    });
    
    // 정리된 항목 수 기록
    const disposedCount = disposedItems.length;
    
    if (disposedCount > 0) {
      if (this.options.logLevel !== 'none') {
        console.log(`강제 정리: ${disposedCount}개 리소스 해제됨`);
      }
      
      this.emit('cleanup', { disposedCount, isForced: true });
    }
    
    // Three.js 캐시 비우기 시도
    if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
      THREE.Cache.clear();
    }
  }

  // ... rest of existing code ...
} 