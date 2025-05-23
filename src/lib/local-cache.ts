/**
 * Simple client-side cache utility for storing and retrieving data with expiration
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// Mock storage for server-side rendering
class MemoryStorage implements Storage {
  private items: Record<string, string> = {};
  readonly length: number = 0;
  
  clear(): void {
    this.items = {};
  }
  
  getItem(key: string): string | null {
    return this.items[key] || null;
  }
  
  key(index: number): string | null {
    return Object.keys(this.items)[index] || null;
  }
  
  removeItem(key: string): void {
    delete this.items[key];
  }
  
  setItem(key: string, value: string): void {
    this.items[key] = value;
  }
}

class LocalCache {
  private storage: Storage;
  
  constructor(useSessionStorage = false) {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    // Use memory storage for server-side rendering
    if (!isBrowser) {
      this.storage = new MemoryStorage();
    } else {
      // Use session storage if specified, otherwise use local storage
      this.storage = useSessionStorage ? sessionStorage : localStorage;
    }
  }
  
  /**
   * Store data in the cache with an expiration time
   * 
   * @param key The cache key
   * @param data The data to store
   * @param expiryInSeconds Expiration time in seconds (default: 1 hour)
   */
  set<T>(key: string, data: T, expiryInSeconds = 3600): void {
    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + (expiryInSeconds * 1000)
    };
    
    try {
      this.storage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to store data in cache:', error);
    }
  }
  
  /**
   * Retrieve data from the cache
   * 
   * @param key The cache key
   * @returns The cached data or null if expired or not found
   */
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;
      
      const entry = JSON.parse(item) as CacheEntry<T>;
      
      // Check if entry has expired
      if (Date.now() > entry.expiry) {
        this.storage.removeItem(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Failed to retrieve data from cache:', error);
      return null;
    }
  }
  
  /**
   * Remove data from the cache
   * 
   * @param key The cache key
   */
  remove(key: string): void {
    this.storage.removeItem(key);
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.storage.clear();
  }
}

// Create a default instance that uses localStorage
export const localCache = new LocalCache();

// Create a session-specific instance that uses sessionStorage
export const sessionCache = new LocalCache(true);
