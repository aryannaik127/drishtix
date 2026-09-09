import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX,
  Sparkles, CheckCircle2, Video, Download, Lock
} from 'lucide-react';

const DEMO_SCENES = [
  {
    id: 'live_grid',
    tab: 'live',
    title: '1. Multi-Camera Edge AI Surveillance Grid',
    badge: 'YOLOv8 + ByteTrack',
    duration: 12,
    script: 'Welcome to DRISHTIX Tactical Command. The Live Grid continuously processes four simultaneous camera feeds at thirty frames per second. Edge AI performs real-time bounding box detection, classifying persons, vehicles, and aerial drones with unique tracking IDs.',
    features: [
      '4-Camera Simultaneous Edge AI Inference',
      'YOLOv8 Person, Vehicle & Drone Classification',
      'ByteTrack Unique Persistent Track IDs',
      'Multi-Spectral Vision (Optical, FLIR Thermal, Night-Vision)'
    ],
    camId: 'ALL'
  },
  {
    id: 'virtual_fence',
    tab: 'fence',
    title: '2. Virtual Fence & Polygon Perimeter Alarm',
    badge: 'Zero False Alarms',
    duration: 11,
    script: 'Our Virtual Fence subsystem enables tactical commanders to calibrate custom polygon geofences and tripwires. When an unauthorized vector crosses the designated boundary, the platform instantly triggers high-priority audio-visual strobe alarms and logs the intrusion.',
    features: [
      'Custom Polygon Perimeter Calibration',
      'Directional Line-Crossing Detection',
      'Sub-20ms Audio-Visual Strobe Trigger',
      'Zero Nuisance Alarm AI Filtering'
    ],
    camId: 'CAM-01'
  },
  {
    id: 'anpr_hub',
    tab: 'anpr',
    title: '3. ANPR Intelligence & Stolen Vehicle Hotlist',
    badge: '98.4% OCR Confidence',
    duration: 11,
    script: 'The Automated Number Plate Recognition Hub scans vehicle license plates at border checkpoints. It achieves over ninety-eight percent OCR confidence and immediately cross-references detected plates against the National Stolen Vehicle and Wanted Watchlist.',
    features: [
      'High-Speed Optical Character Recognition',
      'Instant National Hotlist Cross-referencing',
      'Gate Lockdown & Speed Telemetry Radar',
      'Cryptographic Vehicle Passage Audit Trail'
    ],
    camId: 'CAM-03'
  },
  {
    id: 'gis_radar',
    tab: 'map',
    title: '4. Tactical GIS Radar Map & Sensor Fusion',
    badge: '360° Geospatial Radar',
    duration: 11,
    script: 'The Tactical Sensor Map fuses GPS telemetry, continuous three-sixty radar sweeps, and live camera field-of-view cones to provide real-time situational awareness and track hostile movement across border sectors.',
    features: [
      '360° Sweeping Geospatial Radar',
      'Live Dynamic Camera Field-of-View Cones',
      'GPS Asset & Quick Reaction Team Tracking',
      'Hostile Vector Trajectory Prediction'
    ],
    camId: 'MAP'
  },
  {
    id: 'incident_sop',
    tab: 'incident',
    title: '5. Quick Reaction Team Dispatch & SOP Engine',
    badge: 'Automated SOP',
    duration: 10,
    script: 'When an emergency is validated, commanders can dispatch Quick Reaction Teams with a single click. The platform automatically tracks and enforces Standard Operating Procedure checklists in real time.',
    features: [
      'One-Click Quick Reaction Team Deployment',
      'Automated Standard Operating Procedure Checklist',
      'Tactical Radio Channel Coordination',
      'Chain-of-Command Dispatch Logging'
    ],
    camId: 'INCIDENT'
  },
  {
    id: 'evidence_vault',
    tab: 'evidence',
    title: '6. Cryptographic Forensic Evidence Vault',
    badge: 'SHA-256 Tamper-Proof',
    duration: 10,
    script: 'Every detected breach, snapshot, and video clip is cryptographically hashed with SHA-256 in the Evidence Vault. This guarantees a tamper-proof chain of custody suitable for forensic investigation and official audit.',
    features: [
      'SHA-256 Cryptographic Hash Sealing',
      'Tamper-Proof Immutable Chain of Custody',
      'High-Resolution Snapshot & Telemetry Archive',
      'Court-Admissible Legal Audit Reports'
    ],
    camId: 'VAULT'
  },
  {
    id: 'threat_analytics',
    tab: 'analytics',
    title: '7. Tactical Analytics & Threat Heatmaps',
    badge: 'Decision Intelligence',
    duration: 9,
    script: 'The Analytics dashboard visualizes hourly threat distributions, classification accuracy, and security metrics, eliminating false alarms and operator fatigue.',
    features: [
      '24-Hour Threat Distribution Heatmap',
      'Real-Time Precision & Recall Telemetry',
      'Operator Workload Optimization',
      'Multi-Sector Security Health Index'
    ],
    camId: 'ANALYTICS'
  }
];

// AI Generated Surveillance Image Feeds
const camImages = {};
if (typeof window !== 'undefined') {
  ['cam1', 'cam2', 'cam3', 'cam4'].forEach((id, idx) => {
    const img = new Image();
    img.src = `/cameras/${id}.jpg`;
    camImages[`CAM-0${idx + 1}`] = img;
  });
}

export function TacticalDemoPlayer({ onSelectTab, onNavigateTab }) {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [syncWithTabs, setSyncWithTabs] = useState(true);
  const [activeMode, setActiveMode] = useState('CINEMA');
  const [progressSec, setProgressSec] = useState(0);

  const canvasRef = useRef(null);
  const synthRef = useRef(null);
  const timerRef = useRef(null);

  const currentScene = DEMO_SCENES[currentSceneIdx];

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speakScene = (scene) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(scene.script);
    utterance.rate = 0.95 * playbackSpeed;
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('George')));
    if (engVoice) utterance.voice = engVoice;

    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    setProgressSec(0);
    if (isPlaying) {
      speakScene(currentScene);
    }
    if (syncWithTabs && onNavigateTab) {
      onNavigateTab(currentScene.tab);
    }
  }, [currentSceneIdx]);

  useEffect(() => {
    if (!synthRef.current) return;
    if (isPlaying) {
      speakScene(currentScene);
    } else {
      synthRef.current.cancel();
    }
  }, [isPlaying, isMuted, playbackSpeed]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 100;
    timerRef.current = setInterval(() => {
      setProgressSec(prev => {
        const next = prev + (0.1 * playbackSpeed);
        if (next >= currentScene.duration) {
          if (currentSceneIdx < DEMO_SCENES.length - 1) {
            setCurrentSceneIdx(c => c + 1);
          } else {
            setCurrentSceneIdx(0);
          }
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentSceneIdx, playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      renderDemoSceneVisual(ctx, w, h, frame, currentSceneIdx, currentScene);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentSceneIdx]);

  const handleNext = () => {
    if (currentSceneIdx < DEMO_SCENES.length - 1) {
      setCurrentSceneIdx(c => c + 1);
    } else {
      setCurrentSceneIdx(0);
    }
  };

  const handlePrev = () => {
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx(c => c - 1);
    }
  };

  const handleRestart = () => {
    setCurrentSceneIdx(0);
    setProgressSec(0);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher Banner */}
      <div className="flex items-center justify-between bg-brand-card/80 border border-brand-border/40 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('CINEMA')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'CINEMA'
                ? 'bg-brand-accent text-brand-dark shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-brand-dark'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive AI Demonstration</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('MP4');
              if (synthRef.current) synthRef.current.cancel();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'MP4'
                ? 'bg-brand-accent text-brand-dark shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-brand-dark'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Direct MP4 Video</span>
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
          <input
            type="checkbox"
            checked={syncWithTabs}
            onChange={e => setSyncWithTabs(e.target.checked)}
            className="rounded border-brand-border/40 text-brand-accent focus:ring-0 bg-brand-dark"
          />
          <span>Auto-Switch Dashboard Tabs</span>
        </label>
      </div>

      {activeMode === 'CINEMA' ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-brand-accent/40 bg-black aspect-video shadow-[0_0_30px_rgba(0,212,255,0.15)] group">
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-cover block"
            />

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-brand-accent/40 px-3 py-1.5 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-white tracking-wider">PROJECT DRISHTIX TACTICAL SHOWCASE</span>
                <span className="text-[10px] font-mono text-brand-accent font-bold px-1.5 py-0.5 rounded bg-brand-accent/15 border border-brand-accent/30">
                  {currentScene.badge}
                </span>
              </div>

              <div className="bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                SCENE {currentSceneIdx + 1} / {DEMO_SCENES.length}
              </div>
            </div>

            <div className="absolute bottom-14 left-4 right-4 bg-black/85 backdrop-blur-md border border-brand-border/50 rounded-xl p-3 shadow-2xl">
              <p className="text-xs md:text-sm text-slate-100 font-medium leading-relaxed">
                "{currentScene.script}"
              </p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-6 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 w-10">
                  {Math.floor(progressSec)}s
                </span>
                <div
                  className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    setProgressSec(ratio * currentScene.duration);
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-brand-accent to-brand-accent2 rounded-full transition-all"
                    style={{ width: `${(progressSec / currentScene.duration) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                  {currentScene.duration}s
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg bg-brand-accent text-brand-dark font-bold hover:bg-brand-accent/90 transition-all shadow-md"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={handlePrev}
                    disabled={currentSceneIdx === 0}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleRestart}
                    title="Restart Demo"
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg border transition-all ${
                      isMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-brand-accent border-brand-accent/30'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  {[1.0, 1.25, 1.5].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        playbackSpeed === spd ? 'bg-brand-accent text-brand-dark' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DEMO_SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setCurrentSceneIdx(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentSceneIdx === idx
                    ? 'bg-brand-accent/15 border-brand-accent shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                    : 'bg-brand-card/60 border-brand-border/30 hover:border-brand-border/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="text-[10px] font-mono text-brand-accent font-bold">SCENE {idx + 1}</div>
                <div className="text-xs font-bold text-white truncate mt-0.5">{scene.title.split('. ')[1]}</div>
              </button>
            ))}
          </div>

          <div className="bg-brand-card/80 border border-brand-border/40 rounded-xl p-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Scene Technical Capabilities: {currentScene.title}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentScene.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 bg-brand-dark/80 border border-brand-border/20 rounded-lg px-3 py-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-brand-border/50 bg-black aspect-video flex items-center justify-center shadow-2xl">
            <video
              controls
              autoPlay
              playsInline
              src="/drishtix_prototype_demo.mp4"
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video.
            </video>
          </div>

          <div className="flex items-center justify-between bg-brand-card/80 border border-brand-border/30 rounded-xl p-4">
            <div>
              <h4 className="text-sm font-bold text-white">Full HD Prototype Demonstration Video (MP4)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Resolution: 1920x1080 • 30 FPS • 9 Complete Tactical Demonstration Chapters
              </p>
            </div>
            <a
              href="/drishtix_prototype_demo.mp4"
              download="DRISHTIX_Prototype_Demo.mp4"
              className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-dark px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.25)]"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DYNAMIC VISUAL SCENE DRAWING ON CANVAS ───
function renderDemoSceneVisual(ctx, w, h, frame, sceneIdx, scene) {
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, w, h);

  if (sceneIdx === 0) {
    // ─── SCENE 1: 2x2 MULTI-CAMERA LIVE SURVEILLANCE GRID ───
    const halfW = w / 2;
    const halfH = h / 2;

    const cams = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'];
    cams.forEach((camId, idx) => {
      const gx = (idx % 2) * halfW;
      const gy = Math.floor(idx / 2) * halfH;

      ctx.save();
      ctx.beginPath();
      ctx.rect(gx, gy, halfW, halfH);
      ctx.clip();

      const img = camImages[camId];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, gx, gy, halfW, halfH);
      } else {
        ctx.fillStyle = idx === 3 ? '#150826' : idx === 1 ? '#08140c' : '#0c1420';
        ctx.fillRect(gx, gy, halfW, halfH);
      }

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, halfW, halfH);

      // Camera Tag
      ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      ctx.fillRect(gx + 8, gy + 8, 120, 22);
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`${camId} LIVE`, gx + 14, gy + 22);

      ctx.restore();
    });
  } else if (sceneIdx === 1) {
    // ─── SCENE 2: VIRTUAL FENCE TRIPWIRE PERIMETER BREACH ───
    const img1 = camImages['CAM-01'];
    if (img1 && img1.complete && img1.naturalWidth > 0) {
      ctx.drawImage(img1, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, w, h);
    }

    // Static Glowing Neon Virtual Fence Polygon
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.75);
    ctx.lineTo(w * 0.55, h * 0.5);
    ctx.lineTo(w * 0.88, h * 0.42);
    ctx.stroke();
    ctx.setLineDash([]);

    // Strobe Alert Banner
    const alpha = Math.abs(Math.sin(frame * 0.15)) * 0.6 + 0.3;
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.fillRect(w * 0.25, 20, w * 0.5, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🚨 HIGH PRIORITY: VIRTUAL FENCE BREACH DETECTED', w / 2, 42);
    ctx.textAlign = 'left';
  } else if (sceneIdx === 2) {
    // ─── SCENE 3: HIGH-SPEED ANPR OCR SCANNER ───
    const img3 = camImages['CAM-03'];
    if (img3 && img3.complete && img3.naturalWidth > 0) {
      ctx.drawImage(img3, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0b111a';
      ctx.fillRect(0, 0, w, h);
    }

    // Static License Plate Scanner Reticle
    const plateX = w * 0.46;
    const plateY = h * 0.52;
    const plateW = 140;
    const plateH = 70;

    ctx.strokeStyle = '#00ffc8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(plateX, plateY, plateW, plateH);

    // Hotlist Alert Box
    ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
    ctx.fillRect(w * 0.32, h * 0.68, w * 0.36, 56);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(w * 0.32, h * 0.68, w * 0.36, 56);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText('🔴 HOTLIST MATCH: AE71 SVR', w * 0.34, h * 0.68 + 22);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('FLAG: SUSPICIOUS BORDER LOITERING | CONF: 99.4%', w * 0.34, h * 0.68 + 42);
  } else if (sceneIdx === 3) {
    // ─── SCENE 4: 360° TACTICAL GIS RADAR MAP ───
    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.42;

    [0.25, 0.5, 0.75, 1.0].forEach(ratio => {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.stroke();

    const angle = (frame * 0.04) % (Math.PI * 2);
    const grad = ctx.createConicGradient(angle - Math.PI / 2, cx, cy);
    grad.addColorStop(0, 'rgba(0, 255, 180, 0.4)');
    grad.addColorStop(0.15, 'rgba(0, 255, 180, 0.0)');
    grad.addColorStop(1, 'rgba(0, 255, 180, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();

    const blips = [
      { x: cx + maxR * 0.4, y: cy - maxR * 0.3, label: 'CAM-01 FOV', color: '#00d4ff' },
      { x: cx - maxR * 0.5, y: cy + maxR * 0.2, label: 'QRT-ALPHA', color: '#10b981' },
      { x: cx + maxR * 0.6, y: cy + maxR * 0.5, label: 'TARGET #09 (HOSTILE)', color: '#ef4444' }
    ];

    blips.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(b.label, b.x + 10, b.y + 3);
    });
  } else {
    // ─── SCENE 5, 6, 7: COMMAND CENTER, EVIDENCE VAULT & ANALYTICS ───
    const bgCam = camImages['CAM-04'];
    if (bgCam && bgCam.complete && bgCam.naturalWidth > 0) {
      ctx.drawImage(bgCam, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#08101e';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = 'rgba(10, 18, 30, 0.88)';
    ctx.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);

    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 16px JetBrains Mono, monospace';
    ctx.fillText(`DRISHTIX // ${scene.title.toUpperCase()}`, w * 0.18, h * 0.25);

    scene.features.forEach((feat, i) => {
      ctx.fillStyle = '#10b981';
      ctx.fillText('✔', w * 0.18, h * 0.35 + i * 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText(feat, w * 0.22, h * 0.35 + i * 36);
    });
  }
}

function drawBox(ctx, x, y, w, h, color, label, isAlert = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = isAlert ? 2.5 : 1.8;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.fillRect(x, y - 16, Math.max(ctx.measureText(label).width + 10, 70), 16);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillText(label, x + 4, y - 4);
}
