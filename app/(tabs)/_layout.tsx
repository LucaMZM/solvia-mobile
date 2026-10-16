import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

interface TabIconProps {
  color: string;
  focused: boolean;
}

function TabIcon({ color, focused, name }: TabIconProps & { name: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={[styles.tabIconWrap, focused ? styles.tabIconWrapFocused : null]}>
      <MaterialCommunityIcons color={color} name={name} size={focused ? 22 : 21} />
    </View>
  );
}

export default function TabsLayout() {
  const reducedMotionEnabled = useReducedMotionPreference();

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        animation: reducedMotionEnabled ? 'none' : 'fade',
        freezeOnBlur: false,
        headerShown: false,
        lazy: false,
        popToTopOnBlur: false,
        sceneStyle: {
          backgroundColor: appTheme.colors.background,
        },
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: 'rgba(198,210,232,0.64)',
        tabBarLabelStyle: {
          ...appTheme.typography.tabLabel,
          marginBottom: 0,
          marginTop: 1,
        },
        tabBarItemStyle: {
          borderRadius: appTheme.radii.lg,
          minHeight: 56,
          paddingVertical: 1,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(23,37,63,0.9)',
          borderColor: 'rgba(154,172,202,0.16)',
          borderTopColor: 'rgba(154,172,202,0.16)',
          borderTopWidth: 1,
          borderRadius: 24,
          bottom: 10,
          elevation: 0,
          height: 70,
          left: 10,
          paddingBottom: Platform.OS === 'ios' ? 7 : 6,
          paddingTop: 6,
          position: 'absolute',
          right: 10,
          shadowColor: appTheme.colors.navyShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarAccessibilityLabel: 'Pestaña Hoy',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={appIcons.tabs.hoy} />,
        }}
      />
      <Tabs.Screen
        name="trayecto"
        options={{
          title: 'Trayecto',
          tabBarAccessibilityLabel: 'Pestaña Trayecto',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={appIcons.tabs.trayecto} />,
        }}
      />
      <Tabs.Screen
        name="sol"
        options={{
          title: 'Sol',
          tabBarAccessibilityLabel: 'Pestaña Sol',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={appIcons.tabs.sol} />,
        }}
      />
      <Tabs.Screen
        name="ropa"
        options={{
          title: 'Ropa',
          tabBarAccessibilityLabel: 'Pestaña Ropa',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={appIcons.tabs.ropa} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Pestaña Perfil',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={appIcons.tabs.perfil} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  tabIconWrapFocused: {
    backgroundColor: 'rgba(157,198,255,0.18)',
    borderColor: 'rgba(157,198,255,0.36)',
    borderWidth: 1,
  },
});
