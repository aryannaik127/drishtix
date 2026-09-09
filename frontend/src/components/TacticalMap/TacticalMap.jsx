import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass, Radio, Navigation, Eye, ShieldAlert, ShieldCheck,
  Layers, Users, Car, Target, Crosshair, AlertTriangle, Lock,
  Unlock, RotateCcw, ZoomIn, ZoomOut, Move, Maximize2, Activity,
  ChevronRight, Info, Shield, Plane, ArrowUpRight, Gauge, CheckCircle2
} from 'lucide-react';
import { playBeep, playWarningTone, playCriticalSiren } from '../../utils/audioAlert';

/**
 * 3D Tactical Radar & Geospatial Command Center
 * Features:
 * - Full 3D Isometric & Perspective matrix projection with interactive Orbit, Tilt, Pan, Zoom
 * - Dynamic 3D volumetric radar beam with decaying phosphor sweep and elevation echoes
 * - 3D Camera Coverage Frustums (CAM-01 to CAM-04) with live beam geometry
 * - 3D Depth planes: Ground Terrain Grid, 3D Border Fence, Airborne UAV (120m altitude with drop-lines)
 * - Safe Handling & Defensive Buffer Zones (Safe Corridor, Warning Buffer, Critical Breach Zone)
 * - Safe Fail-Safe Controls: Corridor Lockdown, Safe UAV Return-to-Base, Standoff Distance Meter, Auto-Threat Lock
 */

// Initial Field Entities & Nodes
const INITIAL_CAMERA_NODES = [
  { id: 'CAM-01', name: 'Alpha Patrol', type: 'PTZ 4K IP', x: 260, y: 180, z: 25, fov: 70, heading: 40, zone: 'Sector 7 - North', status: 'ONLINE', fps: 30, resolution: '3840x2160' },
  { id: 'CAM-02', name: 'Checkpoint Bravo', type: 'Fixed Guard IP', x: 420, y: 310, z: 18, fov: 60, heading: 120, zone: 'Sector 7 - Gate', status: 'ONLINE', fps: 30, resolution: '1920x1080' },
  { id: 'CAM-03', name: 'ANPR Gate Trap', type: 'Optical OCR Zoom', x: 510, y: 260, z: 20, fov: 50, heading: 205, zone: 'Main Entry Lane', status: 'ONLINE', fps: 60, resolution: '2560x1440' },
  { id: 'CAM-04', name: 'Delta Thermal', type: 'Thermal FLIR LWIR', x: 630, y: 140, z: 30, fov: 85, heading: 290, zone: 'Restricted Perimeter', status: 'ONLINE', fps: 30, resolution: '1280x720' },
];

const INITIAL_PATROL_UNITS = [
  { id: 'QRT-ALPHA', name: 'Quick Reaction Team 01', type: 'ARMORED_4x4', x: 380, y: 240, z: 0, heading: 95, speed: 38, status: 'PATROLLING', crew: 4, ammo: '100%', fuel: '84%' },
  { id: 'UAV-B1', name: 'Border Surveillance Drone', type: 'DRONE_UAV', x: 540, y: 110, z: 120, heading: 230, speed: 52, status: 'AIRBORNE', battery: '78%', altMsl: '432m' },
  { id: 'FOOT-PATROL-04', name: 'Border Guard Squad 4', type: 'INFANTRY', x: 210, y: 220, z: 0, heading: 35, speed: 5, status: 'STATIONARY', crew: 3, ammo: '100%', comms: 'ENCRYPTED' },
];

const INITIAL_TARGETS = [
  { id: 'T-01', label: 'Pedestrian P-01', type: 'PERSON', risk: 'LOW', x: 290, y: 150, z: 0, speed: 4.2, heading: 'NE', confidence: 0.96, zone: 'Sector 7 - North' },
  { id: 'T-02', label: 'SUV MH01AB1234', type: 'VEHICLE', risk: 'HIGH', x: 480, y: 280, z: 0, speed: 42, heading: 'W', confidence: 0.94, zone: 'Main Entry Lane' },
  { id: 'T-03', label: 'Intruder P-99', type: 'INTRUDER', risk: 'CRITICAL', x: 650, y: 160, z: 0, speed: 9.8, heading: 'S', confidence: 0.98, zone: 'Restricted Zone Delta' },
];

// Preset 3D Camera Views
const CAMERA_PRESETS = {
  ORBIT_3D: { pitch: 52, yaw: 24, panX: 0, panY: 0, zoom: 1.0, label: '3D Tactical Orbit' },
  ISOMETRIC: { pitch: 45, yaw: 45, panX: 0, panY: 0, zoom: 1.0, label: 'Isometric (45°)' },
  TOP_DOWN: { pitch: 0, yaw: 0, panX: 0, panY: 0, zoom: 0.92, label: 'Top-Down GIS (2D)' },
  ALPHA_FOCUS: { pitch: 48, yaw: 15, panX: 120, panY: 60, zoom: 1.35, label: 'Sector Alpha Focus' },
  GATE_FOCUS: { pitch: 45, yaw: 30, panX: -20, panY: -50, zoom: 1.4, label: 'Checkpoint Gate Focus' },
  DELTA_FOCUS: { pitch: 55, yaw: -20, panX: -180, panY: 80, zoom: 1.45, label: 'Delta Breach Focus' },
  DRONE_VIEW: { pitch: 65, yaw: 40, panX: -100, panY: 90, zoom: 1.5, label: 'UAV Aerial Cam' },
};

export const TacticalMap = ({ onSelectCamera, alerts = [] }) => {
  // 3D Viewport Transformations
  const [pitch, setPitch] = useState(52); // Tilt angle in degrees (0 = top-down, 75 = low horizon)
  const [yaw, setYaw] = useState(24);     // Orbit rotation in degrees
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [activePreset, setActivePreset] = useState('ORBIT_3D');

  // Layer Visibility & Selection
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL', 'CAMERAS', 'PATROLS', 'TARGETS', 'SAFE_ZONES'
  const [selectedEntity, setSelectedEntity] = useState(INITIAL_TARGETS[2]); // Default focus on critical threat
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);

  // Safety & Handling State
  const [isCorridorLocked, setIsCorridorLocked] = useState(false);
  const [isDroneRTB, setIsDroneRTB] = useState(false);
  const [safetyArmed, setSafetyArmed] = useState(false);
  const [showSafetyHelp, setShowSafetyHelp] = useState(false);
  const [trackingThreatId, setTrackingThreatId] = useState(null);

  // Drag interaction state
  const isDragging = useRef(false);
  const dragMode = useRef('orbit'); // 'orbit' or 'pan'
  const startMousePos = useRef({ x: 0, y: 0 });
  const currentTransform = useRef({ pitch: 52, yaw: 24, panX: 0, panY: 0 });

  // Dynamic Live Simulation Vectors
  const [dronePos, setDronePos] = useState({ x: 540, y: 110, z: 120, heading: 230 });
  const [qrtPos, setQrtPos] = useState({ x: 380, y: 240, z: 0, heading: 95 });
  const [intruderPos, setIntruderPos] = useState({ x: 650, y: 160, z: 0, heading: 'S' });

  // Radar Continuous Sweep Animation
  useEffect(() => {
    let animId;
    let angle = 0;
    const animateSweep = () => {
      angle = (angle + 2.5) % 360;
      setRadarSweepAngle(angle);
      animId = requestAnimationFrame(animateSweep);
    };
    animId = requestAnimationFrame(animateSweep);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Moving Unit Physics Simulation
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      // Drone figure-8 patrol or RTB path
      if (!isDroneRTB) {
        const dx = 540 + Math.sin(tick * 0.04) * 80;
        const dy = 110 + Math.cos(tick * 0.03) * 45;
        const dAngle = Math.atan2(Math.cos(tick * 0.03) * 45, Math.sin(tick * 0.04) * 80) * (180 / Math.PI);
        setDronePos({ x: dx, y: dy, z: 120 + Math.sin(tick * 0.08) * 8, heading: (dAngle + 360) % 360 });
      } else {
        // Fly towards Base Helipad at (300, 380)
        setDronePos(prev => {
          const targetX = 300;
          const targetY = 380;
          const nx = prev.x + (targetX - prev.x) * 0.05;
          const ny = prev.y + (targetY - prev.y) * 0.05;
          const nz = Math.max(prev.z * 0.96, 15);
          return { x: nx, y: ny, z: nz, heading: 210 };
        });
      }

      // QRT Patrol route along highway
      const qProg = (tick * 0.015) % (Math.PI * 2);
      const qx = 380 + Math.sin(qProg) * 60;
      const qy = 240 + Math.cos(qProg) * 35;
      setQrtPos({ x: qx, y: qy, z: 0, heading: Math.floor((qProg * 180 / Math.PI + 90) % 360) });

      // Intruder subtle motion towards fence
      const ix = 650 + Math.sin(tick * 0.025) * 15;
      const iy = 160 + Math.cos(tick * 0.02) * 10;
      setIntruderPos({ x: ix, y: iy, z: 0, heading: 'S' });
    }, 50);

    return () => clearInterval(interval);
  }, [isDroneRTB]);

  // Compute 3D Projection Matrix Transformation
  // Transforms 3D world coords (wx, wy, wz) -> Screen Coords (sx, sy)
  const project3D = useCallback((wx, wy, wz = 0) => {
    // 1. Center coordinates around map center (400, 250)
    const cx = wx - 400;
    const cy = wy - 250;
    const cz = wz;

    // 2. Yaw (Orbit around Z axis)
    const radYaw = (yaw * Math.PI) / 180;
    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const rx = cx * cosY - cy * sinY;
    const ry = cx * sinY + cy * cosY;
    const rz = cz;

    // 3. Pitch (Tilt around X axis)
    const radPitch = (pitch * Math.PI) / 180;
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);
    const px = rx;
    const py = ry * cosP - rz * sinP;
    const pz = ry * sinP + rz * cosP;

    // 4. Perspective depth scaling
    const perspective = 1000;
    const scale = (perspective / (perspective + pz * 0.4)) * zoom;

    // 5. Final Screen position
    const sx = 400 + px * scale + pan.x;
    const sy = 250 + py * scale + pan.y;

    return { x: sx, y: sy, scale, depth: pz };
  }, [pitch, yaw, pan, zoom]);

  // Apply Camera Preset View with smooth transition
  const applyPreset = (key) => {
    playBeep(1100, 0.05);
    const p = CAMERA_PRESETS[key];
    if (!p) return;
    setActivePreset(key);
    setPitch(p.pitch);
    setYaw(p.yaw);
    setPan({ x: p.panX, y: p.panY });
    setZoom(p.zoom);
    currentTransform.current = { pitch: p.pitch, yaw: p.yaw, panX: p.panX, panY: p.panY };
  };

  // Mouse / Touch Drag Handlers for 3D Navigation
  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragMode.current = e.shiftKey || e.button === 1 || e.button === 2 ? 'pan' : 'orbit';
    startMousePos.current = { x: e.clientX, y: e.clientY };
    currentTransform.current = { pitch, yaw, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startMousePos.current.x;
    const dy = e.clientY - startMousePos.current.y;

    if (dragMode.current === 'orbit') {
      const newYaw = (currentTransform.current.yaw + dx * 0.5) % 360;
      const newPitch = Math.max(0, Math.min(75, currentTransform.current.pitch + dy * 0.4));
      setYaw(newYaw);
      setPitch(newPitch);
      setActivePreset('CUSTOM');
    } else {
      const newPanX = currentTransform.current.panX + dx;
      const newPanY = currentTransform.current.panY + dy;
      setPan({ x: newPanX, y: newPanY });
      setActivePreset('CUSTOM');
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(z => Math.max(0.6, Math.min(2.5, z + delta)));
    setActivePreset('CUSTOM');
  };

  // Safety Actions
  const toggleCorridorLockdown = () => {
    if (isCorridorLocked) {
      playBeep(900, 0.1);
      setIsCorridorLocked(false);
    } else {
      playCriticalSiren(2);
      setIsCorridorLocked(true);
    }
  };

  const toggleDroneRTB = () => {
    playWarningTone();
    setIsDroneRTB(!isDroneRTB);
  };

  const handleAutoTrackThreat = (target) => {
    playBeep(1200, 0.08);
    setSelectedEntity(target);
    setTrackingThreatId(target.id);
    // Smoothly orbit camera towards the threat
    applyPreset('DELTA_FOCUS');
  };

  // Calculate Distance to Fence (Standoff Safety Meter)
  const calculateStandoffDistance = (target) => {
    // Distance from target to Zero-Line Fence (avg Y=160 at X=650)
    const distPx = Math.abs(target.y - 140);
    const meters = Math.round(distPx * 1.8);
    return meters;
  };

  const criticalTarget = INITIAL_TARGETS.find(t => t.id === 'T-03') || INITIAL_TARGETS[2];
  const standoffDist = calculateStandoffDistance(intruderPos);
  const standoffStatus = standoffDist < 40 ? 'CRITICAL BREACH' : standoffDist < 100 ? 'WARNING BUFFER' : 'SAFE DISTANCE';
  const standoffColor = standoffDist < 40 ? 'text-red-400 bg-red-500/10 border-red-500/40' : standoffDist < 100 ? 'text-amber-400 bg-amber-500/10 border-amber-500/40' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';

  // 3D Nodes Projection
  const projectedCamNodes = INITIAL_CAMERA_NODES.map(cam => ({
    ...cam,
    screen: project3D(cam.x, cam.y, cam.z),
    groundScreen: project3D(cam.x, cam.y, 0),
  }));

  const projectedDrone = {
    ...INITIAL_PATROL_UNITS[1],
    ...dronePos,
    screen: project3D(dronePos.x, dronePos.y, dronePos.z),
    groundScreen: project3D(dronePos.x, dronePos.y, 0),
  };

  const projectedQrt = {
    ...INITIAL_PATROL_UNITS[0],
    ...qrtPos,
    screen: project3D(qrtPos.x, qrtPos.y, 0),
  };

  const projectedTargets = INITIAL_TARGETS.map(tgt => {
    const coords = tgt.id === 'T-03' ? intruderPos : tgt;
    return {
      ...tgt,
      x: coords.x,
      y: coords.y,
      screen: project3D(coords.x, coords.y, coords.z || 0),
      standoff: calculateStandoffDistance(coords),
    };
  });

  // 3D Grid Lines (10x10 World Matrix)
  const gridLines = [];
  for (let gx = 50; gx <= 750; gx += 70) {
    const p1 = project3D(gx, 50, 0);
    const p2 = project3D(gx, 450, 0);
    gridLines.push({ key: `v_${gx}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }
  for (let gy = 50; gy <= 450; gy += 50) {
    const p1 = project3D(50, gy, 0);
    const p2 = project3D(750, gy, 0);
    gridLines.push({ key: `h_${gy}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }

  // 3D Border Fence Path Points
  const fenceWaypoints = [
    { x: 60, y: 120 }, { x: 180, y: 145 }, { x: 310, y: 165 },
    { x: 440, y: 175 }, { x: 580, y: 155 }, { x: 740, y: 110 }
  ];
  const projectedFence = fenceWaypoints.map(pt => project3D(pt.x, pt.y, 0));
  const projectedFenceTop = fenceWaypoints.map(pt => project3D(pt.x, pt.y, 18));

  // 3D Highway Road
  const roadWaypoints = [
    { x: 420, y: 480 }, { x: 420, y: 310 }, { x: 510, y: 260 }
  ];
  const projectedRoad = roadWaypoints.map(pt => project3D(pt.x, pt.y, 0));

  // Safe Corridor Polygon Points (Authorized Green Zone)
  const safeZonePoints = [
    { x: 360, y: 460 }, { x: 360, y: 300 }, { x: 460, y: 250 },
    { x: 560, y: 250 }, { x: 560, y: 340 }, { x: 480, y: 460 }
  ].map(pt => project3D(pt.x, pt.y, 0));

  // Warning Buffer Polygon Points (Amber Zone)
  const bufferZonePoints = [
    { x: 120, y: 240 }, { x: 340, y: 220 }, { x: 560, y: 210 },
    { x: 700, y: 190 }, { x: 700, y: 240 }, { x: 120, y: 290 }
  ].map(pt => project3D(pt.x, pt.y, 0));

  // Restricted Perimeter Breach Polygon (Red Zone)
  const restrictedZonePoints = [
    { x: 560, y: 80 }, { x: 750, y: 70 }, { x: 750, y: 190 }, { x: 560, y: 180 }
  ].map(pt => project3D(pt.x, pt.y, 0));

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* ─── COMMAND BAR & SAFETY STATUS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-card/90 p-3.5 rounded-xl border border-brand-border/40 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <Compass className="w-5 h-5 text-brand-accent animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">3D TACTICAL RADAR & GEOSPATIAL COMMAND</h2>
              <span className="bg-brand-accent/20 border border-brand-accent/40 text-brand-accent font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                3D ISOMETRIC V2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 3D spatial battlespace with volumetric radar sweep, 3D FOV frustums, and fail-safe safety corridors.
            </p>
          </div>
        </div>

        {/* Realtime Safety Standoff Meter */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${standoffColor}`}>
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>STANDOFF: {standoffDist}m ({standoffStatus})</span>
          </div>

          {/* Quick Corridor Lockdown Toggle */}
          <button
            onClick={toggleCorridorLockdown}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              isCorridorLocked
                ? 'bg-red-500 text-white border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Safe Corridor Lockdown (Secures All Checkpoints and Gate Arms)"
          >
            {isCorridorLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isCorridorLocked ? 'CORRIDOR LOCKED' : 'SECURE CORRIDOR'}</span>
          </button>

          {/* Safe UAV Return to Base (RTB) Toggle */}
          <button
            onClick={toggleDroneRTB}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDroneRTB
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse'
                : 'bg-brand-dark/80 text-cyan-400 border border-brand-border/40 hover:bg-cyan-500/10'
            }`}
            title="Safe Drone Autonomous Return-to-Base"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{isDroneRTB ? 'UAV RTB ACTIVE' : 'UAV SAFE RTB'}</span>
          </button>
        </div>
      </div>

      {/* ─── 3D VIEWPORT CONTROLS BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-dark/80 px-4 py-2 rounded-xl border border-brand-border/30 text-xs">
        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">3D View:</span>
          {Object.entries(CAMERA_PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activePreset === key
                  ? 'bg-brand-accent text-black font-bold shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                  : 'bg-brand-card/60 text-slate-300 border border-brand-border/30 hover:text-white hover:bg-brand-card'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 3D Transform Telemetry Readout */}
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <div>PITCH: <span className="text-brand-accent font-bold">{Math.round(pitch)}°</span></div>
          <div>YAW: <span className="text-brand-accent font-bold">{Math.round(yaw)}°</span></div>
          <div>ZOOM: <span className="text-brand-accent font-bold">{(zoom * 100).toFixed(0)}%</span></div>

          <div className="w-px h-3.5 bg-brand-border/40" />

          {/* Layer Filter Buttons */}
          <div className="flex items-center gap-1">
            {['ALL', 'CAMERAS', 'PATROLS', 'TARGETS', 'SAFE_ZONES'].map(layer => (
              <button
                key={layer}
                onClick={() => { playBeep(880, 0.04); setActiveLayer(layer); }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activeLayer === layer ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN 3D BATTLESPACE & RADAR CONTAINER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3D Canvas / SVG Viewport (3 Columns) */}
        <div className="lg:col-span-3 glass-card p-2 flex flex-col relative overflow-hidden group">
          <div
            className="relative aspect-[16/10] bg-[#02050e] rounded-xl border border-brand-border/40 overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          >
            {/* 3D Holographic Rendering SVG */}
            <svg viewBox="0 0 800 500" className="absolute inset-0 w-full h-full select-none pointer-events-auto">
              <defs>
                {/* 3D Radar Sweep Radial Gradient */}
                <radialGradient id="radarSweep3D" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(0, 212, 255, 0.35)" />
                  <stop offset="60%" stopColor="rgba(0, 212, 255, 0.12)" />
                  <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
                </radialGradient>

                {/* 3D Safe Corridor Gradient */}
                <linearGradient id="safeCorridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.03)" />
                </linearGradient>

                {/* 3D Red Breach Gradient */}
                <linearGradient id="redBreachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.22)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                </linearGradient>

                {/* Glow Filter for 3D Beacons */}
                <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ─── 1. 3D GROUND TACTICAL GRID MATRIX ─── */}
              <g opacity="0.35">
                {gridLines.map(l => (
                  <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#00d4ff" strokeWidth="0.75" />
                ))}
              </g>

              {/* ─── 2. 3D CONCENTRIC RADAR RANGE RINGS ─── */}
              {[90, 160, 240].map((radius, idx) => {
                const ringPts = [];
                for (let a = 0; a <= 360; a += 15) {
                  const rad = (a * Math.PI) / 180;
                  const rx = 400 + Math.cos(rad) * radius;
                  const ry = 250 + Math.sin(rad) * radius;
                  ringPts.push(project3D(rx, ry, 0));
                }
                const pathData = ringPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                return (
                  <g key={`ring_${radius}`}>
                    <path d={pathData} fill="none" stroke="rgba(0, 212, 255, 0.18)" strokeWidth="1" strokeDasharray={idx === 1 ? '4,4' : 'none'} />
                    {/* Range distance marker */}
                    <text x={ringPts[0]?.x + 4} y={ringPts[0]?.y - 2} fill="#00d4ff" fontSize="8" fontFamily="monospace" opacity="0.5">
                      {radius * 2}m
                    </text>
                  </g>
                );
              })}

              {/* ─── 3. 3D VOLUMETRIC RADAR SWEEP BEAM ─── */}
              {(() => {
                const beamSweepRad = (radarSweepAngle * Math.PI) / 180;
                const beamLen = 280;
                const bEnd1 = project3D(400 + Math.cos(beamSweepRad) * beamLen, 250 + Math.sin(beamSweepRad) * beamLen, 0);
                const bEnd2 = project3D(400 + Math.cos(beamSweepRad - 0.4) * beamLen, 250 + Math.sin(beamSweepRad - 0.4) * beamLen, 0);
                const bCenter = project3D(400, 250, 0);

                return (
                  <g>
                    {/* Rotating Phosphor Sweep Cone */}
                    <polygon
                      points={`${bCenter.x},${bCenter.y} ${bEnd1.x},${bEnd1.y} ${bEnd2.x},${bEnd2.y}`}
                      fill="url(#radarSweep3D)"
                    />
                    {/* Leading Sweep Laser Line */}
                    <line x1={bCenter.x} y1={bCenter.y} x2={bEnd1.x} y2={bEnd1.y} stroke="#00d4ff" strokeWidth="1.8" opacity="0.8" />
                  </g>
                );
              })()}

              {/* ─── 4. 3D DEFENSE SAFETY CORRIDORS & BUFFER ZONES ─── */}
              {(activeLayer === 'ALL' || activeLayer === 'SAFE_ZONES') && (
                <g>
                  {/* Safe Green Corridor */}
                  <polygon
                    points={safeZonePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="url(#safeCorridorGrad)"
                    stroke="rgba(16, 185, 129, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  <text x={safeZonePoints[1]?.x + 10} y={safeZonePoints[1]?.y} fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    ✓ AUTHORIZED SAFE DEFENSE CORRIDOR
                  </text>

                  {/* Warning Amber Buffer Zone */}
                  <polygon
                    points={bufferZonePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(245, 158, 11, 0.05)"
                    stroke="rgba(245, 158, 11, 0.35)"
                    strokeWidth="1.2"
                    strokeDasharray="5,4"
                  />
                  <text x={bufferZonePoints[0]?.x + 10} y={bufferZonePoints[0]?.y} fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    ⚠ STANDOFF WARNING BUFFER ZONE
                  </text>

                  {/* Restricted Red Breach Perimeter */}
                  <polygon
                    points={restrictedZonePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="url(#redBreachGrad)"
                    stroke="rgba(239, 68, 68, 0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="6,3"
                  />
                  <text x={restrictedZonePoints[0]?.x + 10} y={restrictedZonePoints[0]?.y - 6} fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    ⛔ RESTRICTED ZONE DELTA (NO-GO)
                  </text>
                </g>
              )}

              {/* ─── 5. 3D ROAD NETWORK TO CHECKPOINT ─── */}
              <g>
                <path
                  d={projectedRoad.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <path
                  d={projectedRoad.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="1"
                  strokeDasharray="8,6"
                  opacity="0.7"
                />
              </g>

              {/* ─── 6. 3D INTERNATIONAL BORDER WIRE FENCE ─── */}
              <g>
                {/* Fence Posts in 3D */}
                {fenceWaypoints.map((pt, i) => {
                  const bPt = projectedFence[i];
                  const tPt = projectedFenceTop[i];
                  return (
                    <g key={`post_${i}`}>
                      <line x1={bPt.x} y1={bPt.y} x2={tPt.x} y2={tPt.y} stroke="#ef4444" strokeWidth="2" opacity="0.85" />
                      <circle cx={tPt.x} cy={tPt.y} r="2.5" fill="#ef4444" filter="url(#beaconGlow)" />
                    </g>
                  );
                })}

                {/* Ground Line */}
                <path
                  d={projectedFence.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />

                {/* Razor Wire Top Line */}
                <path
                  d={projectedFenceTop.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#ff6b6b"
                  strokeWidth="1.2"
                  strokeDasharray="3,2"
                  opacity="0.7"
                />
              </g>

              {/* ─── 7. 3D CAMERA COVERAGE FRUSTUMS (CAM-01 to CAM-04) ─── */}
              {(activeLayer === 'ALL' || activeLayer === 'CAMERAS') && projectedCamNodes.map(cam => {
                const headingRad = (cam.heading * Math.PI) / 180;
                const fovHalfRad = ((cam.fov / 2) * Math.PI) / 180;
                const coneDist = 120;

                const leftW = {
                  x: cam.x + coneDist * Math.cos(headingRad - fovHalfRad),
                  y: cam.y + coneDist * Math.sin(headingRad - fovHalfRad),
                  z: 0
                };
                const rightW = {
                  x: cam.x + coneDist * Math.cos(headingRad + fovHalfRad),
                  y: cam.y + coneDist * Math.sin(headingRad + fovHalfRad),
                  z: 0
                };

                const pCamBase = cam.groundScreen;
                const pCamTop = cam.screen;
                const pLeft = project3D(leftW.x, leftW.y, 0);
                const pRight = project3D(rightW.x, rightW.y, 0);

                const isSelected = selectedEntity && selectedEntity.id === cam.id;
                const isThermal = cam.id === 'CAM-04';
                const coneColor = isThermal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 212, 255, 0.15)';
                const strokeColor = isThermal ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 212, 255, 0.7)';

                return (
                  <g key={cam.id} className="cursor-pointer" onClick={() => { playBeep(1100, 0.05); setSelectedEntity(cam); }}>
                    {/* 3D Volumetric Vision Frustum */}
                    <polygon
                      points={`${pCamTop.x},${pCamTop.y} ${pLeft.x},${pLeft.y} ${pRight.x},${pRight.y}`}
                      fill={coneColor}
                      stroke={strokeColor}
                      strokeWidth="1.2"
                    />

                    {/* Mast Post from ground to camera height */}
                    <line x1={pCamBase.x} y1={pCamBase.y} x2={pCamTop.x} y2={pCamTop.y} stroke="#94a3b8" strokeWidth="1.8" />

                    {/* Camera Head Node */}
                    <circle cx={pCamTop.x} cy={pCamTop.y} r={isSelected ? '7' : '5'} fill={isThermal ? '#ef4444' : '#00d4ff'} stroke="#ffffff" strokeWidth="1.5" />
                    
                    {/* Cam Label Tag */}
                    <text x={pCamTop.x + 8} y={pCamTop.y - 4} fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      📹 {cam.id}
                    </text>
                  </g>
                );
              })}

              {/* ─── 8. 3D GROUND PATROLS & VEHICLES ─── */}
              {(activeLayer === 'ALL' || activeLayer === 'PATROLS') && (
                <g>
                  {/* QRT Armored Patrol Unit */}
                  <g className="cursor-pointer" onClick={() => { playBeep(); setSelectedEntity(projectedQrt); }}>
                    {/* Footprint / Vehicle Body in 3D */}
                    <rect
                      x={projectedQrt.screen.x - 9}
                      y={projectedQrt.screen.y - 6}
                      width="18"
                      height="12"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      rx="2.5"
                    />
                    <text x={projectedQrt.screen.x + 12} y={projectedQrt.screen.y + 4} fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      🛡️ QRT-01 (ARMORED)
                    </text>
                  </g>

                  {/* Foot Patrol Squad */}
                  <g className="cursor-pointer" onClick={() => { playBeep(); setSelectedEntity(INITIAL_PATROL_UNITS[2]); }}>
                    {(() => {
                      const pFoot = project3D(210, 220, 0);
                      return (
                        <g>
                          <circle cx={pFoot.x} cy={pFoot.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                          <text x={pFoot.x + 8} y={pFoot.y + 3} fill="#60a5fa" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                            👮 SQUAD-4
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                </g>
              )}

              {/* ─── 9. 3D AIRBORNE UAV DRONE (120m Altitude Layer) ─── */}
              {(activeLayer === 'ALL' || activeLayer === 'PATROLS') && (
                <g className="cursor-pointer" onClick={() => { playBeep(); setSelectedEntity(projectedDrone); }}>
                  {/* 3D Vertical Drop-Line from Drone to Ground */}
                  <line
                    x1={projectedDrone.screen.x}
                    y1={projectedDrone.screen.y}
                    x2={projectedDrone.groundScreen.x}
                    y2={projectedDrone.groundScreen.y}
                    stroke="#00d4ff"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                    opacity="0.8"
                  />

                  {/* Ground Shadow Target Marker */}
                  <ellipse
                    cx={projectedDrone.groundScreen.x}
                    cy={projectedDrone.groundScreen.y}
                    rx="8"
                    ry="4"
                    fill="rgba(0, 212, 255, 0.25)"
                    stroke="#00d4ff"
                    strokeWidth="1"
                  />

                  {/* Drone Searchlight Frustum on Ground */}
                  <polygon
                    points={`${projectedDrone.screen.x},${projectedDrone.screen.y} ${projectedDrone.groundScreen.x - 25},${projectedDrone.groundScreen.y + 12} ${projectedDrone.groundScreen.x + 25},${projectedDrone.groundScreen.y + 12}`}
                    fill="rgba(0, 212, 255, 0.08)"
                  />

                  {/* Drone Airframe in 3D */}
                  <g transform={`translate(${projectedDrone.screen.x}, ${projectedDrone.screen.y})`}>
                    <circle cx="0" cy="0" r="6" fill="#00d4ff" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Rotor wash rings */}
                    <circle cx="-8" cy="-5" r="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                    <circle cx="8" cy="-5" r="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                    <circle cx="-8" cy="5" r="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                    <circle cx="8" cy="5" r="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                  </g>

                  {/* Altitude MSL Badge */}
                  <text x={projectedDrone.screen.x + 12} y={projectedDrone.screen.y - 4} fill="#00d4ff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    🛸 UAV-B1 [ALT: {Math.round(dronePos.z)}m]
                  </text>
                </g>
              )}

              {/* ─── 10. 3D TARGET TRACKS & THREAT BEACONS ─── */}
              {(activeLayer === 'ALL' || activeLayer === 'TARGETS') && projectedTargets.map(tgt => {
                const isCrit = tgt.risk === 'CRITICAL';
                const isHigh = tgt.risk === 'HIGH';
                const color = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#f59e0b';
                const isSelected = selectedEntity && selectedEntity.id === tgt.id;

                return (
                  <g key={tgt.id} className="cursor-pointer" onClick={() => { playBeep(); setSelectedEntity(tgt); }}>
                    {/* 3D Pulse Threat Rings */}
                    <circle cx={tgt.screen.x} cy={tgt.screen.y} r={isSelected ? '14' : '10'} fill="none" stroke={color} strokeWidth="1.5">
                      <animate attributeName="r" values="8;20;8" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
                    </circle>

                    {/* Threat Core Blip */}
                    <circle cx={tgt.screen.x} cy={tgt.screen.y} r={isSelected ? '6' : '4.5'} fill={color} stroke="#ffffff" strokeWidth="1.5" filter="url(#beaconGlow)" />

                    {/* Velocity Vector Arrow */}
                    <line
                      x1={tgt.screen.x}
                      y1={tgt.screen.y}
                      x2={tgt.screen.x + (tgt.heading === 'NE' ? 12 : tgt.heading === 'W' ? -14 : 0)}
                      y2={tgt.screen.y + (tgt.heading === 'S' ? 14 : tgt.heading === 'NE' ? -10 : 0)}
                      stroke={color}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    {/* Threat Tag */}
                    <text x={tgt.screen.x + 12} y={tgt.screen.y - 4} fill={color} fontSize="9" fontWeight="bold" fontFamily="monospace">
                      {isCrit ? '🚨' : isHigh ? '⚠️' : '👤'} {tgt.label} ({tgt.standoff}m)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* ─── 3D VIEWPORT HUD GAUGES & OVERLAYS ─── */}
            {/* Top-Left Orientation Compass HUD */}
            <div className="absolute top-3 left-3 bg-black/80 px-3 py-2 rounded-lg border border-brand-border/40 text-[10px] font-mono text-slate-300 space-y-1 backdrop-blur-sm pointer-events-none">
              <div className="flex items-center gap-2 font-bold text-white">
                <Compass className="w-3.5 h-3.5 text-brand-accent" style={{ transform: `rotate(${-yaw}deg)` }} />
                <span>HEADING: {((360 - Math.round(yaw)) % 360).toString().padStart(3, '0')}° N</span>
              </div>
              <div className="text-slate-400">DEFCON LEVEL: <span className="text-red-400 font-bold">2 (TACTICAL ALERT)</span></div>
              <div className="text-slate-400">GRID: <span className="text-white">32°43'41"N 74°51'25"E</span></div>
            </div>

            {/* Top-Right Quick View Navigation Tools */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 p-1 rounded-lg border border-brand-border/40 backdrop-blur-sm">
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Zoom In (Scroll Up)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Zoom Out (Scroll Down)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyPreset('ORBIT_3D')}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Reset 3D View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom-Left Mouse Interaction Guide */}
            <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-[9.5px] font-mono text-slate-400 pointer-events-none border border-brand-border/20">
              Left-Drag: 3D Orbit • Shift+Drag: Pan • Wheel: Zoom
            </div>

            {/* Bottom-Right Fast Action: Auto-Track Critical Threat */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => handleAutoTrackThreat(criticalTarget)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 text-xs font-bold font-mono transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>AUTO-TRACK INTRUDER P-99</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Safe Defensive Handling Panel (1 Column) */}
        <div className="space-y-3.5">
          {/* 1. Selected Node / Target Inspector Card */}
          <div className="glass-card p-4 space-y-3 border border-brand-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">3D Unit / Target Telemetry</span>
              <span className="px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/30 text-brand-accent font-mono text-[10px] font-bold">
                LIVE 3D
              </span>
            </div>

            {selectedEntity ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-brand-dark/90 rounded-xl border border-brand-border/40">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="truncate">{selectedEntity.name || selectedEntity.label || selectedEntity.id}</span>
                    <span className="text-brand-accent font-mono ml-2">{selectedEntity.id}</span>
                  </div>

                  <div className="mt-2.5 text-slate-400 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>TYPE:</span>
                      <span className="text-white font-bold">{selectedEntity.type || 'SURVEILLANCE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ZONE:</span>
                      <span className="text-white">{selectedEntity.zone || 'Sector 7'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className="text-brand-success font-bold">{selectedEntity.status || (selectedEntity.risk ? `${selectedEntity.risk} THREAT` : 'ACTIVE')}</span>
                    </div>

                    {selectedEntity.speed !== undefined && (
                      <div className="flex justify-between">
                        <span>SPEED:</span>
                        <span className="text-cyan-400 font-bold">{selectedEntity.speed} km/h</span>
                      </div>
                    )}

                    {selectedEntity.z !== undefined && (
                      <div className="flex justify-between">
                        <span>ALTITUDE:</span>
                        <span className="text-cyan-400 font-bold">{selectedEntity.z}m MSL</span>
                      </div>
                    )}

                    {selectedEntity.standoff !== undefined && (
                      <div className="flex justify-between">
                        <span>STANDOFF DIST:</span>
                        <span className="text-amber-400 font-bold">{selectedEntity.standoff} meters</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Jump to Camera Feed Action */}
                {selectedEntity.fov ? (
                  <button
                    onClick={() => onSelectCamera && onSelectCamera(selectedEntity.id)}
                    className="w-full py-2 bg-gradient-to-r from-brand-accent/20 to-brand-accent2/20 border border-brand-accent/50 text-brand-accent rounded-lg font-bold text-xs hover:from-brand-accent/30 hover:to-brand-accent2/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                  >
                    <Eye className="w-4 h-4" /> Jump to 4K Live Camera
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playBeep(1200, 0.08);
                      alert(`[TACTICAL COMMAND] Deploying QRT Intercept Vector to ${selectedEntity.label || selectedEntity.id}`);
                    }}
                    className="w-full py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-bold text-xs hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <ShieldAlert className="w-4 h-4" /> Dispatch QRT Intercept
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Select any camera cone, UAV, or threat blip in 3D space to inspect telemetry.
              </div>
            )}
          </div>

          {/* 2. Defensive Standoff & Safe Buffer Monitor */}
          <div className="glass-card p-4 space-y-3 border border-brand-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perimeter Defense Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-brand-dark/60 rounded-lg border border-brand-border/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="font-bold text-white">Safe Green Corridor</div>
                    <div className="text-[10px] text-slate-400">Entry Gate & Main Lane</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">SECURE</span>
              </div>

              <div className="p-2.5 bg-brand-dark/60 rounded-lg border border-brand-border/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <div>
                    <div className="font-bold text-white">Delta Sector Fence</div>
                    <div className="text-[10px] text-slate-400">Intrusion Tracked (<span className="text-red-400 font-bold">{standoffDist}m</span>)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono text-[10px] font-bold">BREACH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
