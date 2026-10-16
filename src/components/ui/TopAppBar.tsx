import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { appTheme } from '@/src/theme/tokens';

export function TopAppBar() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(17,27,49,0.86)', 'rgba(17,27,49,0.54)', 'rgba(17,27,49,0)']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text accessibilityRole="header" style={styles.title}>
        Solvía
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: appTheme.spacing.headerHeight,
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.pageHorizontal,
  },
  title: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 25,
    letterSpacing: 0.28,
    lineHeight: 30,
  },
});
