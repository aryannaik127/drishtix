import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert, Radio, Send, CheckCircle2, AlertTriangle,
  Clock, CheckSquare, Square, UserCheck, Volume2, Shield
} from 'lucide-react';
import { playBeep, playCriticalSiren, playRadioChirp } from '../../utils/audioAlert';
import { API_BASE } from '../../config/api';

const SOP_DEFAULT_STEPS = [
  { id: 1, label: '1. Confirm Threat Identity via Multi-Cam Feed', done: false },
  { id: 2, label: '2. Sound Perimeter Alarm & Audio Warning Broadcast', done: false },
  { id: 3, label: '3. Deploy Quick Reaction Team (QRT Alpha Unit)', done: false },
  { id: 4, label: '4. Transmit Geospatial Coordinates to Sector Command HQ', done: false },
  { id: 5, label: '5. Lock Down Gate Barrier & Seal Perimeter Buffer', done: false },
];

export const IncidentCommander = ({
  criticalEvent,
  onDismissAlert,
  onOpenEvidence
}) => {
  const [sopSteps, setSopSteps] = useState(SOP_DEFAULT_STEPS);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [unitName, setUnitName] = useState('QRT-Alpha (Quick Reaction Team 01)');
  const [dispatchNotes, setDispatchNotes] = useState('Immediate interception ordered at Delta Perimeter Wire.');
  const [dispatches, setDispatches] = useState([]);
  const [isDispatched, setIsDispatched] = useState(false);

  const fetchDispatches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dispatches`);
      setDispatches(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  const toggleSopStep = (id) => {
    playBeep(900, 0.05);
    setSopSteps(steps =>
      steps.map(s => {
        if (s.id === id) {
          const nextDone = !s.done;
          if (id === 2 && nextDone) {
            playCriticalSiren(2);
          }
          if (id === 3 && nextDone) {
            setShowDispatchModal(true);
          }
          return { ...s, done: nextDone };
        }
        return s;
      })
    );
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    playRadioChirp();

    const completedSopNames = sopSteps.filter(s => s.done).map(s => s.label);

    try {
      await axios.post(`${API_BASE}/dispatches`, {
        event_id: (criticalEvent && criticalEvent.id) || 'EVT-BREACH-01',
        camera_id: (criticalEvent && criticalEvent.camera_id) || 'CAM-04',
        unit_name: unitName,
        notes: dispatchNotes,
        sop_steps: completedSopNames.length > 0 ? completedSopNames : ['Verified Threat', 'Sounded Siren', 'Dispatched QRT'],
      });
      setIsDispatched(true);
      setShowDispatchModal(false);
      fetchDispatches();
    } catch (e) {
      setIsDispatched(true);
      setShowDispatchModal(false);
      setDispatches(d => [
        {
          id: `DISP-${Date.now()}`,
          event_id: (criticalEvent && criticalEvent.id) || 'EVT-BREACH-01',
          camera_id: (criticalEvent && criticalEvent.camera_id) || 'CAM-04',
          unit_name: unitName,
          status: 'DISPATCHED',
          dispatched_at: new Date().toISOString(),
          notes: dispatchNotes,
          sop_steps: completedSopNames
        },
        ...d
      ]);
    }
  };

  if (!criticalEvent && dispatches.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-slate-500 text-xs">
        <Shield className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand-success" />
        <p className="text-sm font-semibold text-white">All Perimeter Sectors Clear</p>
        <p className="text-xs text-slate-400 mt-1">No active critical breaches requiring incident dispatch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── ACTIVE EMERGENCY BANNER ─── */}
      {criticalEvent && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-600/30 via-red-500/20 to-orange-500/20 border border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse-slow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    CRITICAL INCIDENT ACTIVE
                  </span>
                  <span className="text-xs font-mono text-red-300 font-bold">{criticalEvent.camera_id}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">{criticalEvent.event_type}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { playBeep(); setShowDispatchModal(true); }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch QRT Unit
              </button>

              <button
                onClick={() => { playBeep(); onDismissAlert && onDismissAlert(); }}
                className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-brand-dark border border-brand-border/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INCIDENT COMMAND WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Col: Standard Operating Procedure Checklist */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-accent animate-pulse" /> Standard Operating Procedure (SOP)
            </h3>
            <span className="text-xs font-mono text-brand-accent font-bold">
              {sopSteps.filter(s => s.done).length} / {sopSteps.length} Complete
            </span>
          </div>

          <div className="space-y-2.5">
            {sopSteps.map(step => (
              <div
                key={step.id}
                onClick={() => toggleSopStep(step.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  step.done
                    ? 'bg-brand-success/10 border-brand-success/40 text-white'
                    : 'bg-brand-dark/60 border-brand-border/20 text-slate-300 hover:border-brand-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-success flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${step.done ? 'line-through text-slate-400' : ''}`}>
                    {step.label}
                  </span>
                </div>

                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  {step.done ? 'DONE' : 'EXECUTE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Active Dispatch Activity Log */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-success" /> Field Units & Dispatch Log
            </h3>
            <span className="text-xs font-mono text-slate-500">{dispatches.length} Deployments</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {dispatches.map(d => (
              <div
                key={d.id}
                className="p-3 bg-brand-dark/80 rounded-xl border border-brand-border/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-white">{d.unit_name}</div>
                  <span className="px-2 py-0.5 rounded bg-brand-success/10 text-brand-success font-mono text-[10px] font-bold">
                    {d.status || 'EN ROUTE'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{d.notes || 'Perimeter interception protocol engaged.'}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-brand-border/20">
                  <span>REF: {d.event_id} ({d.camera_id})</span>
                  <span>{new Date(d.dispatched_at).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>
            ))}

            {dispatches.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active units deployed. Execute SOP step 3 to dispatch QRT.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── DISPATCH MODAL ─── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/30 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-400" /> Deploy Quick Reaction Team (QRT)
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Select Field Unit</label>
                <select
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="QRT-Alpha (Quick Reaction Team 01)">QRT-Alpha (Quick Reaction Team 01 - Sector 7)</option>
                  <option value="QRT-Bravo (Rapid Armored Unit 02)">QRT-Bravo (Rapid Armored Unit 02 - Gate Area)</option>
                  <option value="UAV-Support-Squad (Drone Overwatch)">UAV-Support-Squad (Drone Overwatch Alpha)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Deployment Directive / Tactical Orders</label>
                <textarea
                  rows="3"
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border/30 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Confirm Live Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
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
