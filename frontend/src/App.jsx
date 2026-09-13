import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Shield, ShieldAlert, AlertTriangle, Monitor, Crosshair,
  BarChart3, Settings, Play, Camera, Bell, Clock, Eye,
  Radio, User, LogOut, Volume2, VolumeX, Compass, Car, FileText,
  RotateCcw, Sparkles, CheckCircle2, ChevronRight, X, Mic
} from 'lucide-react';

// Sub-components
import { CameraFeedGrid } from './components/LiveGrid/CameraFeedGrid';
import { VirtualFenceStudio } from './components/VirtualFence/VirtualFenceStudio';
import { TacticalMap } from './components/TacticalMap/TacticalMap';
import { ANPRHub } from './components/ANPR/ANPRHub';
import { IncidentCommander } from './components/IncidentCommand/IncidentCommander';
import { EvidenceVault } from './components/EvidenceVault/EvidenceVault';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { SettingsView } from './components/Settings/SettingsView';
import { VoiceTourModal } from './components/VoiceTourModal';

// Audio & Sound
import {
  playBeep, playWarningTone, playCriticalSiren,
  isAudioMuted, toggleAudioMute
} from './utils/audioAlert';
import { API_BASE } from './config/api';

const DEFAULT_CAMERAS = [
  { id: 'CAM-01', name: 'Border Patrol Alpha', status: 'ONLINE', type: 'PTZ IP Camera', location: 'Border Zone A - North Sector', zone: 'Sector 7', ip: '192.168.1.101', lat: 32.7285, lng: 74.8562 },
  { id: 'CAM-02', name: 'Checkpoint Bravo', status: 'ONLINE', type: 'Fixed IP Camera', location: 'Border Zone B - Entry Gate', zone: 'Sector 7', ip: '192.168.1.102', lat: 32.7262, lng: 74.8580 },
  { id: 'CAM-03', name: 'Gate ANPR Scanner', status: 'ONLINE', type: 'ANPR Camera', location: 'Main Gate - Vehicle Lane', zone: 'Gate Area', ip: '192.168.1.103', lat: 32.7245, lng: 74.8550 },
  { id: 'CAM-04', name: 'Restricted Zone Delta', status: 'ONLINE', type: 'Thermal IP Camera', location: 'Restricted Zone - Perimeter Fence', zone: 'Restricted Zone', ip: '192.168.1.104', lat: 32.7298, lng: 74.8595 },
];

const DEMO_FALLBACK_EVENTS = [
  { id: 'EVT-0010', event_type: 'Virtual Fence Intrusion', camera_id: 'CAM-04', risk_level: 'CRITICAL', confidence: 0.97, object_type: 'Person', timestamp: new Date().toISOString() },
  { id: 'EVT-0009', event_type: 'ANPR - Watchlist Hit', camera_id: 'CAM-03', risk_level: 'HIGH', confidence: 0.94, object_type: 'Vehicle (MH01AB1234)', timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: 'EVT-0008', event_type: 'Vehicle Speed Alert', camera_id: 'CAM-02', risk_level: 'MEDIUM', confidence: 0.88, object_type: 'Vehicle', timestamp: new Date(Date.now() - 180000).toISOString() },
  { id: 'EVT-0007', event_type: 'Night Movement Detected', camera_id: 'CAM-01', risk_level: 'MEDIUM', confidence: 0.89, object_type: 'Person', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 'EVT-0006', event_type: 'Person Detection', camera_id: 'CAM-01', risk_level: 'LOW', confidence: 0.96, object_type: 'Person', timestamp: new Date(Date.now() - 480000).toISOString() },
];

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'map', 'fence', 'anpr', 'incident', 'evidence', 'analytics', 'settings'
  const [demoRunning, setDemoRunning] = useState(false);
  const [cameras, setCameras] = useState(DEFAULT_CAMERAS);
  const [events, setEvents] = useState(DEMO_FALLBACK_EVENTS);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_events: 164, critical_alerts: 4, people_detected: 68, vehicles_detected: 34, anpr_scans: 38
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demoProgress, setDemoProgress] = useState([]);
  const [soundMuted, setSoundMuted] = useState(isAudioMuted());
  const [activeCriticalEvent, setActiveCriticalEvent] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [focusedCameraId, setFocusedCameraId] = useState(null);

  const prevEventsCount = useRef(0);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Polling data from FastAPI Backend
  const fetchData = useCallback(async () => {
    try {
      const [camRes, evtRes, alertRes, statRes] = await Promise.all([
        axios.get(`${API_BASE}/cameras`),
        axios.get(`${API_BASE}/events`),
        axios.get(`${API_BASE}/alerts`),
        axios.get(`${API_BASE}/analytics`),
      ]);

      if (camRes.data && camRes.data.length > 0) setCameras(camRes.data);
      if (evtRes.data && evtRes.data.length > 0) {
        setEvents(evtRes.data);
        // Play audio alert if new critical event arrived
        if (evtRes.data.length > prevEventsCount.current) {
          const latest = evtRes.data[0];
          if (latest.risk_level === 'CRITICAL') {
            setActiveCriticalEvent(latest);
            playCriticalSiren(2);
            showToast(`CRITICAL ALERT: ${latest.event_type} on ${latest.camera_id}`);
          } else if (latest.risk_level === 'HIGH') {
            playWarningTone();
            showToast(`HIGH ALERT: ${latest.event_type} on ${latest.camera_id}`);
          }
          prevEventsCount.current = evtRes.data.length;
        }
      }
      if (alertRes.data) setAlerts(alertRes.data);
      if (statRes.data) setAnalytics(statRes.data);
    } catch (e) {
      // Backend unavailable — graceful fallback to interactive demo state
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Start live progressive demo sequence
  const startDemo = async () => {
    playBeep(1200, 0.1);
    setDemoRunning(true);
    setDemoProgress([]);
    showToast('Tactical Demo Engine Sequence Initiated across 4 Border Nodes!');

    try {
      await axios.post(`${API_BASE}/start-demo`);
    } catch (e) {}

    // Drip progressive visual indicators
    setTimeout(() => {
      setDemoProgress(p => [...p, 'CAM-01']);
      showToast('CAM-01 (Alpha Patrol): Pedestrian Track Acquired');
      playBeep(880, 0.08);
    }, 2000);

    setTimeout(() => {
      setDemoProgress(p => [...p, 'CAM-02']);
      showToast('CAM-02 (Checkpoint Bravo): Vehicle Inbound Detected');
      playBeep(880, 0.08);
    }, 7000);

    setTimeout(() => {
      setDemoProgress(p => [...p, 'CAM-03']);
      showToast('CAM-03 (ANPR Optical): License Plate MH01AB1234 Captured');
      playWarningTone();
    }, 14000);

    setTimeout(() => {
      setDemoProgress(p => [...p, 'CAM-04']);
      const crit = {
        id: 'EVT-CRIT-99',
        event_type: 'Virtual Fence Intrusion (CRITICAL)',
        camera_id: 'CAM-04',
        risk_level: 'CRITICAL',
        confidence: 0.97,
        object_type: 'Person',
        timestamp: new Date().toISOString()
      };
      setActiveCriticalEvent(crit);
      playCriticalSiren(3);
      showToast('CRITICAL BREACH: Virtual Fence Crossed on Restricted Zone Delta!');
    }, 22000);
  };

  const handleResetDemo = async () => {
    try {
      await axios.post(`${API_BASE}/reset-demo`);
    } catch (e) {}
    setDemoRunning(false);
    setDemoProgress([]);
    setActiveCriticalEvent(null);
    prevEventsCount.current = 0;
    fetchData();
    showToast('Demo State and Database Reset to Default.');
  };

  const handleToggleSound = () => {
    const isNowMuted = toggleAudioMute();
    setSoundMuted(isNowMuted);
    if (!isNowMuted) playBeep(880, 0.1);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="h-screen bg-brand-dark text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      {/* ─── COMMAND HEADER ─── */}
      <header className="h-16 bg-brand-deeper/95 backdrop-blur-lg border-b border-brand-border/40 px-6 flex justify-between items-center z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20 border border-brand-accent/40 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <Shield className="text-brand-accent w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-success rounded-full border-2 border-brand-dark animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-[0.25em]">DRISHTIX</h1>
              <span className="bg-brand-accent/10 border border-brand-accent/30 text-brand-accent font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                v2.0 TACTICAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Intelligent Border Surveillance Platform • SIH 2026
            </p>
          </div>
        </div>

        {/* Center Live Telemetry */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-brand-accent" />
            <span className="font-bold text-white">
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })} IST
            </span>
          </div>

          <div className="w-px h-4 bg-brand-border/40" />

          <div className="flex items-center gap-2 text-brand-success">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-bold">4/4 NODES ONLINE</span>
          </div>

          <div className="w-px h-4 bg-brand-border/40" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400">EDGE AI:</span>
            <span className="text-brand-accent font-bold">YOLOv8 + ANPR</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundMuted ? 'Unmute Tactical Audio' : 'Mute Tactical Audio'}
            className={`p-2 rounded-lg border transition-all ${
              soundMuted ? 'bg-brand-dark text-slate-500 border-brand-border/30' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* AI Voice Tour Button */}
          <button
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-1.5 bg-brand-card hover:bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,212,255,0.15)]"
            title="Interactive AI Voice Guided Walkthrough"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse text-brand-accent" />
            <span>AI VOICE TOUR</span>
          </button>

          {/* Demo Start Button */}
          {!demoRunning ? (
            <button
              onClick={startDemo}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-accent/20 to-brand-accent2/20 hover:from-brand-accent/30 hover:to-brand-accent2/30 text-brand-accent border border-brand-accent/50 px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START DEMO</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 font-mono text-xs font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>DEMO ACTIVE</span>
              </div>
              <button
                onClick={handleResetDemo}
                title="Reset Demo State"
                className="p-2 rounded-lg bg-brand-dark border border-brand-border/30 text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-3 border-l border-brand-border/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-accent to-brand-accent2 flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Logout Command Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 bg-brand-card/95 border border-brand-accent/60 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-slide-in text-xs font-semibold text-white">
          <Sparkles className="w-4 h-4 text-brand-accent" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white pl-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── WORKSPACE LAYOUT ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR NAVIGATION ─── */}
        <aside className="w-60 bg-brand-deeper/80 backdrop-blur-md border-r border-brand-border/30 flex flex-col py-4 px-3 flex-shrink-0">
          <nav className="flex-1 space-y-1.5">
            <SidebarItem
              icon={<Monitor />}
              label="Live Surveillance"
              id="live"
              active={activeTab}
              onClick={setActiveTab}
            />
            <SidebarItem
              icon={<Compass />}
              label="Tactical Radar GIS"
              id="map"
              active={activeTab}
              onClick={setActiveTab}
            />
            <SidebarItem
              icon={<Crosshair />}
              label="Virtual Fence Studio"
              id="fence"
              active={activeTab}
              onClick={setActiveTab}
            />
            <SidebarItem
              icon={<Car />}
              label="ANPR Vehicle Hub"
              id="anpr"
              active={activeTab}
              onClick={setActiveTab}
            />
            <SidebarItem
              icon={<ShieldAlert />}
              label="Incident Dispatch"
              id="incident"
              active={activeTab}
              onClick={setActiveTab}
              badge={activeCriticalEvent ? 1 : alerts.length}
            />
            <SidebarItem
              icon={<FileText />}
              label="Evidence Vault"
              id="evidence"
              active={activeTab}
              onClick={setActiveTab}
            />
            <SidebarItem
              icon={<BarChart3 />}
              label="Threat Analytics"
              id="analytics"
              active={activeTab}
              onClick={setActiveTab}
            />

            <div className="my-3 border-t border-brand-border/30" />

            <SidebarItem
              icon={<Settings />}
              label="System Settings"
              id="settings"
              active={activeTab}
              onClick={setActiveTab}
            />
          </nav>

          {/* Sidebar Footer Badge */}
          <div className="mt-auto pt-3 border-t border-brand-border/30">
            <div className="glass-card p-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-brand-accent font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>BORDER SECURE</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Sector 7 Defense Grid
              </p>
            </div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ─── */}
        <main className="flex-1 overflow-y-auto p-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-brand-dark to-brand-dark">
          {/* Top Emergency HUD Banner if critical alert active */}
          {activeCriticalEvent && activeTab !== 'incident' && (
            <div className="mb-5 p-3 rounded-xl bg-red-600/30 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span className="text-xs font-bold text-white">
                  CRITICAL BREACH: {activeCriticalEvent.event_type} on {activeCriticalEvent.camera_id}
                </span>
              </div>
              <button
                onClick={() => { playBeep(); setActiveTab('incident'); }}
                className="px-3 py-1 rounded bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
              >
                Open Incident SOP →
              </button>
            </div>
          )}

          {activeTab === 'live' && (
            <CameraFeedGrid
              cameras={cameras}
              demoRunning={demoRunning}
              demoProgress={demoProgress}
              initialCameraId={focusedCameraId}
              onSelectCamera={camId => {
                setFocusedCameraId(camId);
                setActiveTab('live');
              }}
              onTriggerSiren={() => {
                playCriticalSiren(3);
                showToast('Sector Siren Triggered: Audio broadcast activated across border perimeter!');
              }}
            />
          )}

          {activeTab === 'map' && (
            <TacticalMap
              alerts={alerts}
              onSelectCamera={camId => {
                setFocusedCameraId(camId);
                setActiveTab('live');
              }}
            />
          )}

          {activeTab === 'fence' && (
            <VirtualFenceStudio cameras={cameras} />
          )}

          {activeTab === 'anpr' && (
            <ANPRHub />
          )}

          {activeTab === 'incident' && (
            <IncidentCommander
              criticalEvent={activeCriticalEvent}
              onDismissAlert={() => setActiveCriticalEvent(null)}
              onOpenEvidence={() => setActiveTab('evidence')}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceVault
              events={events}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      {/* Interactive AI Voice Tour & Video Guide Modal */}
      <VoiceTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

// ─── SIDEBAR ITEM COMPONENT ───
const SidebarItem = ({ icon, label, id, active, onClick, badge }) => (
  <button
    onClick={() => { playBeep(900, 0.04); onClick(id); }}
    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-bold ${
      active === id
        ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 shadow-[0_0_15px_rgba(0,212,255,0.15)]'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
    }`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon, { className: 'w-4 h-4 flex-shrink-0' })}
      <span>{label}</span>
    </div>
    {badge > 0 && (
      <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
        {badge}
      </span>
    )}
  </button>
);

// ─── LOGIN SCREEN ───
const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState('commander');
  const [pass, setPass] = useState('drishtix2026');

  const handleSubmit = (e) => {
    e.preventDefault();
    playBeep(1100, 0.1);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-accent/10 via-brand-dark to-brand-dark" />
      <div className="relative z-10 w-full max-w-md glass-card p-8 space-y-6 animate-fade-in border border-brand-border/40 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20 border border-brand-accent/40 shadow-[0_0_25px_rgba(0,212,255,0.3)]">
            <Shield className="w-8 h-8 text-brand-accent" />
          </div>
          <h2 className="text-2xl font-black tracking-[0.3em] text-white">DRISHTIX</h2>
          <p className="text-xs text-brand-accent/70 font-mono tracking-widest uppercase">
            Intelligent Border Surveillance Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Operator ID</label>
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border/40 rounded-lg px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-brand-accent"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold uppercase block mb-1">Passcode</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border/40 rounded-lg px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-brand-accent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-brand-accent to-brand-accent2 text-white hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(0,212,255,0.3)] mt-2"
          >
            Access Tactical Command Console
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 font-mono">
          Smart India Hackathon Prototype • Click to Enter
        </p>
      </div>
    </div>
  );
};

export default App;
