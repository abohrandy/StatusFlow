import React from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB } from '../../components';
import { Colors } from '../../theme';

/**
 * The 4-tab bottom bar from the Stitch mockups (Dashboard / Scheduled / Media /
 * Settings). "Create" is deliberately NOT a 5th tab — it's a floating action button
 * overlaid here, outside the Tabs component, which pushes the modal-presented
 * `composer` screen (see app/_layout.tsx). Living at this layout level means the FAB
 * persists identically across all 4 tabs and disappears once you navigate to a
 * pushed/modal screen outside this group.
 */
export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: Colors.surfaceContainerLowest,
            borderTopColor: Colors.outlineVariant,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="queue"
          options={{
            title: 'Scheduled',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="schedule" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="media"
          options={{
            title: 'Media',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="perm-media" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
          }}
        />
      </Tabs>

      <FAB icon="add" accessibilityLabel="Create status" onPress={() => router.push('/composer')} style={{ bottom: 84 + insets.bottom }} />
    </View>
  );
}
