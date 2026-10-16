import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildLocationSubtitle, favoriteLocationTagLabels } from '@/src/domain/location/locationDomain';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { FavoriteTagPicker } from '@/src/features/location/components/FavoriteTagPicker';
import { useLocationSelectionModel } from '@/src/features/location/useLocationSelectionModel';
import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { triggerSelectionHaptic } from '@/src/services/feedback/haptics';
import { getLocationSourceLabel } from '@/src/services/location/sourceLabel';
import { useAppLifecycleStore } from '@/src/state/appLifecycleStore';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

function ActionIconButton({
  iconName,
  label,
  onPress,
  reducedMotionEnabled,
  disabled = false,
}: {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  reducedMotionEnabled: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        void triggerSelectionHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        disabled ? styles.iconButtonDisabled : null,
        pressed && !disabled ? (reducedMotionEnabled ? styles.iconButtonPressedReducedMotion : styles.iconButtonPressed) : null,
      ]}>
      <MaterialCommunityIcons
        color={disabled ? 'rgba(198,210,232,0.35)' : appTheme.colors.onSurfaceVariant}
        name={iconName}
        size={15}
      />
    </Pressable>
  );
}

export function SavedLocationsCard() {
  const reducedMotionEnabled = useReducedMotionPreference();
  const clearLocationPromptDeferral = useAppLifecycleStore((state) => state.clearLocationPromptDeferral);
  const { status: briefingStatus, dailyBrief } = useWeatherBriefing();
  const {
    currentLocation,
    locationQuery,
    savedLocations,
    selectedLocation,
    selectCurrentLocation,
    selectSavedLocation,
    removeSavedLocation,
    moveSavedLocation,
    setFavoriteTag,
  } = useLocationSelectionModel();

  const activeBriefLine = briefingStatus === 'ready' ? dailyBrief?.shortLine : null;

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.ubicaciones} title="Ubicaciones guardadas" />

      <Text style={styles.groupLabel}>Ubicación actual</Text>
      {currentLocation ? (
        <Pressable
          accessibilityLabel={`Usar ubicación actual ${currentLocation.cityName}`}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedLocation.kind === 'current' }}
          onPress={() => {
            void triggerSelectionHaptic();
            selectCurrentLocation();
          }}
          style={({ pressed }) => [
            styles.currentCard,
            selectedLocation.kind === 'current' ? styles.activeCard : null,
            pressed ? (reducedMotionEnabled ? styles.savedCardPressedReducedMotion : styles.savedCardPressed) : null,
          ]}>
          <View style={styles.rowTop}>
            <View style={styles.rowCopy}>
              <Text style={styles.cityName}>{currentLocation.cityName}</Text>
              <Text numberOfLines={1} style={styles.subtle}>
                {buildLocationSubtitle(currentLocation) || 'Ubicación del dispositivo'} ·{' '}
                {getLocationSourceLabel(currentLocation.source)}
              </Text>
              {selectedLocation.kind === 'current' && activeBriefLine ? (
                <Text numberOfLines={1} style={styles.briefLine}>
                  {activeBriefLine}
                </Text>
              ) : null}
            </View>
            {selectedLocation.kind === 'current' ? <Text style={styles.activeBadge}>Activa</Text> : null}
          </View>
        </Pressable>
      ) : (
        <View style={styles.missingCurrent}>
          <Text style={styles.emptyCurrent}>
            {locationQuery.isLoading ? 'Buscando ubicación actual…' : 'No hay ubicación actual disponible por ahora.'}
          </Text>
          {!locationQuery.isLoading ? (
            <PrimaryPillButton
              accessibilityLabel="Activar ubicación actual"
              label="Activar ubicación"
              onPress={() => {
                clearLocationPromptDeferral();
                void locationQuery.refetch();
              }}
            />
          ) : null}
        </View>
      )}

      <Text style={[styles.groupLabel, styles.savedGroupLabel]}>Favoritos y ciudades</Text>
      {savedLocations.length === 0 ? (
        <Text style={styles.emptySaved}>Aún no tienes ubicaciones guardadas.</Text>
      ) : (
        <View style={styles.savedList}>
          {savedLocations.map((location, index) => {
            const isActive = selectedLocation.kind === 'saved' && selectedLocation.id === location.id;
            const subtitle = location.favoriteTag
              ? favoriteLocationTagLabels[location.favoriteTag]
              : buildLocationSubtitle(location) || 'Ciudad guardada';

            return (
              <View key={location.id} style={[styles.savedCard, isActive ? styles.activeCard : null]}>
                <Pressable
                  accessibilityLabel={`Usar ${location.cityName}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => {
                    void triggerSelectionHaptic();
                    selectSavedLocation(location.id);
                  }}
                  style={({ pressed }) => [
                    styles.rowTop,
                    pressed ? (reducedMotionEnabled ? styles.savedRowPressedReducedMotion : styles.savedRowPressed) : null,
                  ]}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.cityName}>{location.cityName}</Text>
                    <Text numberOfLines={1} style={styles.subtle}>
                      {subtitle}
                    </Text>
                    {isActive && activeBriefLine ? (
                      <Text numberOfLines={1} style={styles.briefLine}>
                        {activeBriefLine}
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? <Text style={styles.activeBadge}>Activa</Text> : null}
                </Pressable>

                <FavoriteTagPicker
                  onChange={(tag) => setFavoriteTag(location.id, tag)}
                  value={location.favoriteTag}
                />

                <View style={styles.actionsRow}>
                  <ActionIconButton
                    disabled={index === 0}
                    iconName="arrow-up"
                    label={`Mover ${location.cityName} arriba`}
                    onPress={() => moveSavedLocation(location.id, 'up')}
                    reducedMotionEnabled={reducedMotionEnabled}
                  />
                  <ActionIconButton
                    disabled={index === savedLocations.length - 1}
                    iconName="arrow-down"
                    label={`Mover ${location.cityName} abajo`}
                    onPress={() => moveSavedLocation(location.id, 'down')}
                    reducedMotionEnabled={reducedMotionEnabled}
                  />
                  <ActionIconButton
                    iconName="delete-outline"
                    label={`Eliminar ${location.cityName}`}
                    onPress={() => removeSavedLocation(location.id)}
                    reducedMotionEnabled={reducedMotionEnabled}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.08,
  },
  savedGroupLabel: {
    marginTop: appTheme.spacing.md,
  },
  currentCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: appTheme.spacing.sm,
    padding: appTheme.spacing.md,
  },
  rowTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  cityName: {
    color: appTheme.colors.primary,
    ...appTheme.typography.body,
    fontSize: 17,
    lineHeight: 22,
  },
  subtle: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 1,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 17,
  },
  briefLine: {
    color: appTheme.colors.onSurface,
    marginTop: 6,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  activeBadge: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.5,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  activeCard: {
    borderColor: 'rgba(154,194,255,0.56)',
    shadowColor: appTheme.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  emptyCurrent: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
  missingCurrent: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  emptySaved: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  savedList: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  savedCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: appTheme.spacing.md,
  },
  savedCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  savedCardPressedReducedMotion: {
    opacity: 0.9,
  },
  savedRowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  savedRowPressedReducedMotion: {
    opacity: 0.86,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconButtonDisabled: {
    opacity: 0.55,
  },
  iconButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  iconButtonPressedReducedMotion: {
    opacity: 0.84,
  },
});
