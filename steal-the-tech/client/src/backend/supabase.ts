import type { Backend, PeerState } from './types';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Online mode: Supabase Auth + Postgres RPCs + Realtime.
// The browser only ever calls public.stt_* functions; the server decides everything.
export class SupabaseBackend implements Backend {
  mode = 'online' as const;
  label = 'Online';
  private sb!: SupabaseClient;
  private uid: string | null = null;
  private guest = true;
  private mail: string | null = null;
  private feed: RealtimeChannel | null = null;
  private world: RealtimeChannel | null = null;
  private pushSubs = new Set<(row: { target_id: string | null; kind: string }) => void>();
  private peerMap = new Map<string, PeerState>();
  private lastSent = 0;

  constructor(private url: string, private anonKey: string) {}

  async init(onProgress?: (msg: string, pct: number) => void) {
    onProgress?.('Connecting to the Tech City servers…', 20);
    const { createClient } = await import('@supabase/supabase-js');
    this.sb = createClient(this.url, this.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'stt.supabase.auth' },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    const { data } = await this.sb.auth.getSession();
    this.applySession(data.session);
    this.sb.auth.onAuthStateChange((_e, session) => {
      const before = this.uid;
      this.applySession(session);
      if (before !== this.uid) this.subscribeFeed();
    });
    this.subscribeFeed();
    onProgress?.('Connected', 90);
  }

  private applySession(session: any) {
    this.uid = session?.user?.id ?? null;
    this.guest = !!session?.user?.is_anonymous;
    this.mail = session?.user?.email ?? null;
  }

  private subscribeFeed() {
    if (this.feed) this.sb.removeChannel(this.feed);
    this.feed = null;
    if (!this.uid) return;
    // RLS makes Realtime deliver only global rows and rows addressed to us.
    this.feed = this.sb
      .channel('stt-feed-' + this.uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'game', table: 'server_events' }, (payload) => {
        const row = (payload.new || {}) as { target_id: string | null; kind: string };
        for (const cb of this.pushSubs) cb(row);
      })
      .subscribe();
  }

  userId() {
    return this.uid;
  }
  isGuest() {
    return this.guest;
  }
  email() {
    return this.mail;
  }

  async signInGuest() {
    if (this.uid) return;
    const { error } = await this.sb.auth.signInAnonymously();
    if (error) {
      throw new Error(
        /anonymous/i.test(error.message)
          ? 'Guest play is disabled on this server — sign in with email instead.'
          : error.message,
      );
    }
  }

  async signInEmail(email: string, password: string, create: boolean) {
    const { error } = create
      ? await this.sb.auth.signUp({ email, password })
      : await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const { data } = await this.sb.auth.getSession();
    this.applySession(data.session);
    if (!this.uid) throw new Error('Check your inbox to confirm your email, then sign in.');
  }

  async upgradeGuest(email: string, password: string) {
    const { error } = await this.sb.auth.updateUser({ email, password });
    if (error) throw new Error(error.message);
  }

  async signOut() {
    this.presence.stop();
    await this.sb.auth.signOut();
    this.uid = null;
  }

  async rpc<T = any>(fn: string, p: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.sb.rpc(fn, { p });
    if (error) throw new Error(error.message);
    return data as T;
  }

  onPush(cb: (row: { target_id: string | null; kind: string }) => void) {
    this.pushSubs.add(cb);
    return () => this.pushSubs.delete(cb);
  }

  presence = {
    start: (me: Omit<PeerState, 't'>) => {
      if (this.world || !this.uid) return;
      this.world = this.sb.channel('stt-world', { config: { broadcast: { self: false } } });
      this.world
        .on('broadcast', { event: 'pos' }, ({ payload }) => {
          const p = payload as PeerState;
          if (!p?.id || p.id === this.uid) return;
          this.peerMap.set(p.id, { ...p, t: Date.now() });
        })
        .on('broadcast', { event: 'bye' }, ({ payload }) => {
          this.peerMap.delete((payload as { id: string }).id);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') this.presence.update(me);
        });
    },
    update: (me: Omit<PeerState, 't'>) => {
      if (!this.world) return;
      const now = Date.now();
      if (now - this.lastSent < 180) return;
      this.lastSent = now;
      this.world.send({ type: 'broadcast', event: 'pos', payload: { ...me, t: now } });
    },
    peers: () => {
      const now = Date.now();
      for (const [k, v] of this.peerMap) if (now - v.t > 8000) this.peerMap.delete(k);
      return [...this.peerMap.values()];
    },
    stop: () => {
      if (!this.world) return;
      this.world.send({ type: 'broadcast', event: 'bye', payload: { id: this.uid } });
      this.sb.removeChannel(this.world);
      this.world = null;
      this.peerMap.clear();
    },
  };
}
