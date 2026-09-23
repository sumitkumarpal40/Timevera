import { useEffect, useRef } from 'react';

// Module-level counter: tracks how many modals are currently open
let openModalCount = 0;

/**
 * useModalBackButton
 * 
 * Mobile hardware back button handle करता है।
 * 
 * CRITICAL: Multiple modals के बीच transition पर race condition fix।
 * - सिर्फ पहला modal खुलने पर history.pushState
 * - सिर्फ आखिरी modal बंद होने पर history.back()
 * - बीच के transitions पर कोई history manipulation नहीं
 */
export function useModalBackButton(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Increment global counter
    openModalCount++;
    const isFirstModal = openModalCount === 1;

    let pushedState = false;
    let handledByBack = false;

    // Only push history state for the FIRST modal
    if (isFirstModal) {
      try {
        window.history.pushState({ modalOpen: true, ts: Date.now() }, '');
        pushedState = true;
      } catch (e) {
        pushedState = false;
      }
    }

    const handlePopState = () => {
      handledByBack = true;
      pushedState = false;
      // Reset counter when back is pressed (all modals close)
      openModalCount = 0;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      openModalCount--;

      // Only call history.back() if:
      // 1. We pushed the state (isFirstModal)
      // 2. Not handled by back button
      // 3. This is the LAST modal closing (counter now 0)
      if (pushedState && !handledByBack && openModalCount === 0) {
        try {
          if (window.history.state?.modalOpen === true) {
            window.history.back();
          }
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [isOpen]);
}
