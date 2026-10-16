import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';

interface PrimaryPillButtonProps extends PressableProps {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryPillButton({
  accessibilityRole = 'button',
  hitSlop = 6,
  label,
  style,
  ...props
}: PrimaryPillButtonProps) {
  return (
    <MotionPressable
      accessibilityRole={accessibilityRole}
      contentStyle={styles.content}
      hapticType="selection"
      hitSlop={hitSlop}
      pressedOpacity={0.92}
      pressedScale={0.985}
      reducedMotionPressedOpacity={0.86}
      style={[styles.button, style]}
      {...props}>
      <LinearGradient
        colors={[
          withAlpha(appTheme.colors.primary, 0.14),
          withAlpha(appTheme.colors.secondary, 0.18),
          withAlpha(appTheme.colors.secondary, 0.08),
        ]}
        end={{ x: 1, y: 0.95 }}
        start={{ x: 0, y: 0.05 }}
        style={styles.gradient}
      />
      <Text style={textStyles.buttonCaps}>{label}</Text>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerHigh,
    borderColor: 'rgba(157,198,255,0.5)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: 11,
  },
});
