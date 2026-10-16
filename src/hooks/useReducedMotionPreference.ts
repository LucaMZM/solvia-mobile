import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotionPreference() {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        if (mounted) {
          setReducedMotionEnabled(Boolean(isEnabled));
        }
      })
      .catch(() => {
        if (mounted) {
          setReducedMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      setReducedMotionEnabled(Boolean(isEnabled));
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotionEnabled;
}
