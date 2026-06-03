import { logger } from "../logger/logger.js";

interface CacheItem {
  value: string;
  expiresAt: number;
}

export class CacheService {
  private readonly prefix: string;
  private readonly defaultTtl: number;
  private readonly store: Map<string, CacheItem> = new Map();

  constructor(prefix = "cache", defaultTtl = 300) {
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async get<T>(k: string): Promise<T | null> {
    const fullKey = this.key(k);
    const item = this.store.get(fullKey);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(fullKey);
      return null;
    }

    try {
      const parsed: T = JSON.parse(item.value);
      return parsed;
    } catch {
      logger.warn({ key: k }, "Cache parse error");
      return null;
    }
  }

  async set<T>(k: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.key(k);
    const serialized = JSON.stringify(value);
    const expiresAt = Date.now() + (ttl ?? this.defaultTtl) * 1000;
    this.store.set(fullKey, { value: serialized, expiresAt });
  }

  async del(k: string): Promise<void> {
    const fullKey = this.key(k);
    this.store.delete(fullKey);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.key(pattern);
    const escaped = fullPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regexPattern = new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
    let count = 0;

    for (const key of this.store.keys()) {
      if (regexPattern.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.debug({ pattern, count }, "Cache invalidated");
    }
  }
}

export const cacheService = new CacheService();
