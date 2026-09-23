import type { Backend } from './types';
import { OfflineBackend } from './offline';
import { SupabaseBackend } from './supabase';

// Runtime configuration lives in play/config.js (no rebuild needed to go online).
export interface RuntimeConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  pgliteUrl?: string;
}

declare global {
  interface Window {
    STT_CONFIG?: RuntimeConfig;
  }
}

export const PGLITE_VERSION = '0.5.8';

export function config(): Required<RuntimeConfig> {
  const c = window.STT_CONFIG || {};
  return {
    supabaseUrl: (c.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '').trim(),
    supabaseAnonKey: (c.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    pgliteUrl: (c.pgliteUrl || `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/dist/index.js`).trim(),
  };
}

export function onlineAvailable(): boolean {
  const c = config();
  return !!(c.supabaseUrl && c.supabaseAnonKey);
}

export function createBackend(mode: 'offline' | 'online'): Backend {
  const c = config();
  if (mode === 'online') {
    if (!onlineAvailable()) throw new Error('Online servers are not configured.');
    return new SupabaseBackend(c.supabaseUrl, c.supabaseAnonKey);
  }
  return new OfflineBackend(c.pgliteUrl);
}
