import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PremiumSkeleton } from '@/src/components/ui/PremiumSkeleton';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { LaunchFrame } from '@/src/features/launch/components/LaunchFrame';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

interface SolviaFirstRunLoadingProps {
  weatherState: WeatherState;
  accentColor: string;
  gradient: [string, string, string];
  onCompleted: () => void;
}

function resolveLoadingTitle(elapsedMs: number): string {
  if (elapsedMs > 5000) {
    return 'Cerrando tu primera lectura.';
  }
  return 'Preparando decisiones para hoy.';
}

function resolveLoadingSupport(params: {
  elapsedMs: number;
  locationPermissionDenied: boolean;
  offlineMessage: string | null;
}): string {
  if (params.locationPermissionDenied) {
    return 'Sin ubicación precisa. Seguimos con una base útil.';
  }
  if (params.offlineMessage) {
    return params.offlineMessage;
  }
  if (params.elapsedMs > 5000) {
    return 'La red va lenta. Entrarás en unos segundos.';
  }
  return 'Conectando clima, ubicación y contexto.';
}

export function SolviaFirstRunLoading({
  weatherState,
  accentColor,
  gradient,
  onCompleted,
}: SolviaFirstRunLoadingProps) {
  const briefing = useWeatherBriefing();
  const [elapsedMs, setElapsedMs] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 350);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (briefing.status === 'loading') {
      return;
    }
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    const timeout = setTimeout(() => {
      onCompleted();
    }, 420);

    return () => clearTimeout(timeout);
  }, [briefing.status, onCompleted]);

  const canContinueNow = elapsedMs >= 5000;
  const loadingTitle = useMemo(() => resolveLoadingTitle(elapsedMs), [elapsedMs]);
  const loadingSupport = useMemo(
    () =>
      resolveLoadingSupport({
        elapsedMs,
        locationPermissionDenied: briefing.locationPermissionDenied,
        offlineMessage: briefing.offlineMessage,
      }),
    [briefing.locationPermissionDenied, briefing.offlineMessage, elapsedMs],
  );

  const statusLine =
    briefing.status === 'ready'
      ? 'Todo listo. Entrando en Hoy.'
      : briefing.status === 'error'
        ? 'Entrarás con respaldo activo.'
        : briefing.status === 'empty'
          ? 'Preparando base mínima.'
          : 'Sincronizando módulos.';

  const finishNow = () => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onCompleted();
  };

  return (
    <LaunchFrame
      accentColor={accentColor}
      gradient={gradient}
      subtitle={loadingSupport}
      title={loadingTitle}
      weatherState={weatherState}>
      <View style={styles.content}>
        <SectionCard>
          <PremiumSkeleton borderRadius={appTheme.radii.full} height={14} width={152} />
          <PremiumSkeleton height={30} style={styles.skeletonMd} width="78%" />
          <PremiumSkeleton height={18} style={styles.skeletonSm} width="90%" />
          <PremiumSkeleton height={18} style={styles.skeletonXs} width="68%" />

          <View style={styles.lineBox}>
            <Text style={styles.statusLine}>{statusLine}</Text>
          </View>

          {briefing.locationPermissionDenied ? (
            <Text style={styles.hint}>Sin ubicación precisa, Solvía mantiene recomendaciones conservadoras.</Text>
          ) : null}
        </SectionCard>

        {canContinueNow ? (
          <View style={styles.actions}>
            <PrimaryPillButton
              accessibilityLabel="Continuar mientras termina de cargar"
              label="Continuar mientras carga"
              onPress={finishNow}
            />
          </View>
        ) : null}
      </View>
    </LaunchFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: appTheme.spacing.md,
  },
  skeletonMd: {
    marginTop: appTheme.spacing.md,
  },
  skeletonSm: {
    marginTop: appTheme.spacing.sm,
  },
  skeletonXs: {
    marginTop: appTheme.spacing.xs,
  },
  lineBox: {
    borderColor: 'rgba(142,160,191,0.3)',
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    marginTop: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  statusLine: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 12.8,
    lineHeight: 17,
  },
  hint: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontSize: 11.8,
    lineHeight: 16,
  },
  actions: {
    alignItems: 'flex-start',
  },
});
