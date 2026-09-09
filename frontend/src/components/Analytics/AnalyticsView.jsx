import React from 'react';
import {
  TrendingUp, Activity, Target, Camera, ShieldAlert, Users,
  Car, Clock, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const DEMO_TIMELINE_DATA = [
  { time: '12:00', people: 4, vehicles: 2, alerts: 0 },
  { time: '13:00', people: 8, vehicles: 4, alerts: 1 },
  { time: '14:00', people: 14, vehicles: 7, alerts: 1 },
  { time: '15:00', people: 19, vehicles: 11, alerts: 2 },
  { time: '16:00', people: 26, vehicles: 15, alerts: 4 },
  { time: '17:00', people: 34, vehicles: 18, alerts: 6 },
  { time: '18:00', people: 42, vehicles: 22, alerts: 8 },
];

const DEMO_RISK_DATA = [
  { name: 'Low', value: 24, color: '#10B981' },
  { name: 'Medium', value: 11, color: '#F59E0B' },
  { name: 'High', value: 7, color: '#F97316' },
  { name: 'Critical', value: 4, color: '#EF4444' },
];

const DEMO_CAM_ACTIVITY = [
  { name: 'CAM-01 (Alpha)', detections: 48, alerts: 4 },
  { name: 'CAM-02 (Bravo)', detections: 36, alerts: 6 },
  { name: 'CAM-03 (ANPR)',  detections: 28, alerts: 8 },
  { name: 'CAM-04 (Delta)', detections: 52, alerts: 14 },
];

const HOURLY_THREAT_PATTERN = [
  { hour: '00:00', intrusions: 3 },
  { hour: '03:00', intrusions: 5 },
  { hour: '06:00', intrusions: 1 },
  { hour: '09:00', intrusions: 0 },
  { hour: '12:00', intrusions: 2 },
  { hour: '15:00', intrusions: 1 },
  { hour: '18:00', intrusions: 4 },
  { hour: '21:00', intrusions: 7 },
];

export const AnalyticsView = ({ analytics = {} }) => {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-brand-accent" /> Border Surveillance Analytics & AI Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated threat intelligence, anomaly frequency trends, and multi-node detection distribution.
          </p>
        </div>
      </div>

      {/* ─── KPI SUMMARY ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Total Edge Detections</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{analytics.total_events || 164}</div>
          <div className="text-[11px] text-brand-success flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs last 24h
          </div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Critical Perimeter Breaches</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">{analytics.critical_alerts || 4}</div>
          <div className="text-[11px] text-red-400 font-medium">100% SOP Intercepted</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>ANPR Plate Scans</span>
            <Car className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{analytics.anpr_scans || 38}</div>
          <div className="text-[11px] text-yellow-400 font-medium">3 Hotlist Hits</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>AI False Alarm Filter</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">98.6%</div>
          <div className="text-[11px] text-slate-400">Weather/Animal suppression</div>
        </div>
      </div>

      {/* ─── CHARTS ROW 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Detection Stream Timeline */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-accent" /> Multi-Class Detection Timeline
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={DEMO_TIMELINE_DATA}>
              <defs>
                <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F30" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="people" stroke="#00D4FF" fill="url(#colorPeople)" strokeWidth={2} name="Pedestrians" />
              <Area type="monotone" dataKey="vehicles" stroke="#7C3AED" fill="url(#colorVehicles)" strokeWidth={2} name="Vehicles" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-warn" /> Threat Risk Level Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={DEMO_RISK_DATA}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {DEMO_RISK_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── CHARTS ROW 2 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Camera Load Activity Bar Chart */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" /> Camera Detection Load & Anomaly Frequency
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DEMO_CAM_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F30" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="detections" fill="#00D4FF" radius={[4, 4, 0, 0]} name="Normal Detections" />
              <Bar dataKey="alerts" fill="#EF4444" radius={[4, 4, 0, 0]} name="Security Alerts" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Night-Intrusion Peak Distribution */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" /> Peak Intrusion Hours (24h Diurnal Heatmap)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={HOURLY_THREAT_PATTERN}>
              <defs>
                <linearGradient id="colorIntrusions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F30" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #1E3A5F', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="intrusions" stroke="#EF4444" fill="url(#colorIntrusions)" strokeWidth={2} name="Perimeter Breaches" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
