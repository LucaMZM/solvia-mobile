import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ReadMoreText } from '@/src/components/ui/ReadMoreText';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appTheme } from '@/src/theme/tokens';

interface RopaReasoningItem {
  id: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  detail: string;
}

interface RopaReasoningCardProps {
  items: RopaReasoningItem[];
}

export function RopaReasoningCard({ items }: RopaReasoningCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="lightbulb-on-outline" title="Claves rápidas" />
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.id} style={[styles.item, index === items.length - 1 ? styles.lastItem : null]}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons color={appTheme.colors.secondary} name={item.iconName} size={15} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <ReadMoreText
                detailSummary={item.title}
                iconName={item.iconName}
                numberOfLines={2}
                style={styles.detail}
                text={item.detail}
                title={item.title}
              />
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: appTheme.spacing.xs,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 9,
  },
  lastItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    marginTop: 2,
    width: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.2,
    lineHeight: 17,
  },
  detail: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.4,
    lineHeight: 15,
    marginTop: 1,
  },
});
