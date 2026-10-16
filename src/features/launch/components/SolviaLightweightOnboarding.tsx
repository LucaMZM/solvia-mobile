import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { LaunchFrame } from '@/src/features/launch/components/LaunchFrame';
import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { triggerLightHaptic, triggerSelectionHaptic } from '@/src/services/feedback/haptics';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

type LocationPermissionResult = 'granted' | 'denied' | 'error';
type LocationPromptStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  support: string;
  points: Array<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }>;
}

const slides: OnboardingSlide[] = [
  {
    id: 'decisions',
    eyebrow: 'Lo esencial',
    title: 'Solvía convierte el clima en decisiones claras.',
    support: 'Qué hacer, qué ponerte y cuándo salir sin tablas ni ruido.',
    points: [
      { icon: appIcons.modules.modoPlan, label: 'Decisión al abrir' },
      { icon: appIcons.modules.ropa, label: 'Ropa por confort real' },
      { icon: appIcons.modules.solUv, label: 'Sol y UV en claro' },
    ],
  },
  {
    id: 'planning',
    eyebrow: 'Planifica mejor',
    title: 'Anticipa tu día en segundos.',
    support: 'Trayecto, Modo Plan, rutinas y resumen diario en una sola vista.',
    points: [
      { icon: appIcons.modules.trayecto, label: 'Trayecto: salir ahora o esperar' },
      { icon: appIcons.modules.resumenDiario, label: 'Resumen diario programable' },
      { icon: appIcons.modules.rutinas, label: 'Rutinas con contexto repetido' },
    ],
  },
  {
    id: 'location',
    eyebrow: 'Ubicación',
    title: 'Con tu ubicación, Solvía afina cada recomendación.',
    support: 'Permítela ahora o elige una ciudad guardada después.',
    points: [
      { icon: appIcons.modules.ubicaciones, label: 'Precisión por zona y hora' },
      { icon: appIcons.tabs.hoy, label: 'Más coherencia en Hoy, Sol y Ropa' },
      { icon: appIcons.tabs.trayecto, label: 'Trayecto más fiable' },
    ],
  },
];

interface SolviaLightweightOnboardingProps {
  weatherState: WeatherState;
  accentColor: string;
  gradient: [string, string, string];
  onFinish: () => void;
  onSkipLocation: () => void;
  onRequestLocationPermission: () => Promise<LocationPermissionResult>;
}

function messageByPermissionStatus(status: LocationPromptStatus): string | null {
  if (status === 'granted') {
    return 'Listo. Usaremos ubicación precisa para personalizar mejor tus decisiones.';
  }
  if (status === 'denied') {
    return 'Sin problema. Podrás activarla o elegir una ciudad guardada cuando quieras.';
  }
  if (status === 'error') {
    return 'No pudimos activar ubicación ahora. Puedes continuar y revisarlo más tarde.';
  }
  return null;
}

export function SolviaLightweightOnboarding({
  weatherState,
  accentColor,
  gradient,
  onFinish,
  onSkipLocation,
  onRequestLocationPermission,
}: SolviaLightweightOnboardingProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const [step, setStep] = useState(0);
  const [locationPromptStatus, setLocationPromptStatus] = useState<LocationPromptStatus>('idle');
  const progress = useSharedValue(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;
  const locationMessage = useMemo(
    () => messageByPermissionStatus(locationPromptStatus),
    [locationPromptStatus],
  );

  useEffect(() => {
    progress.value = withTiming(step, {
      duration: reducedMotionEnabled ? 0 : 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotionEnabled, step]);

  const progressPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 46 }],
  }));

  const next = () => {
    void triggerLightHaptic();

    if (isLast) {
      if (locationPromptStatus === 'idle') {
        onSkipLocation();
      }
      onFinish();
      return;
    }
    setStep((current) => Math.min(current + 1, slides.length - 1));
  };

  const handleRequestLocation = async () => {
    void triggerSelectionHaptic();
    setLocationPromptStatus('loading');
    const result = await onRequestLocationPermission();
    if (result === 'granted') {
      setLocationPromptStatus('granted');
      return;
    }
    if (result === 'denied') {
      setLocationPromptStatus('denied');
      return;
    }
    setLocationPromptStatus('error');
  };

  return (
    <LaunchFrame
      accentColor={accentColor}
      gradient={gradient}
      subtitle="Empieza en menos de un minuto."
      title="Bienvenido a Solvía"
      weatherState={weatherState}>
      <View style={styles.content}>
        <SectionCard>
          <Animated.View
            entering={reducedMotionEnabled ? FadeIn.duration(0) : SlideInRight.duration(340).easing(Easing.out(Easing.cubic))}
            exiting={reducedMotionEnabled ? FadeOut.duration(0) : SlideOutLeft.duration(260).easing(Easing.inOut(Easing.quad))}
            key={slide.id}
            layout={reducedMotionEnabled ? undefined : LinearTransition.duration(220)}>
            <View style={styles.progressRail}>
              <Animated.View style={[styles.progressPill, progressPillStyle]} />
            </View>
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSupport}>{slide.support}</Text>

            <View style={styles.points}>
              {slide.points.map((point, pointIndex) => (
                <Animated.View
                  entering={
                    reducedMotionEnabled
                      ? FadeIn.duration(0)
                      : FadeInUp.duration(280).delay(60 + (pointIndex * 50)).easing(Easing.out(Easing.cubic))
                  }
                  key={point.label}
                  layout={reducedMotionEnabled ? undefined : LinearTransition.duration(180)}
                  style={styles.pointRow}>
                  <MaterialCommunityIcons color={accentColor} name={point.icon} size={18} />
                  <Text style={styles.pointLabel}>{point.label}</Text>
                </Animated.View>
              ))}
            </View>

            {isLast ? (
              <View style={styles.locationBlock}>
                <PrimaryPillButton
                  accessibilityLabel="Permitir ubicación para recomendaciones más precisas"
                  label={locationPromptStatus === 'loading' ? 'Solicitando ubicación…' : 'Permitir ubicación'}
                  onPress={() => void handleRequestLocation()}
                />
                <MotionPressable
                  accessibilityRole="button"
                  hapticType="light"
                  hitSlop={6}
                  onPress={() => {
                    onSkipLocation();
                    onFinish();
                  }}
                  pressedOpacity={0.9}
                  pressedScale={0.98}
                  reducedMotionPressedOpacity={0.86}
                  style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonLabel}>Seguir sin ubicación precisa</Text>
                </MotionPressable>
                {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}
              </View>
            ) : null}
          </Animated.View>
        </SectionCard>

        <Animated.View layout={reducedMotionEnabled ? undefined : LinearTransition.duration(200)} style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((item, index) => (
              <Animated.View
                key={item.id}
                layout={reducedMotionEnabled ? undefined : LinearTransition.duration(220)}
                style={[
                  styles.dot,
                  index === step ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
          <PrimaryPillButton
            accessibilityLabel={isLast ? 'Entrar a Solvía' : 'Siguiente paso'}
            label={isLast ? 'Entrar a Solvía' : 'Siguiente'}
            onPress={next}
          />
        </Animated.View>
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
  eyebrow: {
    color: appTheme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    ...appTheme.typography.labelCaps,
    fontSize: 9,
    letterSpacing: 1.1,
    lineHeight: 12,
  },
  slideTitle: {
    color: appTheme.colors.primary,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.title,
    fontSize: 26,
    lineHeight: 31,
  },
  slideSupport: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
  },
  points: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.md,
  },
  progressRail: {
    backgroundColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.full,
    height: 6,
    marginBottom: appTheme.spacing.sm,
    overflow: 'hidden',
    width: 136,
  },
  progressPill: {
    backgroundColor: appTheme.colors.secondary,
    borderRadius: appTheme.radii.full,
    height: 6,
    width: 44,
  },
  pointRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 8,
  },
  pointLabel: {
    color: appTheme.colors.onSurface,
    flex: 1,
    ...appTheme.typography.functional,
    fontSize: 12.8,
    lineHeight: 17,
  },
  locationBlock: {
    borderTopColor: 'rgba(142,160,191,0.3)',
    borderTopWidth: 1,
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: appTheme.spacing.sm,
  },
  secondaryButtonLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
  },
  locationMessage: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12.5,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: appTheme.spacing.sm,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
  },
  dot: {
    backgroundColor: 'rgba(154,172,202,0.38)',
    borderRadius: appTheme.radii.full,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: appTheme.colors.secondary,
    width: 18,
  },
});
