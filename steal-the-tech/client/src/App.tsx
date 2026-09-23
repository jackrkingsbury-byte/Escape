import { Component, useEffect, useRef, type ReactNode } from 'react';
import { useGame } from './game/store';
import { WorldEngine, setEngine } from './world/engine';
import { useWorldUI } from './world/ui';
import { Title, Loading, ErrorScreen, Auth, Join } from './screens/Screens';
import { Hud, NavBar, Ticker, Toasts, ZonePrompt, HoverTip, ItemPopover, Joystick, EmoteBar, CarryHud } from './ui/hud';
import { DropOverlay, StealOverlay, RaidAlarm, BigReveal, LevelUp, ConfirmDialog, Tutorial, Banner } from './ui/overlays';
import { BasePanel } from './ui/panels/BasePanel';
import { DropsPanel, CollectionPanel } from './ui/panels/DropsPanel';
import { MarketPanel } from './ui/panels/MarketPanel';
import { RaidPanel, VisitPanel } from './ui/panels/RaidPanel';
import { TradePanel } from './ui/panels/TradePanel';
import { LeaderboardPanel, ProfilePanel } from './ui/panels/SocialPanels';
import { QuestsPanel, EventPanel, FeedPanel, SettingsPanel } from './ui/panels/MiscPanels';
import { openPanel } from './game/store';

function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const e = new WorldEngine(ref.current!, over.current!);
    setEngine(e);
    (window as any).__stt_engine = e;
    (window as any).__stt_state = () => useGame.getState();
    (window as any).__stt_store = useGame; // client-side view state only (tests/devtools); grants nothing on the server
    return () => {
      e.destroy();
      setEngine(null);
    };
  }, []);
  const fade = useWorldUI((s) => s.fade);
  return (
    <>
      <canvas ref={ref} className="world-canvas" data-testid="world" />
      <div ref={over} className="world-overlay" />
      <div className="fade" style={{ opacity: fade }} />
    </>
  );
}

// A glitch in one panel must never take the whole game down.
class Guard extends Component<{ children: ReactNode; name: string }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { err: String(e?.message || e) };
  }
  componentDidCatch(e: Error) {
    console.error('[' + this.props.name + ']', e);
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="panel-wrap">
        <div className="panel">
          <div className="panel-body center">
            <div style={{ fontSize: 40 }}>🛠️</div>
            <b>This screen hit a glitch.</b>
            <div className="muted">{this.state.err}</div>
            <button className="btn primary" onClick={() => { this.setState({ err: null }); openPanel(null); }}>CLOSE</button>
          </div>
        </div>
      </div>
    );
  }
}

function PanelHost() {
  const panel = useGame((s) => s.panel);
  switch (panel) {
    case 'base': return <BasePanel />;
    case 'drops': return <DropsPanel />;
    case 'collection': return <CollectionPanel />;
    case 'market': return <MarketPanel />;
    case 'raid': return <RaidPanel />;
    case 'visit': return <VisitPanel />;
    case 'trade': return <TradePanel />;
    case 'leaderboard': return <LeaderboardPanel />;
    case 'profile': return <ProfilePanel />;
    case 'quests': return <QuestsPanel />;
    case 'event': return <EventPanel />;
    case 'feed': return <FeedPanel />;
    case 'settings': return <SettingsPanel />;
    default: return null;
  }
}

function Game() {
  const reduce = useGame((s) => s.settings.reduceMotion);
  const tut = useGame((s) => s.tutorialOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.key === 'Escape') {
        if (useWorldUI.getState().selected) useWorldUI.setState({ selected: null });
        else openPanel(null);
      }
      const map: Record<string, any> = { b: 'base', o: 'drops', c: 'collection', m: 'market', r: 'raid', t: 'trade', l: 'leaderboard', p: 'profile', q: 'quests' };
      if (!e.ctrlKey && !e.metaKey && !e.altKey && map[e.key.toLowerCase()] && !['w', 'a', 's', 'd', 'e'].includes(e.key.toLowerCase())) {
        const cur = useGame.getState().panel;
        openPanel(cur === map[e.key.toLowerCase()] ? null : map[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className={'game' + (reduce ? ' reduce-motion' : '') + (tut ? ' tut-open' : '')}>
      <World />
      <Hud />
      <Ticker />
      <ZonePrompt />
      <CarryHud />
      <HoverTip />
      <ItemPopover />
      <Joystick />
      <EmoteBar />
      <NavBar />
      <Guard name="panel"><PanelHost /></Guard>
      <Guard name="overlays">
        <Banner />
        <RaidAlarm />
        <StealOverlay />
        <Tutorial />
        <Toasts />
        <DropOverlay />
        <LevelUp />
        <BigReveal />
        <ConfirmDialog />
      </Guard>
    </div>
  );
}

export default function App() {
  const phase = useGame((s) => s.phase);
  switch (phase) {
    case 'title': return <Title />;
    case 'loading': return <Loading />;
    case 'auth': return <Auth />;
    case 'join': return <Join />;
    case 'error': return <ErrorScreen />;
    case 'playing': return <Game />;
  }
}
