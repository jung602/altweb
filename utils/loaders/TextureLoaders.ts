/**
 * 텍스처 로더 유틸리티
 * 텍스처 로더에 대한 싱글톤 인스턴스와 최적화 기능을 제공합니다.
 */

import * as THREE from 'three';
import { KTX2Loader } from 'three-stdlib';
import { devLog } from '../logger';

/**
 * KTX2Loader 싱글톤 관리를 위한 클래스
 */
export class TextureLoaderManager {
  private static instance: TextureLoaderManager | null = null;
  private ktx2Loader: KTX2Loader | null = null;
  private initialized = false;
  private loggedThisSession = false;
  private isDev = process.env.NODE_ENV === 'development';

  private constructor() {
    // 싱글톤 패턴
  }

  /**
   * TextureLoaderManager의 싱글톤 인스턴스를 반환합니다.
   */
  public static getInstance(): TextureLoaderManager {
    if (!TextureLoaderManager.instance) {
      TextureLoaderManager.instance = new TextureLoaderManager();
    }
    return TextureLoaderManager.instance;
  }

  /**
   * KTX2Loader 인스턴스를 초기화하고 반환합니다.
   * @param renderer Three.js WebGLRenderer 인스턴스
   * @returns KTX2Loader 인스턴스
   */
  public initializeKTX2Loader(renderer: THREE.WebGLRenderer): KTX2Loader {
    if (!this.ktx2Loader) {
      if (this.isDev) devLog('KTX2Loader 싱글톤 인스턴스 생성', 'info');
      
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/basis/');
      ktx2Loader.detectSupport(renderer);
      
      this.ktx2Loader = ktx2Loader;
      this.initialized = true;
      this.loggedThisSession = true;
      
      return ktx2Loader;
    } else {
      // 이미 초기화된 경우, 중복 로그 방지
      if (!this.loggedThisSession && this.isDev) {
        devLog('KTX2Loader 싱글톤 인스턴스 재사용', 'debug');
        this.loggedThisSession = true;
      }
      
      return this.ktx2Loader;
    }
  }

  /**
   * 현재 기기에 최적화된 텍스처 압축 포맷을 결정합니다.
   * @param renderer Three.js WebGLRenderer 인스턴스
   * @returns 최적의 텍스처 압축 포맷 이름
   */
  public getOptimalTextureFormat(renderer: THREE.WebGLRenderer): string {
    const capabilities = renderer.capabilities;
    const extensions = renderer.extensions;
    
    // macOS (Apple Silicon)
    if (navigator.platform.includes('Mac') && /arm/i.test(navigator.userAgent)) {
      if (extensions.get('WEBGL_compressed_texture_astc')) {
        return 'ASTC';
      }
    }
    
    // Windows/Linux
    if (extensions.get('WEBGL_compressed_texture_s3tc')) {
      return 'S3TC';
    }
    
    // Android
    if (extensions.get('WEBGL_compressed_texture_etc')) {
      return 'ETC2';
    }
    
    // iOS
    if (extensions.get('WEBGL_compressed_texture_pvrtc')) {
      return 'PVRTC';
    }
    
    // 기본값으로 KTX2 반환 (압축되지 않은 텍스처로 폴백)
    return 'KTX2';
  }

  /**
   * 콘솔 로그 상태를 리셋합니다.
   */
  public resetLogState(): void {
    this.loggedThisSession = false;
  }

  /**
   * 압축 텍스처 지원 여부를 확인합니다.
   * @param renderer Three.js WebGLRenderer 인스턴스
   * @returns 압축 텍스처 지원 여부
   */
  public isCompressedTexturesSupported(renderer: THREE.WebGLRenderer): boolean {
    const capabilities = renderer.capabilities;
    const extensions = renderer.extensions;
    
    return capabilities.isWebGL2 && (
      extensions.get('WEBGL_compressed_texture_astc') || 
      extensions.get('WEBGL_compressed_texture_etc') || 
      extensions.get('WEBGL_compressed_texture_etc1') ||
      extensions.get('WEBGL_compressed_texture_s3tc') ||
      extensions.get('WEBGL_compressed_texture_pvrtc')
    );
  }

  /**
   * KTX2 로더가 초기화되었는지 확인합니다.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
} 