import React, { useState } from 'react';
import {
  Maximize2, Minimize2, ZoomIn, ZoomOut, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, RotateCcw, Eye, ShieldAlert, Video,
  Volume2, VolumeX, Download, Grid, Radio, Layers
} from 'lucide-react';
import { CanvasCameraFeed } from './CanvasCameraFeed';
import { playBeep } from '../../utils/audioAlert';

export const CameraFeedGrid = ({
  cameras = [],
  demoRunning = false,
  demoProgress = [],
  initialCameraId = null,
  onSelectCamera,
  onTriggerSiren
}) => {
  const [selectedCamId, setSelectedCamId] = useState(initialCameraId);
  const [gridMode, setGridMode] = useState(initialCameraId ? 'focus' : '2x2'); // '2x2', 'focus', '1+3'

  React.useEffect(() => {
    if (initialCameraId) {
      setSelectedCamId(initialCameraId);
      setGridMode('focus');
    }
  }, [initialCameraId]);
  const [visionModes, setVisionModes] = useState({
    'CAM-01': 'OPTICAL',
    'CAM-02': 'NIGHT_VISION',
    'CAM-03': 'OPTICAL',
    'CAM-04': 'THERMAL',
  });
  const [ptzState, setPtzState] = useState({
    'CAM-01': { pan: 0, tilt: 0, zoom: 1.0 },
    'CAM-02': { pan: 0, tilt: 0, zoom: 1.0 },
    'CAM-03': { pan: 0, tilt: 0, zoom: 1.0 },
    'CAM-04': { pan: 0, tilt: 0, zoom: 1.0 },
  });
  const [dvrOffset, setDvrOffset] = useState(0); // 0 = LIVE, -10s, -30s, etc.

  const handlePtz = (camId, action) => {
    playBeep(900, 0.05);
    setPtzState(prev => {
      const cur = prev[camId] || { pan: 0, tilt: 0, zoom: 1.0 };
      let { pan, tilt, zoom } = cur;
      if (action === 'up') tilt = Math.max(tilt - 20, -100);
      if (action === 'down') tilt = Math.min(tilt + 20, 100);
      if (action === 'left') pan = Math.max(pan - 20, -100);
      if (action === 'right') pan = Math.min(pan + 20, 100);
      if (action === 'zoomIn') zoom = Math.min(zoom + 0.2, 3.0);
      if (action === 'zoomOut') zoom = Math.max(zoom - 0.2, 1.0);
      if (action === 'reset') { pan = 0; tilt = 0; zoom = 1.0; }
      return { ...prev, [camId]: { pan, tilt, zoom } };
    });
  };

  const toggleVisionMode = (camId) => {
    playBeep(1100, 0.05);
    setVisionModes(prev => {
      const cur = prev[camId] || 'OPTICAL';
      const next = cur === 'OPTICAL' ? 'NIGHT_VISION' : cur === 'NIGHT_VISION' ? 'THERMAL' : 'OPTICAL';
      return { ...prev, [camId]: next };
    });
  };

  const handleSnapshot = (camId) => {
    playBeep(1200, 0.08);
    alert(`[DRISHTIX FORENSICS] High-resolution evidence frame captured from ${camId} with SHA-256 integrity watermark.`);
  };

  const activeCam = cameras.find(c => c.id === selectedCamId) || cameras[0] || {
    id: 'CAM-01', name: 'Border Patrol Alpha', location: 'Border Zone A - North Sector', zone: 'Sector 7'
  };

  return (
    <div className="space-y-4">
      {/* ─── CONTROLS BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-card/60 p-3 rounded-xl border border-brand-border/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Layout:</span>
          <button
            onClick={() => { playBeep(); setGridMode('2x2'); setSelectedCamId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              gridMode === '2x2' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40' : 'bg-brand-dark/40 text-slate-400 border border-brand-border/30 hover:text-white'
            }`}
          >
            2×2 Grid
          </button>
          <button
            onClick={() => { playBeep(); setGridMode('focus'); if (!selectedCamId) setSelectedCamId('CAM-04'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              gridMode === 'focus' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40' : 'bg-brand-dark/40 text-slate-400 border border-brand-border/30 hover:text-white'
            }`}
          >
            Focus View
          </button>
        </div>

        {/* DVR Timeline Scrubber */}
        <div className="flex items-center gap-3 bg-brand-dark/60 px-4 py-1.5 rounded-lg border border-brand-border/30">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${dvrOffset === 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <span className={`text-xs font-mono font-bold ${dvrOffset === 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {dvrOffset === 0 ? 'LIVE DVR' : `${dvrOffset}s PLAYBACK`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[0, -10, -30, -60].map(offset => (
              <button
                key={offset}
                onClick={() => { playBeep(); setDvrOffset(offset); }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                  dvrOffset === offset ? 'bg-brand-accent text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {offset === 0 ? 'LIVE' : `${offset}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playBeep(); onTriggerSiren && onTriggerSiren(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Sound Sector Siren
          </button>
        </div>
      </div>

      {/* ─── 2x2 GRID MODE ─── */}
      {gridMode === '2x2' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map(camId => {
            const cam = cameras.find(c => c.id === camId) || { id: camId, name: camId, location: 'Sector 7' };
            const triggered = demoProgress.includes(camId);
            const mode = visionModes[camId] || 'OPTICAL';
            const ptz = ptzState[camId] || { pan: 0, tilt: 0, zoom: 1.0 };

            return (
              <div
                key={camId}
                className={`glass-card overflow-hidden flex flex-col transition-all duration-300 ${
                  triggered ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-brand-border/30'
                }`}
              >
                {/* Video Container */}
                <div className="relative aspect-video bg-brand-dark overflow-hidden group">
                  <CanvasCameraFeed
                    cameraId={camId}
                    visionMode={mode}
                    isTriggered={triggered}
                    ptzPan={ptz.pan}
                    ptzTilt={ptz.tilt}
                    ptzZoom={ptz.zoom}
                  />

                  {/* Top Bar Overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <div className="cam-overlay-label flex items-center gap-1.5 pointer-events-auto">
                      <div className={`w-2 h-2 rounded-full ${triggered ? 'bg-red-500 animate-ping' : 'bg-brand-success'}`} />
                      <span className="font-bold text-white tracking-wider">{camId}</span>
                      <span className="text-[10px] text-slate-400 font-normal">| {cam.name || 'Border Node'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <button
                        onClick={() => toggleVisionMode(camId)}
                        title="Cycle Vision Mode (Optical / Thermal / Night Vision)"
                        className="cam-overlay-label hover:bg-brand-accent/30 transition-colors flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-brand-accent" />
                        <span className="text-[10px] uppercase font-bold">{mode}</span>
                      </button>

                      <button
                        onClick={() => { setSelectedCamId(camId); setGridMode('focus'); }}
                        title="Maximize / PTZ Controls"
                        className="cam-overlay-label hover:bg-brand-accent/30 transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Bar Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/70 pointer-events-none">
                    <div className="cam-overlay-label text-[10px]">
                      {cam.location || 'Perimeter Sector'}
                    </div>
                    <div className="flex items-center gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSnapshot(camId)}
                        className="cam-overlay-label hover:bg-white/20 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Snapshot
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Status */}
                <div className="px-3 py-2 bg-brand-deeper/80 border-t border-brand-border/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Zoom: <span className="text-white font-mono">{ptz.zoom.toFixed(1)}x</span></span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">FPS: <span className="text-brand-success font-mono">30</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePtz(camId, 'zoomIn')} className="p-1 hover:text-brand-accent"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handlePtz(camId, 'zoomOut')} className="p-1 hover:text-brand-accent"><ZoomOut className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── FOCUS / SINGLE CAMERA PTZ MODE ─── */}
      {gridMode === 'focus' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Focus Feed (3 cols) */}
          <div className="lg:col-span-3 glass-card overflow-hidden">
            <div className="relative aspect-video bg-brand-dark overflow-hidden">
              <CanvasCameraFeed
                cameraId={activeCam.id}
                visionMode={visionModes[activeCam.id] || 'OPTICAL'}
                isTriggered={demoProgress.includes(activeCam.id)}
                ptzPan={(ptzState[activeCam.id] || {}).pan || 0}
                ptzTilt={(ptzState[activeCam.id] || {}).tilt || 0}
                ptzZoom={(ptzState[activeCam.id] || {}).zoom || 1.0}
              />

              {/* Overlays */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                <div className="cam-overlay-label flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-success animate-pulse" />
                  <span className="font-bold text-sm tracking-wider">{activeCam.id}</span>
                  <span className="text-xs text-slate-300">({activeCam.name})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisionMode(activeCam.id)}
                    className="cam-overlay-label hover:bg-brand-accent/30 transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-brand-accent" />
                    <span className="font-bold">{visionModes[activeCam.id] || 'OPTICAL'}</span>
                  </button>
                  <button
                    onClick={() => handleSnapshot(activeCam.id)}
                    className="cam-overlay-label hover:bg-brand-accent/30 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Save Evidence
                  </button>
                </div>
              </div>
            </div>

            {/* Focus Feed Info */}
            <div className="p-4 bg-brand-deeper/70 border-t border-brand-border/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{activeCam.name}</h3>
                <p className="text-xs text-slate-400">{activeCam.location} • {activeCam.zone}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>LAT: 32.7298° N</span>
                <span>LNG: 74.8595° E</span>
                <span>FOV: 85°</span>
              </div>
            </div>
          </div>

          {/* Right PTZ Control Panel (1 col) */}
          <div className="space-y-4">
            {/* Camera Switcher */}
            <div className="glass-card p-3 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Stream</span>
              <div className="grid grid-cols-2 gap-2">
                {cameras.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { playBeep(); setSelectedCamId(c.id); }}
                    className={`p-2 rounded-lg text-xs font-bold text-left transition-all ${
                      (selectedCamId || 'CAM-01') === c.id ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40' : 'bg-brand-dark text-slate-300 border border-brand-border/20 hover:border-brand-border/50'
                    }`}
                  >
                    <div className="font-mono">{c.id}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* PTZ Joystick */}
            <div className="glass-card p-4 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">PTZ Gimbal Control</span>
              <div className="relative w-36 h-36 mx-auto bg-brand-dark/90 rounded-full border border-brand-border/40 flex items-center justify-center p-2 shadow-inner">
                {/* Direction buttons */}
                <button
                  onClick={() => handlePtz(activeCam.id, 'up')}
                  className="absolute top-2 left-1/2 -translate-x-1/2 p-2 rounded-full hover:bg-brand-accent/20 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePtz(activeCam.id, 'down')}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 rounded-full hover:bg-brand-accent/20 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePtz(activeCam.id, 'left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-brand-accent/20 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePtz(activeCam.id, 'right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-brand-accent/20 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Center Reset */}
                <button
                  onClick={() => handlePtz(activeCam.id, 'reset')}
                  title="Reset PTZ Home"
                  className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/30 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom In/Out Sliders */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => handlePtz(activeCam.id, 'zoomOut')}
                  className="px-3 py-1.5 bg-brand-dark rounded-lg border border-brand-border/30 text-xs text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <ZoomOut className="w-3.5 h-3.5" /> Out
                </button>
                <span className="text-xs font-mono font-bold text-brand-accent">
                  {((ptzState[activeCam.id] || {}).zoom || 1.0).toFixed(1)}x
                </span>
                <button
                  onClick={() => handlePtz(activeCam.id, 'zoomIn')}
                  className="px-3 py-1.5 bg-brand-dark rounded-lg border border-brand-border/30 text-xs text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
