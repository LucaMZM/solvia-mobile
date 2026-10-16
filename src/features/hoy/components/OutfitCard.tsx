import { useState } from 'react';
import { KeyValueRows } from '@/src/components/ui/KeyValueRows';
import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { StyleSheet, Text } from 'react-native';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { OutfitRecommendation } from '@/src/types/recommendations';

interface OutfitCardProps {
  outfit: OutfitRecommendation;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const [isSheetVisible, setSheetVisible] = useState(false);
  const compactRows = [
    { id: 'base', label: 'Base', value: outfit.superior },
    { id: 'extra', label: 'Extra', value: outfit.accesorios },
  ];

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir detalle de Qué ponerte"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setSheetVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading iconName={appIcons.modules.ropa} title="Qué ponerte" />
          <KeyValueRows items={compactRows} />
          <Text numberOfLines={1} style={styles.note}>
            {outfit.note}
          </Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.ropa}
        onClose={() => setSheetVisible(false)}
        rows={[
          { label: 'Superior', value: outfit.superior },
          { label: 'Capa', value: outfit.capa },
          { label: 'Calzado', value: outfit.calzado },
          { label: 'Accesorios', value: outfit.accesorios },
          { label: 'Nota', value: outfit.note },
        ]}
        summary="Guía de ropa para salir cómodo en esta franja."
        title="Qué ponerte"
        visible={isSheetVisible}
      />
    </>
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
