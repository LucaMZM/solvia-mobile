import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';

interface RoadmapCardProps {
  copy: string;
}

export function RoadmapCard({ copy }: RoadmapCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="creation-outline" title="Evolución Solvía" />
      <View style={styles.row}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="star-four-points-outline" size={18} />
        <Text style={textStyles.support}>{copy}</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
});
