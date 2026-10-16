import { useMemo, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { appTheme } from '@/src/theme/tokens';

interface ReadMoreTextProps {
  text: string;
  title: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  detailSummary?: string;
}

function shouldShowReadMore(text: string): boolean {
  return text.trim().length > 88;
}

export function ReadMoreText({
  text,
  title,
  iconName = 'text-box-search-outline',
  numberOfLines = 2,
  style,
  detailSummary,
}: ReadMoreTextProps) {
  const [isVisible, setVisible] = useState(false);
  const showReadMore = useMemo(() => shouldShowReadMore(text), [text]);

  return (
    <>
      <Text numberOfLines={showReadMore ? numberOfLines : undefined} style={style}>
        {text}
      </Text>

      {showReadMore ? (
        <MotionPressable
          accessibilityLabel={`Leer más: ${title}`}
          accessibilityRole="button"
          hapticType="selection"
          hitSlop={6}
          onPress={() => setVisible(true)}
          pressedOpacity={0.92}
          pressedScale={0.99}
          reducedMotionPressedOpacity={0.88}
          style={styles.readMoreButton}>
          <Text style={styles.readMoreLabel}>Leer más</Text>
        </MotionPressable>
      ) : null}

      <PremiumDetailSheet
        iconName={iconName}
        onClose={() => setVisible(false)}
        summary={detailSummary}
        title={title}
        visible={isVisible}>
        <Text style={styles.fullText}>{text}</Text>
      </PremiumDetailSheet>
    </>
  );
}

const styles = StyleSheet.create({
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    minHeight: 30,
    justifyContent: 'center',
    paddingRight: appTheme.spacing.xs,
  },
  readMoreLabel: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.6,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
  fullText: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 13.3,
    lineHeight: 19,
  },
});
