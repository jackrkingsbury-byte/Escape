import { useState } from 'react';
import { useGame, setG } from '../game/store';
import { boot, enter, join } from '../game/session';
import { onlineAvailable } from '../backend';
import { unlockAudio, play } from '../game/sound';

const LOOP = ['BUY OFF THE BELT', 'DISPLAY', 'COLLECT', 'LOCK', 'GRAB', 'RUN', 'STEAL', 'TRADE', 'SELL', 'UPGRADE', 'REPEAT'];

export function Title() {
  const online = onlineAvailable();
  const start = (mode: 'offline' | 'online') => {
    unlockAudio();
    play('open');
    boot(mode);
  };
  return (
    <div className="screen">
      <div className="logo">
        STEAL<br />THE TECH
        <small>TECH CITY</small>
      </div>
      <div className="tagline">Grab gadgets off the Tech Belt, stack cash on your podiums, lock your base — then sneak into everyone else's and RUN with their best stuff.</div>
      <div className="loop">{LOOP.map((l) => <span key={l}>{l}</span>)}</div>
      <div className="col" style={{ width: 'min(420px, 90vw)' }}>
        {online ? (
          <>
            <button className="btn primary big block" onClick={() => start('online')} data-testid="play-online">▶ PLAY ONLINE</button>
            <button className="btn big block" onClick={() => start('offline')} data-testid="play-offline">OFFLINE PRACTICE</button>
          </>
        ) : (
          <>
            <button className="btn primary big block" onClick={() => start('offline')} data-testid="play-offline">▶ PLAY</button>
            <div className="fineprint">
              This copy runs in <b>offline practice mode</b>: the full game server runs inside your browser and the other bases belong to NPC players. Connect a Supabase project (see README) to turn on real online multiplayer.
            </div>
          </>
        )}
      </div>
      <div className="fineprint">Fictional in-game currency only — no real money, no gambling, no cash-outs. Works on phone, tablet and desktop.</div>
    </div>
  );
}

export function Loading() {
  const msg = useGame((s) => s.loadingMsg);
  const pct = useGame((s) => s.loadingPct);
  return (
    <div className="screen">
      <div className="logo" style={{ fontSize: 'clamp(34px, 8vw, 64px)' }}>STEAL THE TECH</div>
      <div className="progress"><i style={{ width: pct + '%' }} /></div>
      <div className="muted" style={{ fontWeight: 800 }}>{msg}</div>
    </div>
  );
}

export function ErrorScreen() {
  const fatal = useGame((s) => s.fatal);
  return (
    <div className="screen">
      <div style={{ fontSize: 60 }}>⚠️</div>
      <h2 className="display">Something went wrong</h2>
      <div className="muted" style={{ maxWidth: 520, fontWeight: 700 }}>{fatal}</div>
      <div className="row">
        <button className="btn primary" onClick={() => location.reload()}>RELOAD</button>
        <button className="btn" onClick={() => setG({ phase: 'title', fatal: null })}>BACK</button>
      </div>
    </div>
  );
}

export function Auth() {
  const backend = useGame((s) => s.backend)!;
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await enter();
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="screen">
      <div className="logo" style={{ fontSize: 'clamp(34px, 8vw, 64px)' }}>STEAL THE TECH</div>
      <div className="card col" style={{ width: 'min(420px, 92vw)' }}>
        <button className="btn primary big block" disabled={busy} onClick={() => run(() => backend.signInGuest())} data-testid="guest">
          ▶ PLAY AS GUEST
        </button>
        <div className="muted" style={{ fontWeight: 700 }}>— or keep your account on every device —</div>
        <input className="field" placeholder="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" placeholder="password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn block big" disabled={busy || !email || pw.length < 6} onClick={() => run(() => backend.signInEmail!(email, pw, mode === 'up'))}>
          {mode === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
        <button className="btn ghost small" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>
        {err && <div className="bad-t" style={{ fontWeight: 800 }}>{err}</div>}
      </div>
    </div>
  );
}

export function Join() {
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await join(name.trim());
      play('levelup');
    } catch (e: any) {
      setErr(String(e.message || e).replace(/^.*?ERROR:\s*/i, ''));
      play('error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="screen">
      <div className="logo" style={{ fontSize: 'clamp(34px, 8vw, 64px)' }}>WELCOME TO TECH CITY</div>
      <div className="tagline">Pick a name. Everyone in the city will see it — on the leaderboards, on the raid board, and on the "ITEM STOLEN" alerts.</div>
      <div className="col" style={{ width: 'min(420px, 92vw)' }}>
        <input
          className="field"
          style={{ textAlign: 'center', fontSize: 24, minHeight: 60 }}
          maxLength={16}
          placeholder="YourName"
          value={name}
          data-testid="username"
          onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && name.length >= 3 && submit()}
          autoFocus
        />
        <button className="btn primary big block" disabled={busy || name.length < 3} onClick={submit} data-testid="join">MOVE IN</button>
        {err && <div className="bad-t" style={{ fontWeight: 800 }}>{err}</div>}
        <div className="fineprint">3–16 letters, numbers or _</div>
      </div>
    </div>
  );
}
