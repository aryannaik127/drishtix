import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Car, ShieldAlert, Plus, Search, Filter, Trash2, CheckCircle2,
  Download, AlertTriangle, Eye, ArrowUpDown, FileText
} from 'lucide-react';
import { playBeep, playWarningTone } from '../../utils/audioAlert';

const API_BASE = 'http://localhost:8000/api';

const DEFAULT_ANPR_LOGS = [
  { id: 'ANPR-101', timestamp: new Date(Date.now() - 45000).toISOString(), plate: 'MH01AB1234', type: 'SUV (Black Scorpio)', speed: 18.2, conf: 0.94, camera_id: 'CAM-03', status: 'WATCHLIST_HIT', risk: 'HIGH' },
  { id: 'ANPR-102', timestamp: new Date(Date.now() - 120000).toISOString(), plate: 'DL05XY9876', type: 'Truck (White Pickup)', speed: 32.0, conf: 0.90, camera_id: 'CAM-03', status: 'UNREGISTERED', risk: 'CRITICAL' },
  { id: 'ANPR-103', timestamp: new Date(Date.now() - 300000).toISOString(), plate: 'JK02C5544',  type: 'Sedan (Silver)', speed: 24.5, conf: 0.96, camera_id: 'CAM-02', status: 'AUTHORIZED', risk: 'LOW' },
  { id: 'ANPR-104', timestamp: new Date(Date.now() - 600000).toISOString(), plate: 'HR26DQ1100', type: 'Van (Grey)', speed: 19.8, conf: 0.92, camera_id: 'CAM-03', status: 'AUTHORIZED', risk: 'LOW' },
  { id: 'ANPR-105', timestamp: new Date(Date.now() - 900000).toISOString(), plate: 'PB08AZ9999', type: 'Sedan (Black)', speed: 48.0, conf: 0.88, camera_id: 'CAM-02', status: 'SPEED_ALERT', risk: 'MEDIUM' },
];

export const ANPRHub = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Watchlist Form
  const [newPlate, setNewPlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('SUV (Black)');
  const [newOwner, setNewOwner] = useState('Suspect Recon Vehicle');
  const [newReason, setNewReason] = useState('Flagged for repeated perimeter passes');
  const [newRisk, setNewRisk] = useState('HIGH');

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watchlist`);
      setWatchlist(res.data);
    } catch (e) {
      setWatchlist([
        { id: 'WP-1', plate_number: 'MH01AB1234', vehicle_type: 'SUV (Black Scorpio)', owner_name: 'Suspect Target 09', flag_reason: 'Flagged by Border Intelligence', risk_level: 'HIGH' },
        { id: 'WP-2', plate_number: 'DL05XY9876', vehicle_type: 'Pickup Truck (White)', owner_name: 'Unregistered Commercial', flag_reason: 'No valid border passage permit', risk_level: 'CRITICAL' },
      ]);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddWatchlist = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    playBeep(1000, 0.08);

    try {
      await axios.post(`${API_BASE}/watchlist`, {
        plate_number: newPlate.toUpperCase().trim(),
        vehicle_type: newVehicleType,
        owner_name: newOwner,
        flag_reason: newReason,
        risk_level: newRisk,
      });
      setShowAddModal(false);
      setNewPlate('');
      fetchWatchlist();
    } catch (e) {
      // Local fallback
      setWatchlist(w => [
        {
          id: `WP-${Date.now()}`,
          plate_number: newPlate.toUpperCase().trim(),
          vehicle_type: newVehicleType,
          owner_name: newOwner,
          flag_reason: newReason,
          risk_level: newRisk,
        },
        ...w
      ]);
      setShowAddModal(false);
      setNewPlate('');
    }
  };

  const handleDeleteWatchlist = async (id) => {
    playBeep(600, 0.05);
    try {
      await axios.delete(`${API_BASE}/watchlist/${id}`);
      fetchWatchlist();
    } catch (e) {
      setWatchlist(w => w.filter(item => item.id !== id));
    }
  };

  const handleExportCSV = () => {
    playBeep(1100, 0.08);
    const headers = 'Log ID,Timestamp,Plate Number,Vehicle Type,Speed (km/h),OCR Confidence,Camera,Status,Risk\n';
    const rows = DEFAULT_ANPR_LOGS.map(l =>
      `${l.id},${l.timestamp},${l.plate},${l.type},${l.speed},${l.conf},${l.camera_id},${l.status},${l.risk}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRISHTIX_ANPR_LOGS_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredLogs = DEFAULT_ANPR_LOGS.filter(l => {
    const matchesSearch = l.plate.toLowerCase().includes(searchQuery.toLowerCase()) || l.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || l.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Car className="w-7 h-7 text-brand-accent" /> ANPR & Vehicle Intelligence Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated optical character recognition (OCR), high-speed speed radar telemetry, and national watchlist plate cross-referencing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-dark border border-brand-border/30 text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Log (CSV)
          </button>

          <button
            onClick={() => { playBeep(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-accent to-brand-accent2 text-white hover:opacity-90 transition-opacity shadow-[0_4px_15px_rgba(0,212,255,0.25)]"
          >
            <Plus className="w-4 h-4" /> Add Hotlist Vehicle
          </button>
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Car className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Vehicles Scanned</div>
            <div className="text-2xl font-bold text-white mt-0.5">148</div>
            <div className="text-[11px] text-brand-success font-mono">100% OCR Active</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Watchlist Matches</div>
            <div className="text-2xl font-bold text-red-400 mt-0.5">03</div>
            <div className="text-[11px] text-red-400 font-mono">Requires Interception</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Speed Limit Breaches</div>
            <div className="text-2xl font-bold text-yellow-400 mt-0.5">07</div>
            <div className="text-[11px] text-slate-500">&gt;40 km/h Gate Area</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Active Hotlist Plates</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{watchlist.length}</div>
            <div className="text-[11px] text-slate-400 font-mono">Synchronized</div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT: LOG & WATCHLIST ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Scanned Vehicle OCR Stream */}
        <div className="lg:col-span-2 glass-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-accent" /> Live ANPR Capture Stream
            </span>

            {/* Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Plate or Model..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-brand-dark/80 border border-brand-border/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <select
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className="bg-brand-dark/80 border border-brand-border/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* OCR Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border/30">
                  <th className="table-header">License Plate</th>
                  <th className="table-header">Vehicle Category</th>
                  <th className="table-header">Velocity</th>
                  <th className="table-header">OCR Conf</th>
                  <th className="table-header">Camera Node</th>
                  <th className="table-header">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20 text-xs">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Plate Box */}
                    <td className="table-cell">
                      <div className="inline-flex items-center gap-2 bg-slate-900 border border-cyan-500/40 px-2.5 py-1 rounded font-mono font-bold text-cyan-300 tracking-wider">
                        {l.plate}
                      </div>
                    </td>
                    <td className="table-cell text-slate-200 font-medium">{l.type}</td>
                    <td className="table-cell font-mono text-slate-300">
                      <span className={l.speed > 40 ? 'text-yellow-400 font-bold' : ''}>
                        {l.speed.toFixed(1)} km/h
                      </span>
                    </td>
                    <td className="table-cell font-mono text-brand-success">
                      {Math.round(l.conf * 100)}%
                    </td>
                    <td className="table-cell text-slate-400 font-mono">{l.camera_id}</td>
                    <td className="table-cell">
                      <span className={`risk-badge ${
                        l.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        l.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        l.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {l.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Active Watchlist / Hotlist Panel */}
        <div className="glass-card p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Hotlist Plate Watchlist
              </span>
              <span className="text-xs font-mono text-slate-500">{watchlist.length} Flagged</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
              {watchlist.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-brand-dark/80 rounded-xl border border-red-500/30 hover:border-red-500/60 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="bg-red-500/10 border border-red-500/40 px-2 py-0.5 rounded font-mono font-bold text-red-300 text-xs tracking-wider">
                      {item.plate_number}
                    </div>
                    <button
                      onClick={() => handleDeleteWatchlist(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">{item.vehicle_type}</div>
                  <p className="text-[11px] text-slate-400 italic">"{item.flag_reason}"</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-brand-border/20">
                    <span>SECTOR 7 INTEL</span>
                    <span className="text-red-400 font-bold">{item.risk_level} THREAT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADD WATCHLIST MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-brand-accent" /> Add License Plate to Watchlist
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddWatchlist} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH01AB1234"
                  value={newPlate}
                  onChange={e => setNewPlate(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-accent"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Vehicle Model & Color</label>
                <input
                  type="text"
                  placeholder="e.g. SUV (Black Scorpio)"
                  value={newVehicleType}
                  onChange={e => setNewVehicleType(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Flagging Reason / Intel Note</label>
                <input
                  type="text"
                  placeholder="e.g. Suspect in unauthorized reconnaissance"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Threat Risk Level</label>
                <select
                  value={newRisk}
                  onChange={e => setNewRisk(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-accent to-brand-accent2 text-white hover:opacity-90 transition-opacity"
                >
                  Confirm & Flag Plate
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-brand-dark border border-brand-border/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
