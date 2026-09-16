"use client";

import axios, { AxiosRequestConfig } from "axios";
import { useEffect, useRef, useState, useCallback } from "react";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

type CacheOptions = {
  ttlMs?: number; // Time-to-live in milliseconds (default: 3 minutes)
  persistSession?: boolean; // Persist in sessionStorage for instant page navigations
  staleWhileRevalidate?: boolean; // Return stale cache immediately, revalidate in background
};

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes
const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const cacheListeners = new Map<string, Set<(data: any) => void>>();

/**
 * Generate a deterministic cache key from URL and query params
 */
export function buildCacheKey(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const sortedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, any>>((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {});
  return `${url}?${JSON.stringify(sortedParams)}`;
}

/**
 * Read from memory or sessionStorage cache
 */
function getFromCache<T>(key: string): { data: T; isStale: boolean } | null {
  const now = Date.now();

  // 1. Check in-memory cache
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    const isStale = now - memoryEntry.timestamp > memoryEntry.ttl;
    return { data: memoryEntry.data as T, isStale };
  }

  // 2. Check sessionStorage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = window.sessionStorage.getItem(`__gh_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        const isStale = now - parsed.timestamp > parsed.ttl;
        // Populate memory cache
        memoryCache.set(key, parsed);
        return { data: parsed.data, isStale };
      }
    } catch {
      // Ignore sessionStorage parsing or quota errors
    }
  }

  return null;
}

/**
 * Save to memory and sessionStorage cache
 */
function setInCache<T>(key: string, data: T, ttlMs: number, persistSession = false): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
  memoryCache.set(key, entry);

  if (persistSession && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(`__gh_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota errors
    }
  }

  // Notify active React hook subscribers
  const listeners = cacheListeners.get(key);
  if (listeners) {
    listeners.forEach((listener) => listener(data));
  }
}

/**
 * Invalidate cache for a specific key or prefix
 */
export function invalidateApiCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k?.startsWith("__gh_cache_")) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  // Invalidate matching memory keys
  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyOrPrefix)) {
      memoryCache.delete(k);
    }
  }

  // Invalidate matching sessionStorage keys
  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k?.startsWith(`__gh_cache_${keyOrPrefix}`)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  }
}

/**
 * Core cached GET fetcher with in-flight request deduplication and SWR support
 */
export async function cachedApiGet<T = any>(
  url: string,
  params?: Record<string, any>,
  options?: CacheOptions & AxiosRequestConfig,
): Promise<T> {
  const key = buildCacheKey(url, params);
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const persistSession = options?.persistSession ?? true;
  const staleWhileRevalidate = options?.staleWhileRevalidate ?? true;

  const cached = getFromCache<T>(key);

  // Return fresh cache directly
  if (cached && !cached.isStale) {
    return cached.data;
  }

  // If in-flight request already exists, reuse the exact same promise!
  if (inFlightRequests.has(key)) {
    if (cached && staleWhileRevalidate) {
      // If we have stale data, return it immediately while in-flight finishes
      return cached.data;
    }
    return inFlightRequests.get(key) as Promise<T>;
  }

  // Create new network request promise
  const requestPromise = (async () => {
    try {
      const response = await axios.get<T>(url, {
        params,
        ...options,
      });
      const data = response.data;
      setInCache(key, data, ttlMs, persistSession);
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);

  // If stale cache exists and SWR is enabled, return stale data immediately
  if (cached && staleWhileRevalidate) {
    return cached.data;
  }

  return requestPromise;
}

/**
 * React Hook for cached API calls with instant 0ms mount from cache + SWR
 */
export function useCachedApi<T = any>(
  url: string | null,
  params?: Record<string, any>,
  options?: CacheOptions,
) {
  const key = url ? buildCacheKey(url, params) : "";
  const initialCache = key ? getFromCache<T>(key) : null;

  const [data, setData] = useState<T | null>(initialCache ? initialCache.data : null);
  const [loading, setLoading] = useState<boolean>(!initialCache || initialCache.isStale);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);

  const executeFetch = useCallback(
    async (forceFresh = false) => {
      if (!url) return;
      if (forceFresh) {
        invalidateApiCache(key);
      }

      try {
        if (!data) setLoading(true);
        const result = await cachedApiGet<T>(url, params, options);
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error("Failed to fetch API"));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [url, key, params, options, data],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    // Subscribe to cache updates from other components
    if (!cacheListeners.has(key)) {
      cacheListeners.set(key, new Set());
    }
    const listener = (updatedData: T) => {
      if (mountedRef.current) {
        setData(updatedData);
        setLoading(false);
      }
    };
    cacheListeners.get(key)!.add(listener);

    executeFetch();

    return () => {
      mountedRef.current = false;
      const listeners = cacheListeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) cacheListeners.delete(key);
      }
    };
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch: () => executeFetch(true),
  };
}
