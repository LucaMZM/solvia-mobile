import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { buildLocationSubtitle, createSavedLocation, normalizeSearchQuery } from '@/src/domain/location/locationDomain';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { useLocationSelectionModel } from '@/src/features/location/useLocationSelectionModel';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { searchCityLocations } from '@/src/services/location/locationService';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

const SEARCH_DEBOUNCE_MS = 280;

export function LocationSearchCard() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const normalizedQuery = useMemo(() => normalizeSearchQuery(debouncedQuery), [debouncedQuery]);
  const { addSavedLocation, selectSavedLocation } = useLocationSelectionModel();

  const searchQuery = useQuery({
    queryKey: ['location-city-search', normalizedQuery],
    enabled: normalizedQuery.length >= 2,
    queryFn: async () => searchCityLocations(normalizedQuery),
    staleTime: 60_000,
  });

  const results = searchQuery.data ?? [];

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.ubicaciones} title="Añadir ubicación" />
      <View style={styles.searchBox}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="magnify" size={16} />
        <TextInput
          accessibilityLabel="Buscar ciudad para añadir"
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Buscar ciudad..."
          placeholderTextColor="rgba(198,210,232,0.48)"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
      </View>

      {normalizedQuery.length < 2 ? (
        <Text numberOfLines={1} style={styles.help}>
          Escribe 2+ caracteres para buscar ciudad.
        </Text>
      ) : null}

      {searchQuery.isFetching ? <Text style={styles.help}>Buscando…</Text> : null}
      {searchQuery.isError ? <Text style={styles.error}>No pudimos buscar ahora.</Text> : null}

      <View style={styles.resultList}>
        {results.slice(0, 5).map((result) => (
          <View key={result.id} style={styles.resultRow}>
            <View style={styles.resultCopy}>
              <Text style={styles.resultTitle}>{result.cityName}</Text>
              <Text numberOfLines={1} style={styles.resultSubtitle}>
                {buildLocationSubtitle(result) || 'Ciudad sugerida'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={`Guardar ${result.cityName}`}
              accessibilityRole="button"
              hitSlop={6}
              onPress={() => {
                const saved = createSavedLocation(result);
                const savedId = addSavedLocation(saved);
                selectSavedLocation(savedId);
                setQuery('');
              }}
              style={styles.addButton}>
              <MaterialCommunityIcons color={appTheme.colors.primary} name="plus" size={14} />
              <Text style={styles.addLabel}>Guardar</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  input: {
    color: appTheme.colors.primary,
    flex: 1,
    ...appTheme.typography.body,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
  help: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    color: appTheme.colors.danger,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
  resultList: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  resultRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  resultCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  resultTitle: {
    color: appTheme.colors.primary,
    ...appTheme.typography.body,
    fontSize: 16,
    lineHeight: 22,
  },
  resultSubtitle: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 2,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 17,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 7,
  },
  addLabel: {
    color: appTheme.colors.primary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.08,
  },
});
