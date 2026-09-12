export type KvStore = {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  readVersion?(key: string): Promise<{ value: string | undefined; version: string }>;
  compareAndSet?(key: string, value: string, ttlSeconds: number, version: string): Promise<boolean>;
};
