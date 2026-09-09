import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { TacticalDemoPlayer } from './TacticalDemoPlayer';

export function VoiceTourModal({ isOpen, onClose, onSelectTab }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-brand-dark/95 border border-brand-accent/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_60px_rgba(0,212,255,0.25)] flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-brand-card/90 border-b border-brand-border/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wider">
                  DRISHTIX TACTICAL AI DEMONSTRATION & VIDEO GUIDE
                </h3>
                <span className="bg-brand-accent/15 text-brand-accent border border-brand-accent/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive Multi-Scene Prototype Walkthrough • Live Voice Narration • Real-Life Surveillance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-card hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-brand-border/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Tactical Demo Player */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <TacticalDemoPlayer
            onSelectTab={onSelectTab}
            onNavigateTab={(tab) => {
              if (onSelectTab) onSelectTab(tab);
            }}
          />
        </div>
      </div>
    </div>
  );
}
