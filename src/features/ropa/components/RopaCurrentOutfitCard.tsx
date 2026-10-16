import { StyleSheet } from 'react-native';

import { KeyValueRows } from '@/src/components/ui/KeyValueRows';
import { ReadMoreText } from '@/src/components/ui/ReadMoreText';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { toOutfitRows } from '@/src/features/recommendations/outfitRows';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { OutfitRecommendation } from '@/src/types/recommendations';

interface RopaCurrentOutfitCardProps {
  outfit: OutfitRecommendation;
}

export function RopaCurrentOutfitCard({ outfit }: RopaCurrentOutfitCardProps) {
  const rows = toOutfitRows(outfit);

  return (
    <SectionCard>
      <SectionHeading iconName="tshirt-crew-outline" title="Ropa ahora" />
      <KeyValueRows items={rows} />
      <ReadMoreText
        detailSummary="Motivo de la recomendación actual"
        iconName="tshirt-crew-outline"
        numberOfLines={2}
        style={styles.note}
        text={outfit.note}
        title="Por qué esta ropa"
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  note: {
    ...textStyles.support,
    borderTopColor: 'rgba(154,172,202,0.3)',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.sm,
  },
});
