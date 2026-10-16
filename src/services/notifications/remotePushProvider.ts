import { isCapabilityAvailable } from '@/src/services/platform/runtimeCapabilities';
import { isPremiumFeatureEnabled } from '@/src/services/premium/premiumFeatureFlags';

export interface RemotePushRegistrationInput {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface RemotePushSyncResult {
  status: 'synced' | 'ignored' | 'failed';
  reason?: string;
  requiresDevelopmentBuild?: boolean;
}

export interface RemotePushProvider {
  id: string;
  syncRegistration: (input: RemotePushRegistrationInput) => Promise<RemotePushSyncResult>;
}

const disabledRemotePushProvider: RemotePushProvider = {
  id: 'remote-push-disabled',
  syncRegistration: async () => ({
    status: 'ignored',
    reason: 'Push remoto premium no configurado en este runtime.',
    requiresDevelopmentBuild: true,
  }),
};

export function getRemotePushProvider(): RemotePushProvider {
  const enabled = isPremiumFeatureEnabled('remote_push_advanced');
  const runtimeCapable = isCapabilityAvailable('remote_push');

  if (enabled && runtimeCapable) {
    return {
      ...disabledRemotePushProvider,
      id: 'remote-push-provider-pending',
    };
  }

  return disabledRemotePushProvider;
}
