import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  routineMomentLabels,
  routineMomentOptions,
  routineTypeLabels,
  routineTypes,
} from '@/src/domain/routines/routineDomain';
import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { CurrentLocation, SavedLocation } from '@/src/types/location';
import type { CreateRoutineInput, RoutinePreferredMoment, RoutineType, UserRoutine } from '@/src/types/routines';

interface RoutinesCardProps {
  currentLocation: CurrentLocation | null;
  savedLocations: SavedLocation[];
  routines: UserRoutine[];
  onAddRoutine: (input: CreateRoutineInput) => void;
  onSetRoutineEnabled: (id: string, enabled: boolean) => void;
  onRemoveRoutine: (id: string) => void;
}

type LocationOptionValue = 'sin_contexto' | 'actual' | `guardada:${string}`;

function locationContextLabel(routine: UserRoutine): string {
  if (routine.locationContext.kind === 'sin_contexto') {
    return 'Sin ubicación fija';
  }
  if (routine.locationContext.kind === 'actual') {
    return 'Ubicación actual';
  }
  return routine.locationContext.cityName;
}

export function RoutinesCard({
  currentLocation,
  savedLocations,
  routines,
  onAddRoutine,
  onSetRoutineEnabled,
  onRemoveRoutine,
}: RoutinesCardProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<RoutineType>('caminar_tarde');
  const [moment, setMoment] = useState<RoutinePreferredMoment>('tarde');
  const [locationValue, setLocationValue] = useState<LocationOptionValue>('sin_contexto');

  const locationOptions = useMemo(() => {
    const options: Array<{ label: string; value: LocationOptionValue }> = [{ label: 'Sin ubicación fija', value: 'sin_contexto' }];

    if (currentLocation) {
      options.push({
        label: `Actual · ${currentLocation.cityName}`,
        value: 'actual',
      });
    }

    savedLocations.forEach((location) => {
      options.push({
        label: location.cityName,
        value: `guardada:${location.id}`,
      });
    });

    return options;
  }, [currentLocation, savedLocations]);

  const addRoutine = () => {
    const normalizedTitle = title.trim();
    const input: CreateRoutineInput = {
      title: normalizedTitle.length > 0 ? normalizedTitle : routineTypeLabels[type],
      type,
      preferredMoment: moment,
      locationContext:
        locationValue === 'sin_contexto'
          ? { kind: 'sin_contexto' }
          : locationValue === 'actual'
            ? { kind: 'actual' }
            : {
                kind: 'guardada',
                locationId: locationValue.replace('guardada:', ''),
                cityName:
                  savedLocations.find((location) => `guardada:${location.id}` === locationValue)?.cityName ??
                  'Ubicación guardada',
              },
    };

    onAddRoutine(input);
    setTitle('');
    setMoment('tarde');
    setType('caminar_tarde');
    setLocationValue('sin_contexto');
  };

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.rutinas} title="Rutinas personales" />

      {routines.length === 0 ? (
        <Text style={styles.emptyText}>
          Define rutinas para decisiones más personales.
        </Text>
      ) : (
        <View style={styles.routineList}>
          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View style={styles.routineHeaderCopy}>
                  <Text style={styles.routineTitle}>{routine.title}</Text>
                  <Text numberOfLines={1} style={styles.routineSubtitle}>
                    {routineTypeLabels[routine.type]} · {routineMomentLabels[routine.preferredMoment]} ·{' '}
                    {locationContextLabel(routine)}
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={`Activar o desactivar ${routine.title}`}
                  onValueChange={(enabled) => onSetRoutineEnabled(routine.id, enabled)}
                  thumbColor={routine.enabled ? appTheme.colors.secondary : appTheme.colors.onSurfaceVariant}
                  trackColor={{ false: '#405470', true: 'rgba(154,194,255,0.45)' }}
                  value={routine.enabled}
                />
              </View>
              <MotionPressable
                accessibilityLabel={`Eliminar rutina ${routine.title}`}
                accessibilityRole="button"
                hapticType="selection"
                hitSlop={8}
                onPress={() => onRemoveRoutine(routine.id)}
                pressedOpacity={0.9}
                pressedScale={0.985}
                reducedMotionPressedOpacity={0.86}
                style={styles.deleteButton}>
                <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="delete-outline" size={14} />
                <Text style={styles.deleteLabel}>Eliminar</Text>
              </MotionPressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.formLabel}>Nueva rutina</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="pencil-outline" size={15} />
        <TextInput
          accessibilityLabel="Título de nueva rutina"
          autoCapitalize="sentences"
          autoCorrect={false}
          onChangeText={setTitle}
          placeholder="Ej. Paseo del perro"
          placeholderTextColor="rgba(198,210,232,0.48)"
          style={styles.input}
          value={title}
        />
      </View>

      <Text style={styles.formSubLabel}>Tipo</Text>
      <View style={styles.chipsRow}>
        {routineTypes.map((item) => {
          const active = item === type;
          return (
            <MotionPressable
              accessibilityLabel={`Tipo ${routineTypeLabels[item]}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hapticType="selection"
              hitSlop={6}
              key={item}
              onPress={() => setType(item)}
              pressedOpacity={0.9}
              pressedScale={0.985}
              reducedMotionPressedOpacity={0.86}
              style={[styles.chip, active ? styles.chipActive : null]}>
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{routineTypeLabels[item]}</Text>
            </MotionPressable>
          );
        })}
      </View>

      <Text style={styles.formSubLabel}>Momento preferido</Text>
      <View style={styles.chipsRow}>
        {routineMomentOptions.map((item) => {
          const active = item === moment;
          return (
            <MotionPressable
              accessibilityLabel={`Momento ${routineMomentLabels[item]}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hapticType="selection"
              hitSlop={6}
              key={item}
              onPress={() => setMoment(item)}
              pressedOpacity={0.9}
              pressedScale={0.985}
              reducedMotionPressedOpacity={0.86}
              style={[styles.chip, active ? styles.chipActive : null]}>
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{routineMomentLabels[item]}</Text>
            </MotionPressable>
          );
        })}
      </View>

      <Text style={styles.formSubLabel}>Contexto de ubicación</Text>
      <View style={styles.chipsRow}>
        {locationOptions.map((option) => {
          const active = option.value === locationValue;
          return (
            <MotionPressable
              accessibilityLabel={`Ubicación ${option.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hapticType="selection"
              hitSlop={6}
              key={option.value}
              onPress={() => setLocationValue(option.value)}
              pressedOpacity={0.9}
              pressedScale={0.985}
              reducedMotionPressedOpacity={0.86}
              style={[styles.chip, active ? styles.chipActive : null]}>
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{option.label}</Text>
            </MotionPressable>
          );
        })}
      </View>

      <PrimaryPillButton
        accessibilityLabel="Guardar rutina personal"
        label="Guardar rutina"
        onPress={addRoutine}
        style={styles.addButton}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12.4,
    lineHeight: 17,
  },
  routineList: {
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.sm,
  },
  routineCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: appTheme.spacing.md,
  },
  routineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routineHeaderCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  routineTitle: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  routineSubtitle: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 2,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
  deleteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    gap: 4,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: 4,
  },
  deleteLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11,
    lineHeight: 16,
  },
  formLabel: {
    color: appTheme.colors.primary,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    marginTop: appTheme.spacing.xs,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  input: {
    color: appTheme.colors.primary,
    flex: 1,
    ...appTheme.typography.body,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 0,
  },
  formSubLabel: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.8,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  chip: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(157,198,255,0.2)',
    borderColor: 'rgba(157,198,255,0.58)',
  },
  chipText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  chipTextActive: {
    color: appTheme.colors.primary,
  },
  addButton: {
    marginTop: appTheme.spacing.md,
  },
});
