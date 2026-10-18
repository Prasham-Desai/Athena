'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  HelpCircle,
  Key,
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { buildBioDigitalUrl, type AnatomySystemOption } from './anatomy-config';
import { cn } from '@/lib/utils';

interface AnatomyViewerProps {
  system: AnatomySystemOption;
  genderLabel: string;
  className?: string;
}

export function AnatomyViewer({
  system,
  genderLabel,
  className,
}: AnatomyViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [activeModelId, setActiveModelId] = useState(system.modelId);

  // Load custom settings from localStorage if configured
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('athena_biodigital_key') || '';
      const savedModel = localStorage.getItem(`athena_custom_model_${system.id}`) || '';
      if (savedKey) setCustomKey(savedKey);
      if (savedModel) {
        setCustomModelId(savedModel);
        setActiveModelId(savedModel);
      } else {
        setActiveModelId(system.modelId);
      }
    } catch (e) {
      setActiveModelId(system.modelId);
    }
  }, [system.id, system.modelId]);

  // When system or model changes, reset loading
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
  }, [activeModelId, system.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setLoadError(false);
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customKey.trim()) {
        localStorage.setItem('athena_biodigital_key', customKey.trim());
      } else {
        localStorage.removeItem('athena_biodigital_key');
      }

      if (customModelId.trim()) {
        localStorage.setItem(`athena_custom_model_${system.id}`, customModelId.trim());
        setActiveModelId(customModelId.trim());
      } else {
        localStorage.removeItem(`athena_custom_model_${system.id}`);
        setActiveModelId(system.modelId);
      }
    } catch (err) {}
    setShowSettings(false);
    setIsLoading(true);
  };

  const handleResetSettings = () => {
    try {
      localStorage.removeItem(`athena_custom_model_${system.id}`);
    } catch (e) {}
    setCustomModelId('');
    setActiveModelId(system.modelId);
    setShowSettings(false);
    setIsLoading(true);
  };

  const embedUrl = buildBioDigitalUrl(activeModelId, customKey || undefined);
  const directBioDigitalUrl = `https://human.biodigital.com/viewer/?id=${activeModelId}`;

  // Check if missing a developer key
  const isWithoutKey = !customKey && !process.env.NEXT_PUBLIC_BIODIGITAL_KEY;

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden flex flex-col shadow-xl transition-all',
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[620px] sm:h-[680px] lg:h-[760px]',
        className
      )}
    >
      {/* Top action toolbar overlay */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Model Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[hsl(var(--card)/0.9)] backdrop-blur-md border border-[hsl(var(--border))] rounded-xl px-3 py-1.5 shadow-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
            {system.name}
          </span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))] pl-2">
            {genderLabel}
          </span>
        </div>

        {/* Action buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[hsl(var(--card)/0.9)] backdrop-blur-md border border-[hsl(var(--border))] rounded-xl p-1 shadow-md">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="3D Navigation & Controls Guide"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReload}
            title="Reset / Reload Model"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href={directBioDigitalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Direct BioDigital Viewer (No Key Needed)"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="BioDigital Developer Key & Custom Model Settings"
            className={cn(
              'p-1.5 rounded-lg transition-colors relative',
              isWithoutKey
                ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
            )}
          >
            <Key className="w-4 h-4" />
            {isWithoutKey && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Immersive Fullscreen'}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BioDigital Key Notification Banner (if user hasn't entered developer key yet) */}
      {isWithoutKey && (
        <div className="absolute top-14 left-3 right-3 z-30 pointer-events-auto">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))]">
                  BioDigital Developer Key Required for Iframe Embedding
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                  BioDigital requires an authorized key to render within an iframe. You can enter your key, or open the model directly in BioDigital (no key required).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] shadow-sm transition flex items-center gap-1.5"
              >
                <Key className="w-3 h-3" />
                <span>Enter Key</span>
              </button>
              <a
                href={directBioDigitalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] shadow-sm transition flex items-center gap-1"
              >
                <span>Direct 3D View (No Key Needed)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !loadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[hsl(var(--card))] backdrop-blur-md"
          >
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
              </div>
            </div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Initializing 3D Anatomy Model…
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-xs text-center">
              Connecting to BioDigital Human™ WebGL rendering engine
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[hsl(var(--card))] text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
            Unable to Load 3D Anatomy Viewer
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md mt-1.5 mb-5 leading-relaxed">
            The external service encountered a loading or network issue.
            You can retry loading, enter a custom developer key, or open the model directly in a new tab.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReload}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition"
            >
              Retry Connection
            </button>
            <a
              href={directBioDigitalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[hsl(var(--accent))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-semibold border border-[hsl(var(--border))] transition flex items-center gap-1.5"
            >
              Open Direct in New Tab <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Actual Interactive 3D iframe */}
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={`BioDigital 3D Human Anatomy Viewer - ${system.name} (${genderLabel})`}
        allow="fullscreen; xr-spatial-tracking; web-share"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setLoadError(true);
        }}
        className="w-full h-full border-0 block flex-1 bg-[hsl(var(--card))]"
      />

      {/* Bottom Footer Bar */}
      <div className="py-2 px-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] flex flex-wrap items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))] gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[hsl(var(--foreground))]">{system.name}:</span>
          <span className="truncate max-w-[280px] sm:max-w-md">{system.description}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.biodigital.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 underline transition-colors"
          >
            BioDigital Human™ 3D Engine
          </a>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">3D Anatomy Controls</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Interactive Navigation Guide</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))] flex items-start gap-2.5">
                  <div className="font-bold text-[hsl(var(--foreground))] w-24 shrink-0">Rotate:</div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Left-click and drag across the model to rotate in 360° 3D space.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))] flex items-start gap-2.5">
                  <div className="font-bold text-[hsl(var(--foreground))] w-24 shrink-0">Pan / Move:</div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Right-click and drag (or two-finger drag on trackpad/touch).
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))] flex items-start gap-2.5">
                  <div className="font-bold text-[hsl(var(--foreground))] w-24 shrink-0">Zoom:</div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Scroll mouse wheel or pinch-to-zoom on mobile / touchscreen.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))] flex items-start gap-2.5">
                  <div className="font-bold text-[hsl(var(--foreground))] w-24 shrink-0">Inspect / Focus:</div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Click any bone, muscle, or structure to focus the camera and view anatomical details.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-md hover:opacity-90 transition"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings / Custom Model Modal */}
      <AnimatePresence>
        {showSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">BioDigital Key & Settings</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Configure Developer Key or Custom Model</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[hsl(var(--foreground))] block mb-1">
                    BioDigital Developer Key (`dk`):
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="e.g. 7f8a9b..."
                    className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                    <span>Free developer account at BioDigital:</span>
                    <a
                      href="https://developer.biodigital.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>developer.biodigital.com</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    Register an app under <strong>Viewer API</strong> with domain <code>localhost</code> or <code>127.0.0.1</code> to obtain your key.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-[hsl(var(--foreground))] block mb-1">
                    Custom Model ID (Optional):
                  </label>
                  <input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder={system.modelId}
                    className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                    Default model: <span className="font-mono text-[10px]">{system.modelId}</span>
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="px-3 py-2 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition text-xs font-medium"
                  >
                    Reset Defaults
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="px-3 py-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md transition"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
