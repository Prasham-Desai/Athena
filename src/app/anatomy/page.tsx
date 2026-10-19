'use client';

import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AnatomyViewer } from '@/components/anatomy/anatomy-viewer';
import {
  ANATOMY_GENDER_CONFIGS,
  type AnatomyGender,
  type AnatomySystemOption,
} from '@/components/anatomy/anatomy-config';
import { cn } from '@/lib/utils';

export default function AnatomyPage() {
  const [selectedGender, setSelectedGender] = useState<AnatomyGender>('male');
  const genderConfig = ANATOMY_GENDER_CONFIGS[selectedGender];

  // Active system selection
  const [activeSystemId, setActiveSystemId] = useState<string>(
    genderConfig.systems[0]?.id || ''
  );

  const activeSystem =
    genderConfig.systems.find((s) => s.id === activeSystemId) ||
    genderConfig.systems[0];

  /**
   * Handle switching between Male and Female anatomy intelligently
   */
  const handleGenderSwitch = (targetGender: AnatomyGender) => {
    if (targetGender === selectedGender) return;

    const targetConfig = ANATOMY_GENDER_CONFIGS[targetGender];
    const currentSystemKey = activeSystem?.systemKey;
    const matchedSystem = targetConfig.systems.find(
      (s) => s.systemKey === currentSystemKey
    );

    setSelectedGender(targetGender);
    if (matchedSystem) {
      setActiveSystemId(matchedSystem.id);
    } else {
      setActiveSystemId(targetConfig.systems[0].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Human Anatomy Lab"
        description="Explore the human body through interactive 3D anatomy."
      >
        <div className="flex items-center gap-2">
          <a
            href="https://www.biodigital.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-indigo-500/40 transition shadow-sm"
          >
            <span>Powered by BioDigital Human™</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </PageHeader>

      {/* Top Controls: Male/Female Selector + Regional Systems */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
        {/* Male vs Female Anatomy Segmented Pill */}
        <LayoutGroup id="anatomy-gender-tabs">
          <div
            role="tablist"
            aria-label="Anatomy Gender Selection"
            className="flex items-center p-1 rounded-xl bg-[hsl(var(--muted)/0.6)] border border-[hsl(var(--border))] gap-1 shrink-0"
          >
            {(['male', 'female'] as AnatomyGender[]).map((gender) => {
              const config = ANATOMY_GENDER_CONFIGS[gender];
              const isSelected = selectedGender === gender;

              return (
                <button
                  key={gender}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleGenderSwitch(gender)}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-2 select-none z-10',
                    isSelected
                      ? 'text-white'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent)/0.5)]'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="anatomy-gender-active"
                      className={cn(
                        'absolute inset-0 rounded-lg',
                        config.activeGradient,
                        config.activeShadow
                      )}
                      transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center gap-1.5 whitespace-nowrap">
                    <span>{config.label}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded border transition-colors duration-150',
                        isSelected
                          ? 'border-white/30 bg-white/20 text-white'
                          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                      )}
                    >
                      {config.badge}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Regional Systems for the active gender */}
        {genderConfig.systems.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 sm:pt-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-1 shrink-0 hidden md:inline">
              System:
            </span>
            <LayoutGroup id="anatomy-systems-tabs">
              <div className="relative flex items-center gap-1.5 p-1 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/40">
                {genderConfig.systems.map((sys) => {
                  const isCurrent = activeSystem.id === sys.id;
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setActiveSystemId(sys.id)}
                      className={cn(
                        'relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shrink-0',
                        isCurrent
                          ? 'text-[hsl(var(--background))] font-semibold'
                          : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      )}
                    >
                      {isCurrent && (
                        <motion.div
                          layoutId="anatomy-system-active"
                          className="absolute inset-0 bg-[hsl(var(--foreground))] rounded-lg shadow-sm"
                          transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                        />
                      )}
                      <span className="relative z-10">{sys.name}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        )}
      </div>

      {/* Interactive 3D Anatomy Viewer */}
      {activeSystem && (
        <AnatomyViewer
          system={activeSystem}
          genderLabel={genderConfig.label}
        />
      )}

      {/* Anatomical Structures & Rachana Sharir Clinical Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active System Focus Card */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md"
              style={{ backgroundColor: genderConfig.color }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{activeSystem?.name}</h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {genderConfig.label}
              </p>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            {activeSystem?.description}
          </p>
        </div>

        {/* Major Structures Explorable */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Key Structures</h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Available in this 3D model
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSystem?.structures.map((struct, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--muted)/0.6)] border border-[hsl(var(--border))] text-[11px] text-[hsl(var(--foreground))] font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{struct}</span>
              </span>
            ))}
          </div>
        </div>

        {/* BAMS / Rachana Sharir Correlation Guide */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Rachana Sharir Focus</h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Ayurvedic Anatomy Correlation
              </p>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Use 3D anatomical exploration to correlate Asthi Sharir (osteology), Sandhi Sharir (arthrology), Peshi Sharir (myology), Sira/Dhamani (angio/neurology), and Marma locations with modern anatomical structures.
          </p>
        </div>
      </div>
    </div>
  );
}
