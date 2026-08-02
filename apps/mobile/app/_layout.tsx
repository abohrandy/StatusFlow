import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Colors } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const setUserFromSupabase = useAuthStore((state) => state.setUserFromSupabase);
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isReady = (fontsLoaded || !!fontError) && !isSessionLoading;

  // Bootstrap the persisted Supabase session once, then keep auth state in
  // sync with sign-in/sign-out/token-refresh events (including the Google
  // OAuth deep-link flow completing via setSession()).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserFromSupabase(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserFromSupabase(session?.user ?? null);
      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUserFromSupabase, setSessionLoading]);

  // The root layout must mount its navigator (Stack) unconditionally on first
  // render — Expo Router throws "Attempted to navigate before mounting the Root
  // Layout component" if a navigation action (including <Redirect>) is dispatched
  // as the very first render output instead of after the Stack has mounted. So
  // the auth gate runs as a post-mount effect via router.replace() instead.
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.replace('/');
    }

    SplashScreen.hideAsync();
  }, [isReady, isAuthenticated, isAuthRoute]);

  if (!isReady) {
    return null;
  }

  return (
    // Every screen that calls useSafeAreaInsets() (TopAppBar, BottomSheet, the tab bar)
    // needs this ancestor — without it those hooks silently fall back to zero insets,
    // so content sits under the status bar/notch/home-indicator on real devices.
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="composer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="history" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </SafeAreaProvider>
  );
}
