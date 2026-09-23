import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { TimeveraLogo } from './TimeveraLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capture beforeinstallprompt for Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-xs sm:max-w-md bg-white dark:bg-[#150a0a] border border-red-200 dark:border-red-900 shadow-2xl rounded-2xl overflow-hidden my-6">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="font-brand font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider">
              Install Timevera App
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 text-center">
          <div className="flex justify-center">
            <div className="p-2 sm:p-3 bg-red-50 dark:bg-[#200e0e] rounded-2xl border border-red-200 dark:border-red-900 shadow-md">
              <TimeveraLogo size="md" variant="gold" showTagline={false} />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-brand font-bold text-lg sm:text-xl md:text-2xl text-zinc-900 dark:text-white">
              Timevera Official Mobile App
            </h4>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              Apne mobile ki home screen par Timevera ka icon install karein aur bina kisi browser ke 1-tap me watches dekhein!
            </p>
          </div>

          {isInstalled ? (
            <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm space-y-1">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-emerald-500" />
              <p className="font-bold">App Already Installed on this Device!</p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                Aapke phone me Timevera App pehle se maujood hai.
              </p>
            </div>
          ) : isIOS ? (
            /* iPhone Safari Guide */
            <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#1c0e0e] border border-red-100 dark:border-red-950 rounded-xl text-left space-y-2 sm:space-y-3 text-[11px] sm:text-xs md:text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-bold text-red-600 dark:text-red-400 text-center text-xs sm:text-sm">
                iPhone / iPad Users Ke Liye:
              </p>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                <span>Safari me neeche <Share className="w-3.5 h-3.5 inline text-blue-500" /> <strong>Share</strong> button par click karein.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                <span>Scroll karke <PlusSquare className="w-3.5 h-3.5 inline text-zinc-700 dark:text-zinc-200" /> <strong>Add to Home Screen</strong> select karein.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                <span>Top-right me <strong>Add</strong> par click karein. App install ho jayega!</span>
              </div>
            </div>
          ) : (
            /* Android / Chrome One Click Install */
            <div className="space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Install App on Mobile (1-Tap)</span>
                </button>
              ) : (
                <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#1c0e0e] border border-red-100 dark:border-red-950 rounded-xl text-left space-y-2 sm:space-y-3 text-[11px] sm:text-xs md:text-sm text-zinc-700 dark:text-zinc-300">
                  <p className="font-bold text-red-600 dark:text-red-400 text-center text-xs sm:text-sm">
                    Android Phone me Install Karne Ka Tarika:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                    <span>Browser ke top right <strong>3 Dots (⋮)</strong> par click karein.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                    <span><strong>"Install App"</strong> ya <strong>"Add to Home screen"</strong> par click karein.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features bullet list */}
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] md:text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span>Direct 1-Tap Access</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span>Fast & Lightweight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
