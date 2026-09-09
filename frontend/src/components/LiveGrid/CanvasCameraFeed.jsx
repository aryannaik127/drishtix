import React, { useRef, useEffect } from 'react';

/**
 * CanvasCameraFeed — High-Resolution AI Surveillance Camera Display
 *
 * Renders pure photorealistic AI generated camera imagery with clean military tactical HUD.
 * Zero moving artificial entities — clean, stable, high-definition surveillance feeds.
 */

const CAMERA_CONFIGS = {
  'CAM-01': {
    imageSrc: '/cameras/cam1.jpg',
    name: 'NORTH SECTOR - ALPHA RIDGE',
    type: 'OPTICAL 4K PTZ',
    coords: '32.7266° N, 74.8570° E',
    azimuth: 'AZ: 042° NE',
    defaultLens: 'f/5.6 1/1600 ISO 320',
    defaultMode: 'OPTICAL',
  },
  'CAM-02': {
    imageSrc: '/cameras/cam2.jpg',
    name: 'BRAVO CHECKPOINT - MAIN GATE',
    type: 'NIGHT-VISION PHOSPHOR',
    coords: '32.7291° N, 74.8612° E',
    azimuth: 'AZ: 178° S',
    defaultLens: 'f/2.8 1/250 ISO 1600',
    defaultMode: 'NIGHT_VISION',
  },
  'CAM-03': {
    imageSrc: '/cameras/cam3.jpg',
    name: 'ENTRY LANE 01 - ANPR OPTICAL',
    type: 'ANPR HIGH-SPEED ZOOM',
    coords: '32.7315° N, 74.8654° E',
    azimuth: 'AZ: 215° SW',
    defaultLens: 'f/4.0 1/2000 ISO 400',
    defaultMode: 'OPTICAL',
  },
  'CAM-04': {
    imageSrc: '/cameras/cam4.jpg',
    name: 'RESTRICTED DELTA - THERMAL FENCE',
    type: 'FLIR IRONBOW THERMAL',
    coords: '32.7350° N, 74.8701° E',
    azimuth: 'AZ: 284° NW',
    defaultLens: 'FLIR 30Hz LWIR 8-14μm',
    defaultMode: 'THERMAL',
  },
};

// Global background image cache
const imageCache = {};

function getCameraImage(src) {
  if (!src) return null;
  if (!imageCache[src]) {
    const img = new Image();
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

// Preload on module load
if (typeof window !== 'undefined') {
  ['/cameras/cam1.jpg', '/cameras/cam2.jpg', '/cameras/cam3.jpg', '/cameras/cam4.jpg'].forEach(getCameraImage);
}

// ─── EXPORT COMPONENT ──────────────────────────────────────────────────────────
export const CanvasCameraFeed = ({
  cameraId = 'CAM-01',
  visionMode: propVisionMode,
  isTriggered = false,
  ptzPan = 0,
  ptzTilt = 0,
  ptzZoom = 1.0,
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  const config = CAMERA_CONFIGS[cameraId] || CAMERA_CONFIGS['CAM-01'];
  const visionMode = propVisionMode || config.defaultMode;

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const bgImg = getCameraImage(config.imageSrc);

    const render = () => {
      const f = ++frameRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // ── LAYER 0: Pure AI Generated Camera Image ───────────────────────────
      ctx.save();
      ctx.translate(W / 2 + ptzPan, H / 2 + ptzTilt);
      ctx.scale(ptzZoom, ptzZoom);
      ctx.translate(-W / 2, -H / 2);

      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore(); // end PTZ transform

      // ── LAYER 1: Sensor Vision Shader Overlay ─────────────────────────────
      applyVisionShader(ctx, W, H, visionMode, f);

      // ── LAYER 2: Static Tactical Reticles / Tripwires ─────────────────────
      renderStaticDetectionGrid(ctx, W, H, cameraId, isTriggered, f);

      // ── LAYER 3: Military Tactical HUD Overlay ────────────────────────────
      renderTacticalHUD(ctx, W, H, f, cameraId, config, visionMode, isTriggered, ptzPan, ptzTilt, ptzZoom);

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [cameraId, visionMode, isTriggered, ptzPan, ptzTilt, ptzZoom, config]);

  return (
    <div className="relative w-full h-full bg-[#060810] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="absolute inset-0 w-full h-full object-cover block"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  STATIC SENSOR OVERLAYS (NO MOVING OBJECTS)
// ══════════════════════════════════════════════════════════════════════════════

function renderStaticDetectionGrid(ctx, W, H, cameraId, isTriggered, f) {
  if (cameraId === 'CAM-01') {
    // Static calibrated perimeter tripwire boundary
    ctx.strokeStyle = isTriggered ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 212, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(W * 0.15, H * 0.82);
    ctx.lineTo(W * 0.52, H * 0.58);
    ctx.lineTo(W * 0.86, H * 0.36);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isTriggered) {
      drawTacticalBBox(ctx, W * 0.48 - 35, H * 0.56 - 45, 70, 90, '#ef4444', 'TRIPWIRE BREACH [98.6%]', true);
    }
  } else if (cameraId === 'CAM-02') {
    // Static checkpoint inspection zone boundary
    ctx.strokeStyle = isTriggered ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(W * 0.32, H * 0.48, W * 0.38, H * 0.36);

    if (isTriggered) {
      drawTacticalBBox(ctx, W * 0.35, H * 0.50, 120, 80, '#ef4444', 'ALERT: UNAUTHORIZED STOP', true);
    }
  } else if (cameraId === 'CAM-03') {
    // Static ANPR optical capture reticle on inspection lane
    ctx.strokeStyle = isTriggered ? 'rgba(239, 68, 68, 0.90)' : 'rgba(0, 255, 200, 0.65)';
    ctx.lineWidth = 1.5;
    const rx = W * 0.38;
    const ry = H * 0.44;
    const rw = W * 0.24;
    const rh = H * 0.26;
    ctx.strokeRect(rx, ry, rw, rh);

    // Corner guides
    const cl = 12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rx, ry + cl); ctx.lineTo(rx, ry); ctx.lineTo(rx + cl, ry);
    ctx.moveTo(rx + rw - cl, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cl);
    ctx.moveTo(rx + rw, ry + rh - cl); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw - cl, ry + rh);
    ctx.moveTo(rx + cl, ry + rh); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx, ry + rh - cl);
    ctx.stroke();
  } else if (cameraId === 'CAM-04') {
    // Static FLIR center crosshair reticle
    const cx = W * 0.50;
    const cy = H * 0.50;
    ctx.strokeStyle = isTriggered ? 'rgba(239, 68, 68, 0.90)' : 'rgba(255, 220, 0, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24);
    ctx.stroke();

    if (isTriggered) {
      drawTacticalBBox(ctx, cx - 45, cy - 40, 90, 80, '#ef4444', 'THERMAL SPIKE: 38.4°C', true);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  VISION SHADERS
// ══════════════════════════════════════════════════════════════════════════════

function applyVisionShader(ctx, W, H, mode, f) {
  if (mode === 'NIGHT_VISION') {
    // Subtle night vision scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0, 20, 5, 0.40)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  } else if (mode === 'THERMAL') {
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.80);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(25, 0, 20, 0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  } else {
    // Optical subtle vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.40, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  TACTICAL BOUNDING BOX UTILITY
// ══════════════════════════════════════════════════════════════════════════════

function drawTacticalBBox(ctx, x, y, w, h, color, label, isAlert = false) {
  if (w < 2 || h < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = isAlert ? 2.0 : 1.5;

  const cL = Math.min(10, w / 3, h / 3);
  ctx.beginPath();
  ctx.moveTo(x, y + cL); ctx.lineTo(x, y); ctx.lineTo(x + cL, y);
  ctx.moveTo(x + w - cL, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cL);
  ctx.moveTo(x + w, y + h - cL); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - cL, y + h);
  ctx.moveTo(x + cL, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - cL);
  ctx.stroke();

  ctx.strokeStyle = isAlert ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x, y, w, h);

  const textWidth = Math.max(ctx.measureText(label).width + 10, 50);
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 14, textWidth, 14);
  ctx.fillStyle = '#030508';
  ctx.font = 'bold 8px JetBrains Mono, monospace';
  ctx.fillText(label, x + 3, y - 3);
}

// ══════════════════════════════════════════════════════════════════════════════
//  MILITARY TACTICAL HUD OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

function renderTacticalHUD(ctx, W, H, f, camId, config, mode, triggered, pan, tilt, zoom) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(Math.floor(now.getMilliseconds() / 100)).padStart(2, '0');
  const dateStr = now.toISOString().split('T')[0];

  // Top-left info panel
  ctx.fillStyle = 'rgba(5, 8, 18, 0.88)';
  ctx.fillRect(8, 8, 230, 40);
  ctx.strokeStyle = triggered ? '#ef4444' : '#00d4ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 230, 40);
  ctx.fillStyle = triggered ? '#ef4444' : '#00d4ff';
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.fillText(`${camId} // ${config.name}`, 14, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillText(`LOC: ${config.coords}`, 14, 33);
  ctx.fillText(`MODE: ${mode} | ${config.defaultLens}`, 14, 43);

  // Top-right timestamp panel
  ctx.fillStyle = 'rgba(5, 8, 18, 0.88)';
  ctx.fillRect(W - 185, 8, 177, 40);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 185, 8, 177, 40);
  const blink = Math.floor(f / 20) % 2 === 0;
  ctx.fillStyle = blink ? '#ef4444' : 'rgba(239,68,68,0.3)';
  ctx.beginPath();
  ctx.arc(W - 173, 22, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9.5px JetBrains Mono, monospace';
  ctx.fillText(`LIVE  ${timeStr}`, W - 161, 25);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '7.5px JetBrains Mono, monospace';
  ctx.fillText(`DATE: ${dateStr}  UTC+5:30`, W - 173, 38);
  ctx.fillText(`TYPE: ${config.type}`, W - 173, 45);

  // Bottom-left telemetry
  ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
  ctx.fillRect(8, H - 24, 310, 16);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '8.5px JetBrains Mono, monospace';
  const fps = (29.8 + Math.sin(f * 0.05) * 0.2).toFixed(1);
  ctx.fillText(`FPS: ${fps} | LAT: 12ms | ${config.azimuth} | PTZ: ${pan},${tilt},${zoom.toFixed(1)}x`, 14, H - 11);

  // Bottom-right AI tag
  ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
  ctx.fillRect(W - 156, H - 24, 148, 16);
  ctx.fillStyle = '#10b981';
  ctx.font = '8.5px JetBrains Mono, monospace';
  ctx.fillText('YOLOv8 + BYTETRACK AI', W - 148, H - 11);

  // Center reticle crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  const cx = W / 2; const cy = H / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
  ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 14, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Blinking alert banner
  if (triggered) {
    const alpha = Math.abs(Math.sin(f * 0.12)) * 0.75 + 0.25;
    ctx.fillStyle = `rgba(220, 35, 35, ${alpha})`;
    ctx.fillRect(W * 0.20, 52, W * 0.60, 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠  TACTICAL INTRUSION ALERT DETECTED  ⚠', W / 2, 65);
    ctx.textAlign = 'left';
  }
}
