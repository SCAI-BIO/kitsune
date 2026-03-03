export interface BaseCache {
  readonly timestamp: number;
}

export interface CacheItem<T> {
  readonly data: T;
  readonly timestamp: number;
}
