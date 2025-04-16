/**
 * 이벤트 콜백 함수 타입 정의
 * 이벤트 발생 시 호출되는 함수의 타입
 */
type EventCallback = (...args: any[]) => void;

/**
 * 이벤트 맵 인터페이스
 * 이벤트 이름을 키로, 콜백 함수 배열을 값으로 가지는 맵
 */
interface EventMap {
  [key: string]: EventCallback[];
}

/**
 * 이벤트 에미터 클래스
 * 커스텀 이벤트 시스템을 구현한 기본 클래스
 * 다른 클래스가 이벤트를 발생시키고 처리할 수 있도록 확장 가능
 */
export class EventEmitter {
  private events: EventMap = {};

  /**
   * 이벤트 리스너 등록
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  on(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * 한 번만 실행되는 이벤트 리스너 등록
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  once(eventName: string, callback: EventCallback): void {
    const onceCallback: EventCallback = (...args: any[]) => {
      this.off(eventName, onceCallback);
      callback.apply(this, args);
    };
    this.on(eventName, onceCallback);
  }

  /**
   * 이벤트 리스너 제거
   * @param eventName 이벤트 이름
   * @param callback 제거할 콜백 함수 (없으면 해당 이벤트의 모든 리스너 제거)
   */
  off(eventName: string, callback?: EventCallback): void {
    if (!callback) {
      delete this.events[eventName];
      return;
    }

    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
      if (this.events[eventName].length === 0) {
        delete this.events[eventName];
      }
    }
  }

  /**
   * 이벤트 발생
   * @param eventName 이벤트 이름
   * @param args 이벤트 데이터
   */
  emit(eventName: string, ...args: any[]): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback.apply(this, args);
        } catch (error) {
          console.error(`Error in event ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(): void {
    this.events = {};
  }
} 