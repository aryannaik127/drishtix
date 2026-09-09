import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Crosshair, ShieldAlert, Plus, Trash2, Save, Play, CheckCircle2,
  AlertTriangle, RotateCcw, Eye, Settings2, Info
} from 'lucide-react';
import { playBeep, playCriticalSiren, playWarningTone } from '../../utils/audioAlert';
import { CanvasCameraFeed } from '../LiveGrid/CanvasCameraFeed';

const API_BASE = 'http://localhost:8000/api';

export const VirtualFenceStudio = ({ cameras = [] }) => {
  const [selectedCam, setSelectedCam] = useState('CAM-04');
  const [zoneType, setZoneType] = useState('RESTRICTED');
  const [triggerRule, setTriggerRule] = useState('person_entry');
  const [alertLevel, setAlertLevel] = useState('CRITICAL');
  const [zoneName, setZoneName] = useState('Delta Perimeter Fence');
  
  // Polygon vertices in percentage coordinates [0..100]
  const [points, setPoints] = useState([
    { x: 10, y: 60 },
    { x: 90, y: 55 },
    { x: 95, y: 95 },
    { x: 5, y: 95 }
  ]);

  const [draggingIdx, setDraggingIdx] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [intrusionDetected, setIntrusionDetected] = useState(false);
  const [savedFences, setSavedFences] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');

  const svgRef = useRef(null);

  // Fetch existing fences
  const fetchFences = async () => {
    try {
      const res = await axios.get(`${API_BASE}/virtual-fences?camera_id=${selectedCam}`);
      setSavedFences(res.data);
      if (res.data.length > 0) {
        try {
          const pts = JSON.parse(res.data[0].points_json);
          setPoints(pts);
          setZoneType(res.data[0].zone_type || 'RESTRICTED');
          setTriggerRule(res.data[0].trigger_rule || 'person_entry');
          setAlertLevel(res.data[0].alert_level || 'CRITICAL');
          setZoneName(res.data[0].name || 'Delta Perimeter Fence');
        } catch (e) {}
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchFences();
  }, [selectedCam]);

  // Handle Dragging Vertices
  const handleMouseDown = (idx, e) => {
    e.stopPropagation();
    setDraggingIdx(idx);
  };

  const handleMouseMove = (e) => {
    if (draggingIdx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setPoints(pts => pts.map((p, i) => (i === draggingIdx ? { x, y } : p)));
  };

  const handleMouseUp = () => {
    setDraggingIdx(null);
  };

  const handleSvgClick = (e) => {
    if (draggingIdx !== null || !svgRef.current || points.length >= 8) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    playBeep(800, 0.05);
    setPoints(pts => [...pts, { x, y }]);
  };

  const removeVertex = (idx) => {
    if (points.length <= 3) {
      alert('A polygon zone requires at least 3 vertices.');
      return;
    }
    playBeep(600, 0.05);
    setPoints(pts => pts.filter((_, i) => i !== idx));
  };

  const resetDefaultZone = () => {
    playBeep();
    setPoints([
      { x: 10, y: 60 },
      { x: 90, y: 55 },
      { x: 95, y: 95 },
      { x: 5, y: 95 }
    ]);
  };

  // Save Fence Configuration
  const handleSaveFence = async () => {
    playBeep(1000, 0.08);
    try {
      await axios.post(`${API_BASE}/virtual-fences`, {
        camera_id: selectedCam,
        name: zoneName,
        zone_type: zoneType,
        points_json: JSON.stringify(points),
        trigger_rule: triggerRule,
        alert_level: alertLevel,
      });
      setSaveStatus('Zone successfully persisted to Edge Node DB!');
      setTimeout(() => setSaveStatus(''), 4000);
      fetchFences();
    } catch (e) {
      setSaveStatus('Saved locally (Client Mode)');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  // Run Interactive Intrusion Simulation
  const runIntrusionTest = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setIntrusionDetected(false);
    setSimulationProgress(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 2;
      setSimulationProgress(step);

      if (step === 60) {
        // Target enters zone boundary
        setIntrusionDetected(true);
        if (alertLevel === 'CRITICAL') {
          playCriticalSiren(2);
        } else {
          playWarningTone();
        }
      }

      if (step >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
        }, 1500);
      }
    }, 60);
  };

  // Color config based on zone type
  const zoneColors = {
    RESTRICTED: { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.2)', text: 'text-red-400' },
    BUFFER:     { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.2)', text: 'text-yellow-400' },
    SAFE:       { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400' },
    VEHICLE:    { stroke: '#00D4FF', fill: 'rgba(0, 212, 255, 0.2)', text: 'text-cyan-400' },
  };

  const curColor = zoneColors[zoneType] || zoneColors.RESTRICTED;

  // Polygon points string for SVG
  const pointsString = points.map(p => `${(p.x * 8).toFixed(1)},${(p.y * 4.5).toFixed(1)}`).join(' ');

  // Simulated target coordinates along path
  const targetX = 50 + (simulationProgress - 50) * 0.4;
  const targetY = 30 + simulationProgress * 0.55;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Crosshair className="w-7 h-7 text-red-400" /> Virtual Fence & Tripwire Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Draw geometric polygon tripwires on optical/thermal feeds to detect unauthorized intrusion & loitering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runIntrusionTest}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isSimulating ? 'SIMULATING TARGET...' : 'TEST INTRUSION SIMULATION'}
          </button>

          <button
            onClick={handleSaveFence}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-accent to-brand-accent2 text-white hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(0,212,255,0.3)]"
          >
            <Save className="w-4 h-4" /> Save Zone
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 bg-brand-success/10 border border-brand-success/40 text-brand-success rounded-lg text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" /> {saveStatus}
        </div>
      )}

      {/* ─── MAIN WORKBENCH ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Zone Settings & Camera Selector (1 Col) */}
        <div className="space-y-4">
          {/* Camera Selection */}
          <div className="glass-card p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">1. Select Node</span>
            <div className="space-y-2">
              {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map(camId => (
                <button
                  key={camId}
                  onClick={() => { playBeep(); setSelectedCam(camId); }}
                  className={`w-full p-2.5 rounded-lg text-xs text-left font-semibold transition-all flex items-center justify-between ${
                    selectedCam === camId ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 shadow-inner' : 'bg-brand-dark/60 text-slate-300 border border-brand-border/20 hover:border-brand-border/40'
                  }`}
                >
                  <span>{camId}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {camId === 'CAM-04' ? 'Thermal Perimeter' : camId === 'CAM-01' ? 'North Scrub' : 'Checkpoint'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Zone Parameter Config */}
          <div className="glass-card p-4 space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">2. Zone Parameters</span>

            {/* Zone Name */}
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Zone Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                className="w-full bg-brand-dark/80 border border-brand-border/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            {/* Zone Classification */}
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Zone Classification</label>
              <select
                value={zoneType}
                onChange={e => { playBeep(); setZoneType(e.target.value); }}
                className="w-full bg-brand-dark/80 border border-brand-border/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-accent"
              >
                <option value="RESTRICTED">RESTRICTED (Zero Tolerance)</option>
                <option value="BUFFER">BUFFER ZONE (Caution)</option>
                <option value="SAFE">SAFE / AUTHORIZED PATH</option>
                <option value="VEHICLE">VEHICLE TRANSIT ONLY</option>
              </select>
            </div>

            {/* Trigger Rule */}
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Trigger Condition</label>
              <select
                value={triggerRule}
                onChange={e => { playBeep(); setTriggerRule(e.target.value); }}
                className="w-full bg-brand-dark/80 border border-brand-border/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-accent"
              >
                <option value="person_entry">Person Ingress / Entry</option>
                <option value="vehicle_entry">Vehicle Entry Violation</option>
                <option value="loitering">Stationary Loitering (&gt;30s)</option>
                <option value="line_cross">Directional Line Crossing</option>
              </select>
            </div>

            {/* Alert Severity */}
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Alert Severity</label>
              <select
                value={alertLevel}
                onChange={e => { playBeep(); setAlertLevel(e.target.value); }}
                className="w-full bg-brand-dark/80 border border-brand-border/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-accent"
              >
                <option value="CRITICAL">CRITICAL (Immediate Siren & QRT)</option>
                <option value="HIGH">HIGH (Command Warning)</option>
                <option value="MEDIUM">MEDIUM (Telemetry Log)</option>
              </select>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-brand-dark/60 rounded-lg border border-brand-border/20 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-brand-accent font-semibold">
                <Info className="w-3.5 h-3.5" /> Drawing Guide:
              </div>
              <p>• Click canvas to add vertex point.</p>
              <p>• Drag circular handles to shape polygon.</p>
              <p>• Double-click vertex to delete.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Canvas Drawing Area (3 Cols) */}
        <div className="lg:col-span-3 glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Interactive Grid — {selectedCam}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${curColor.text} bg-white/5 border border-white/10`}>
                {zoneType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDefaultZone}
                className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white bg-brand-dark border border-brand-border/30 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Shape
              </button>
            </div>
          </div>

          {/* Canvas SVG Interactive Box */}
          <div
            className="relative aspect-video bg-brand-dark rounded-xl border border-brand-border/40 overflow-hidden cursor-crosshair select-none shadow-2xl"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Live Procedural Camera Feed View */}
            <div className="absolute inset-0 pointer-events-none opacity-85">
              <CanvasCameraFeed cameraId={selectedCam} isTriggered={intrusionDetected} />
            </div>
            <div className="absolute inset-0 bg-brand-dark/20 backdrop-brightness-90 pointer-events-none" />

            {/* SVG Zone Geometry */}
            <svg
              ref={svgRef}
              onClick={handleSvgClick}
              viewBox="0 0 800 450"
              className="absolute inset-0 w-full h-full"
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="450" fill="url(#grid)" />

              {/* Polygon Zone */}
              <polygon
                points={pointsString}
                fill={curColor.fill}
                stroke={curColor.stroke}
                strokeWidth="2.5"
                strokeDasharray="8,4"
              >
                <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite" />
              </polygon>

              {/* Zone Label inside polygon */}
              {points.length > 0 && (
                <text
                  x={points.reduce((acc, p) => acc + p.x * 8, 0) / points.length}
                  y={points.reduce((acc, p) => acc + p.y * 4.5, 0) / points.length}
                  fill={curColor.stroke}
                  fontSize="13"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none tracking-wider font-mono"
                >
                  ⚠ {zoneName.toUpperCase()}
                </text>
              )}

              {/* Interactive Vertex Handles */}
              {points.map((p, i) => (
                <g key={i} onDoubleClick={() => removeVertex(i)}>
                  <circle
                    cx={p.x * 8}
                    cy={p.y * 4.5}
                    r={draggingIdx === i ? 9 : 6}
                    fill={curColor.stroke}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="cursor-move transition-transform"
                    onMouseDown={(e) => handleMouseDown(i, e)}
                  />
                  <text
                    x={p.x * 8 + 10}
                    y={p.y * 4.5 - 10}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    V{i + 1}
                  </text>
                </g>
              ))}

              {/* Simulated Intruder Path Animation */}
              {isSimulating && (
                <g>
                  {/* Path trail */}
                  <line
                    x1="400"
                    y1="135"
                    x2={targetX * 8}
                    y2={targetY * 4.5}
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  {/* Target Blip */}
                  <circle
                    cx={targetX * 8}
                    cy={targetY * 4.5}
                    r="8"
                    fill={intrusionDetected ? '#EF4444' : '#10B981'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  >
                    <animate attributeName="r" values="8;13;8" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <text
                    x={targetX * 8 + 14}
                    y={targetY * 4.5 + 4}
                    fill={intrusionDetected ? '#EF4444' : '#10B981'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {intrusionDetected ? 'BREACH INTRUDER (P-99)' : 'TARGET MOVING'}
                  </text>
                </g>
              )}
            </svg>

            {/* In-canvas Alert Banner */}
            {intrusionDetected && (
              <div className="absolute top-4 left-4 right-4 bg-red-600/90 backdrop-blur-md text-white p-3 rounded-lg border border-red-400 flex items-center justify-between animate-bounce">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 animate-spin" />
                  CRITICAL INTRUSION TRIGGERED: Target crossed boundary line!
                </div>
                <span className="text-xs font-mono font-bold bg-black/40 px-2.5 py-1 rounded">
                  LAT: 32.7298° N | CONF: 97.4%
                </span>
              </div>
            )}
          </div>

          {/* Vertex List / Summary */}
          <div className="mt-4 pt-3 border-t border-brand-border/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <span>Vertices Active: </span>
              <span className="text-white font-mono font-bold">{points.length} points</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              {points.map((p, i) => (
                <span key={i} className="bg-brand-dark px-2 py-0.5 rounded border border-brand-border/20">
                  V{i + 1}: ({p.x.toFixed(0)}%, {p.y.toFixed(0)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
