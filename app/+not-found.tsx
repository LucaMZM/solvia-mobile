import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ruta no encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta pantalla no existe en Solvía</Text>
        <Text style={styles.body}>Volvamos a la experiencia principal.</Text>
        <Link href="/" style={styles.link}>
          Ir a Hoy
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: appTheme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: appTheme.spacing.lg,
  },
  title: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 36,
    lineHeight: 42,
  },
  body: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    color: appTheme.colors.warning,
    marginTop: appTheme.spacing.lg,
    textDecorationLine: 'underline',
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
  },
});
