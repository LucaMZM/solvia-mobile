import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface PremiumDetailRow {
  label: string;
  value: string;
}

interface PremiumDetailSheetProps {
  visible: boolean;
  title: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  mainValue?: string;
  summary?: string;
  rows?: PremiumDetailRow[];
  children?: ReactNode;
  onClose: () => void;
}

export function PremiumDetailSheet({
  visible,
  title,
  iconName = 'information-outline',
  mainValue,
  summary,
  rows,
  children,
  onClose,
}: PremiumDetailSheetProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      accessibilityViewIsModal
      animationType={reducedMotionEnabled ? 'none' : 'fade'}
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Animated.View
        entering={reducedMotionEnabled ? undefined : FadeIn.duration(200).easing(Easing.out(Easing.cubic))}
        exiting={reducedMotionEnabled ? undefined : FadeOut.duration(160).easing(Easing.in(Easing.quad))}
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + appTheme.spacing.md,
            paddingBottom: insets.bottom + appTheme.spacing.sm,
          },
        ]}>
        <Pressable accessibilityLabel="Cerrar detalle" onPress={onClose} style={StyleSheet.absoluteFillObject} />

        <Animated.View
          entering={
            reducedMotionEnabled
              ? undefined
              : SlideInDown.duration(260).easing(Easing.out(Easing.cubic))
          }
          exiting={
            reducedMotionEnabled
              ? undefined
              : SlideOutDown.duration(180).easing(Easing.in(Easing.quad))
          }
          style={styles.sheet}>
          <View style={styles.handle} />
          <LinearGradient
            colors={[
              withAlpha(appTheme.colors.primary, 0.11),
              withAlpha(appTheme.colors.secondary, 0.09),
              withAlpha(appTheme.colors.primary, 0.02),
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons color={appTheme.colors.secondary} name={iconName} size={18} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <MotionPressable
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
              hapticType="light"
              hitSlop={8}
              onPress={onClose}
              pressedOpacity={0.9}
              pressedScale={0.98}
              reducedMotionPressedOpacity={0.86}
              style={styles.closeButton}>
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="close" size={18} />
            </MotionPressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
            {mainValue ? <Text style={styles.mainValue}>{mainValue}</Text> : null}
            {summary ? <Text style={styles.summary}>{summary}</Text> : null}

            {rows?.length ? (
              <View style={styles.rows}>
                {rows.map((row) => (
                  <View key={`${row.label}-${row.value}`} style={styles.row}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4,8,16,0.78)',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: appTheme.spacing.sm,
  },
  sheet: {
    backgroundColor: withAlpha(appTheme.colors.surface, 0.98),
    borderColor: withAlpha(appTheme.colors.outline, 0.24),
    borderRadius: appTheme.radii.xl + 8,
    borderWidth: 1,
    flex: 1,
    maxHeight: '96%',
    minHeight: 360,
    overflow: 'hidden',
    ...appTheme.elevation.card,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: withAlpha(appTheme.colors.outline, 0.5),
    borderRadius: appTheme.radii.full,
    height: 4,
    marginTop: 8,
    width: 44,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: withAlpha(appTheme.colors.outline, 0.28),
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    marginRight: appTheme.spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.secondary, 0.12),
    borderColor: withAlpha(appTheme.colors.secondary, 0.34),
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  title: {
    color: appTheme.colors.primary,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 20,
    lineHeight: 25,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.primary, 0.08),
    borderColor: withAlpha(appTheme.colors.outline, 0.2),
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xl,
  },
  mainValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 27,
    lineHeight: 32,
  },
  summary: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 13.5,
    lineHeight: 19,
  },
  rows: {
    gap: appTheme.spacing.xs,
  },
  row: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: withAlpha(appTheme.colors.outline, 0.24),
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  rowLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.08,
  },
  rowValue: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 12.8,
    lineHeight: 18,
    marginTop: 3,
  },
});
