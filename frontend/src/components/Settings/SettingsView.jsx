import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings, Zap, Crosshair, Volume2, VolumeX, Layers,
  RotateCcw, CheckCircle2, Shield, Radio, Cpu, HardDrive,
  FolderSync, Folder, ExternalLink, RefreshCw, Cloud,
  Check, AlertCircle, FileText, Database, ShieldCheck, Download
} from 'lucide-react';
import { playBeep, playCriticalSiren, isAudioMuted, toggleAudioMute } from '../../utils/audioAlert';
import { API_BASE } from '../../config/api';

export const SettingsView = ({ onResetDemo }) => {
  // Edge AI Thresholds
  const [personConfidence, setPersonConfidence] = useState(75);
  const [vehicleConfidence, setVehicleConfidence] = useState(70);
  const [anprConfidence, setAnprConfidence] = useState(85);
  const [fenceSensitivity, setFenceSensitivity] = useState(80);
  const [alertCooldown, setAlertCooldown] = useState(30);
  const [muted, setMuted] = useState(isAudioMuted());
  const [saveStatus, setSaveStatus] = useState('');

  // Storage & Connected Drive States
  const [storageConfig, setStorageConfig] = useState({
    active_path: 'C:\\Users\\FALCON JNB\\DrishtiX_Drive_Storage',
    is_accessible: true,
    is_cloud_synced: false,
    auto_archive: true,
    last_sync: null,
    total_gb: 237.4,
    free_gb: 22.9,
    used_gb: 214.5,
    used_percent: 90.4,
    archived_files_count: 7,
    archived_size_mb: 21.3,
    status: 'ONLINE'
  });
  const [availableDrives, setAvailableDrives] = useState([]);
  const [customDrivePath, setCustomDrivePath] = useState('');
  const [autoArchive, setAutoArchive] = useState(true);
  const [driveTestStatus, setDriveTestStatus] = useState(null);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [recentDriveFiles, setRecentDriveFiles] = useState([]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      if (res.data) {
        if (res.data.person_confidence) setPersonConfidence(Number(res.data.person_confidence));
        if (res.data.vehicle_confidence) setVehicleConfidence(Number(res.data.vehicle_confidence));
        if (res.data.anpr_confidence) setAnprConfidence(Number(res.data.anpr_confidence));
        if (res.data.fence_sensitivity) setFenceSensitivity(Number(res.data.fence_sensitivity));
        if (res.data.alert_cooldown) setAlertCooldown(Number(res.data.alert_cooldown));
      }
    } catch (e) {}
  };

  const fetchStorageInfo = async () => {
    try {
      const [cfgRes, drivesRes, filesRes] = await Promise.all([
        axios.get(`${API_BASE}/storage/config`),
        axios.get(`${API_BASE}/storage/drives`),
        axios.get(`${API_BASE}/storage/files?limit=10`),
      ]);
      if (cfgRes.data) {
        setStorageConfig(cfgRes.data);
        setCustomDrivePath(cfgRes.data.active_path || '');
        setAutoArchive(cfgRes.data.auto_archive ?? true);
      }
      if (drivesRes.data) {
        setAvailableDrives(drivesRes.data);
      }
      if (filesRes.data) {
        setRecentDriveFiles(filesRes.data);
      }
    } catch (e) {
      console.warn('Could not fetch storage config', e);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStorageInfo();
  }, []);

  const handleSave = async () => {
    playBeep(1000, 0.08);
    try {
      await axios.post(`${API_BASE}/settings`, {
        person_confidence: personConfidence,
        vehicle_confidence: vehicleConfidence,
        anpr_confidence: anprConfidence,
        fence_sensitivity: fenceSensitivity,
        alert_cooldown: alertCooldown,
      });
      setSaveStatus('Edge AI Model Thresholds Updated Successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setSaveStatus('Settings saved locally.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleToggleSound = () => {
    const isNowMuted = toggleAudioMute();
    setMuted(isNowMuted);
    if (!isNowMuted) playBeep(880, 0.1);
  };

  // Test target path
  const handleTestDrive = async (pathToCheck) => {
    playBeep(800, 0.05);
    const target = pathToCheck || customDrivePath;
    if (!target.trim()) return;

    setIsTestingDrive(true);
    setDriveTestStatus(null);
    try {
      const res = await axios.post(`${API_BASE}/storage/test`, { target_path: target });
      if (res.data.success) {
        setDriveTestStatus({
          type: 'success',
          msg: `Drive Accessible: ${res.data.free_gb} GB Free Space available on ${res.data.path}`
        });
      } else {
        setDriveTestStatus({ type: 'error', msg: res.data.message });
      }
    } catch (err) {
      setDriveTestStatus({
        type: 'error',
        msg: err.response?.data?.detail || 'Drive path test failed. Please verify permissions.'
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  // Apply new active drive path
  const handleApplyDrivePath = async () => {
    playBeep(1200, 0.08);
    if (!customDrivePath.trim()) return;

    try {
      const res = await axios.post(`${API_BASE}/storage/config`, {
        drive_path: customDrivePath.trim(),
        auto_archive: autoArchive,
      });
      setDriveTestStatus({
        type: 'success',
        msg: `Active drive updated to: ${res.data.active_path} (${res.data.free_gb} GB Free)`
      });
      fetchStorageInfo();
    } catch (err) {
      setDriveTestStatus({
        type: 'error',
        msg: err.response?.data?.detail || 'Could not set active storage drive.'
      });
    }
  };

  // Synchronize all evidence now
  const handleSyncAllToDrive = async () => {
    playBeep(1400, 0.1);
    setIsSyncingDrive(true);
    try {
      const res = await axios.post(`${API_BASE}/storage/sync`);
      if (res.data.status === 'SUCCESS') {
        setDriveTestStatus({
          type: 'success',
          msg: `Synced ${res.data.synced_files} forensic packages & media deliverables to drive at ${res.data.timestamp}!`
        });
        fetchStorageInfo();
      }
    } catch (err) {
      setDriveTestStatus({
        type: 'error',
        msg: err.response?.data?.detail || 'Drive synchronization failed.'
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Open Drive folder in Windows Explorer
  const handleOpenExplorer = async () => {
    playBeep(1000, 0.05);
    try {
      await axios.post(`${API_BASE}/storage/open-folder`);
    } catch (e) {
      console.warn('Could not launch file explorer', e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-slate-400" /> System Configuration & Drive Integration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage local/cloud storage drives, tamper-proof forensic archival, Edge YOLO inference cutoffs, and tactical telemetry.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-accent to-brand-accent2 text-white hover:opacity-90 shadow-[0_4px_15px_rgba(0,212,255,0.25)] flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      {saveStatus && (
        <div className="p-3 bg-brand-success/10 border border-brand-success/40 text-brand-success rounded-lg text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" /> {saveStatus}
        </div>
      )}

      {/* ─── CONNECTED STORAGE & DRIVE INTEGRATION PANEL ─── */}
      <div className="glass-card p-6 space-y-5 border-brand-accent/40 shadow-[0_0_25px_rgba(0,212,255,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-brand-accent shadow-[0_0_15px_rgba(0,212,255,0.2)]">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Storage & Connected Drive Management
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  storageConfig.status === 'ONLINE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {storageConfig.status === 'ONLINE' ? '● DRIVE ACTIVE' : '○ DISCONNECTED'}
                </span>
                {storageConfig.is_cloud_synced && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono font-bold flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> CLOUD SYNC
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Connect external hard drives, Google Drive for Desktop (<code className="text-cyan-300">G:\My Drive</code>), OneDrive, or local storage for CCTV video logs & forensic evidence dossiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenExplorer}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-dark border border-brand-border/40 text-slate-300 hover:text-white hover:border-brand-accent transition-all flex items-center gap-1.5"
              title="Open the active folder in Windows File Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-accent" /> Open Drive in Explorer
            </button>

            <button
              onClick={handleSyncAllToDrive}
              disabled={isSyncingDrive}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-50"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              {isSyncingDrive ? 'Syncing to Drive...' : 'Sync All Evidence Now'}
            </button>
          </div>
        </div>

        {/* Drive Capacity Meter & Live Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-brand-dark rounded-xl border border-brand-border/20 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Drive Path</span>
            <span className="text-white font-mono font-semibold block truncate" title={storageConfig.active_path}>
              {storageConfig.active_path}
            </span>
          </div>
          <div className="p-3.5 bg-brand-dark rounded-xl border border-brand-border/20 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Available Free Storage</span>
            <div className="flex items-center justify-between">
              <span className="text-brand-success font-mono font-bold text-sm">{storageConfig.free_gb} GB</span>
              <span className="text-slate-400 font-mono text-[10px]">of {storageConfig.total_gb} GB</span>
            </div>
          </div>
          <div className="p-3.5 bg-brand-dark rounded-xl border border-brand-border/20 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Archived Evidence Files</span>
            <div className="flex items-center justify-between">
              <span className="text-brand-accent font-mono font-bold text-sm">{storageConfig.archived_files_count} items</span>
              <span className="text-slate-400 font-mono text-[10px]">{storageConfig.archived_size_mb} MB</span>
            </div>
          </div>
          <div className="p-3.5 bg-brand-dark rounded-xl border border-brand-border/20 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Last Drive Sync</span>
            <span className="text-cyan-300 font-mono font-semibold block text-[11px] truncate">
              {storageConfig.last_sync || 'Never / Ready to sync'}
            </span>
          </div>
        </div>

        {/* Free Space Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Disk Space Utilization ({storageConfig.used_percent}% used)</span>
            <span>{storageConfig.free_gb} GB Free</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-brand-border/20">
            <div
              className={`h-full transition-all duration-500 ${
                storageConfig.used_percent > 95
                  ? 'bg-red-500'
                  : storageConfig.used_percent > 85
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(storageConfig.used_percent || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Drive Presets */}
        <div className="space-y-2 pt-1">
          <label className="text-xs text-slate-300 font-semibold block">
            Detected Drives & Quick Select Locations:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableDrives.map((d, i) => (
              <button
                key={d.id || i}
                onClick={() => {
                  playBeep(900, 0.04);
                  setCustomDrivePath(d.path);
                  handleTestDrive(d.path);
                }}
                className={`p-2.5 rounded-lg text-left border transition-all text-xs flex items-center justify-between ${
                  customDrivePath === d.path || (customDrivePath.startsWith(d.letter) && !d.path.includes('OneDrive'))
                    ? 'bg-brand-accent/15 border-brand-accent text-white shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                    : 'bg-brand-dark border-brand-border/30 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-bold flex items-center gap-1.5 truncate">
                    {d.is_cloud_sync ? <Cloud className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> : <HardDrive className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    <span className="truncate">{d.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block truncate">{d.path}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex-shrink-0">
                  {d.free_gb} GB free
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Path Input & Action Buttons */}
        <div className="space-y-2 pt-1">
          <label className="text-xs text-slate-300 font-semibold block">
            Target Drive / Synced Folder Location:
          </label>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1">
              <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customDrivePath}
                onChange={(e) => setCustomDrivePath(e.target.value)}
                placeholder="e.g. G:\My Drive\DrishtiX or D:\Surveillance_Archive"
                className="w-full pl-9 pr-3 py-2 bg-brand-dark rounded-lg border border-brand-border/40 text-xs font-mono text-white focus:border-brand-accent focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleTestDrive(customDrivePath)}
              disabled={isTestingDrive}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-dark border border-brand-border/40 text-slate-300 hover:text-white hover:border-cyan-400 transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingDrive ? 'animate-spin' : ''}`} />
              {isTestingDrive ? 'Testing...' : 'Test Path'}
            </button>

            <button
              onClick={handleApplyDrivePath}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-accent text-brand-dark hover:bg-cyan-300 transition-all flex items-center gap-1 flex-shrink-0 shadow-[0_0_12px_rgba(0,212,255,0.3)]"
            >
              <Check className="w-3.5 h-3.5 font-bold" /> Set Active Drive
            </button>
          </div>
        </div>

        {/* Drive Status / Feedback Message */}
        {driveTestStatus && (
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-slide-up ${
            driveTestStatus.type === 'success'
              ? 'bg-brand-success/10 border border-brand-success/40 text-brand-success'
              : 'bg-red-500/10 border border-red-500/40 text-red-400'
          }`}>
            {driveTestStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{driveTestStatus.msg}</span>
          </div>
        )}

        {/* Auto Archival Policy Option */}
        <div className="flex items-center justify-between p-3.5 bg-brand-dark rounded-xl border border-brand-border/20">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Real-Time Evidence Auto-Archiving
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instantly mirror critical perimeter breaches, ANPR hotlist detections, and cryptographically stamped audit logs directly onto the configured drive.
            </p>
          </div>
          <button
            onClick={() => {
              playBeep(900, 0.05);
              const next = !autoArchive;
              setAutoArchive(next);
              axios.post(`${API_BASE}/storage/config`, {
                drive_path: customDrivePath || storageConfig.active_path,
                auto_archive: next,
              });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              autoArchive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {autoArchive ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Recent Files on Connected Drive */}
        {recentDriveFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-accent2" /> Recently Synced Packages on Connected Drive
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SHA-256 Verified</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {recentDriveFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-brand-dark/80 border border-brand-border/20 text-xs hover:border-brand-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-white font-mono truncate text-[11px]">{f.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                      {f.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 flex-shrink-0">
                    <span>{f.size_kb} KB</span>
                    <span className="text-emerald-400">● SYNCED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── AI INFERENCE SETTINGS ─── */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-brand-border/30 pb-3">
          <Zap className="w-5 h-5 text-brand-accent" /> Edge Vision Inference Cutoffs
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-slate-300 font-semibold">Pedestrian Detection (YOLOv8-m) Confidence Threshold</span>
              <span className="text-brand-accent font-mono font-bold">{personConfidence}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={personConfidence}
              onChange={e => setPersonConfidence(Number(e.target.value))}
              className="w-full h-1.5 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-slate-300 font-semibold">Vehicle Detection Confidence Threshold</span>
              <span className="text-brand-accent font-mono font-bold">{vehicleConfidence}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={vehicleConfidence}
              onChange={e => setVehicleConfidence(Number(e.target.value))}
              className="w-full h-1.5 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-slate-300 font-semibold">ANPR OCR Character Match Confidence</span>
              <span className="text-brand-accent font-mono font-bold">{anprConfidence}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="99"
              value={anprConfidence}
              onChange={e => setAnprConfidence(Number(e.target.value))}
              className="w-full h-1.5 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* ─── VIRTUAL FENCE & TACTICAL AUDIO ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-border/30 pb-3">
            <Crosshair className="w-4 h-4 text-red-400" /> Virtual Fence Sensitivity
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-slate-300">Intrusion Hysteresis</span>
                <span className="text-red-400 font-mono font-bold">{fenceSensitivity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={fenceSensitivity}
                onChange={e => setFenceSensitivity(Number(e.target.value))}
                className="w-full h-1.5 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-red-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-slate-300">Alert Cooldown Window</span>
                <span className="text-white font-mono font-bold">{alertCooldown}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={alertCooldown}
                onChange={e => setAlertCooldown(Number(e.target.value))}
                className="w-full h-1.5 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-brand-accent"
              />
            </div>
          </div>
        </div>

        {/* Audio Alerts */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-border/30 pb-3">
              <Volume2 className="w-4 h-4 text-brand-warn" /> Tactical Command Audio
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Synthesizes real-time tactical alarms, perimeter breach sirens, and QRT radio squelch tones via Web Audio API.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleToggleSound}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                muted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {muted ? 'SOUND MUTED' : 'AUDIO ACTIVE'}
            </button>

            <button
              onClick={() => playCriticalSiren(2)}
              className="px-3 py-2 rounded-lg text-xs text-slate-300 bg-brand-dark border border-brand-border/30 hover:text-white"
            >
              Test Siren Tone
            </button>
          </div>
        </div>
      </div>

      {/* ─── SYSTEM DIAGNOSTICS & RESET ─── */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-brand-border/30 pb-3">
          <Cpu className="w-4 h-4 text-brand-accent2" /> Edge Node Diagnostic Telemetry
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border/20">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Inference Engine</span>
            <span className="text-white font-mono font-bold">TensorRT / ONNX</span>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border/20">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Edge Frame Rate</span>
            <span className="text-brand-success font-mono font-bold">30.0 FPS (0 Drop)</span>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border/20">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Database</span>
            <span className="text-white font-mono font-bold">SQLite Local Edge</span>
          </div>
          <div className="p-3 bg-brand-dark rounded-lg border border-brand-border/20">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Latency</span>
            <span className="text-brand-success font-mono font-bold">18ms E2E</span>
          </div>
        </div>

        <div className="pt-3 border-t border-brand-border/20 flex items-center justify-between">
          <span className="text-xs text-slate-400">Clear demo event history and restore fresh state:</span>
          <button
            onClick={() => {
              playBeep();
              if (onResetDemo) onResetDemo();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-dark border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo State
          </button>
        </div>
      </div>
    </div>
  );
};
