import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#638BFF]/20 to-[#47E6D0]/20 hover:from-[#638BFF]/30 hover:to-[#47E6D0]/30 border border-[#638BFF]/40 text-[#47E6D0] hover:text-white text-xs font-semibold shadow-sm transition-all"
        title="Install OS Lab on desktop or mobile home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl glass-panel-elevated p-6 border border-white/20 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#47E6D0]">Install OS Lab on iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/80 leading-relaxed mb-4">
                1. Tap the <strong className="text-white">Share</strong> icon in Safari&#39;s bottom toolbar.<br />
                2. Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.<br />
                3. Enjoy offline simulation capabilities directly from your home screen.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-[#638BFF] hover:bg-[#5077ea] text-white text-xs font-semibold shadow-md transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
