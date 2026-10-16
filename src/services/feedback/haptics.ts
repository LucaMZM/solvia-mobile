import { Platform } from 'react-native';

type ExpoHaptics = typeof import('expo-haptics');

let cachedModule: ExpoHaptics | null | undefined;

async function getHapticsModule(): Promise<ExpoHaptics | null> {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = await import('expo-haptics');
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

function shouldAvoidHaptics() {
  // Keep this subtle and opt for iOS-first feedback profile.
  return Platform.OS !== 'ios';
}

export async function triggerLightHaptic() {
  if (shouldAvoidHaptics()) {
    return;
  }

  const haptics = await getHapticsModule();
  if (!haptics) {
    return;
  }

  try {
    await haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no-op: keep interactions resilient in Expo Go and limited runtimes.
  }
}

export async function triggerSelectionHaptic() {
  if (shouldAvoidHaptics()) {
    return;
  }

  const haptics = await getHapticsModule();
  if (!haptics) {
    return;
  }

  try {
    await haptics.selectionAsync();
  } catch {
    // no-op by design
  }
}
