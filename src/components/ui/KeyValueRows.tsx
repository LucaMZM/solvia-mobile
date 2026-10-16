import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '@/src/theme/tokens';

export interface KeyValueRowItem {
  id: string;
  label: string;
  value: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface KeyValueRowsProps {
  items: readonly KeyValueRowItem[];
}

export function KeyValueRows({ items }: KeyValueRowsProps) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
          key={item.id}
          style={[styles.row, index === items.length - 1 ? styles.lastRow : null]}>
          <View style={styles.rowLeft}>
            {item.iconName ? (
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name={item.iconName} size={15} />
            ) : null}
            <Text style={styles.label}>{item.label}</Text>
          </View>
          <Text numberOfLines={1} style={styles.value}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: appTheme.spacing.sm,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: 'rgba(154,172,202,0.3)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingBottom: appTheme.spacing.sm,
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
  },
  label: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.08,
  },
  value: {
    color: appTheme.colors.onSurface,
    flex: 1,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.5,
    lineHeight: 18,
    marginLeft: appTheme.spacing.sm,
    textAlign: 'right',
  },
});
