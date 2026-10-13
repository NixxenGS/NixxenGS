import { Bangers_400Regular, useFonts } from '@expo-google-fonts/bangers';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../store/store';
import { dark, fonts, light, ThemeContext } from '../theme';

function Themed({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const { state } = useStore();
  const isDark = state.theme === 'system' ? scheme === 'dark' : state.theme === 'dark';
  const c = isDark ? dark : light;
  const base = isDark ? DarkTheme : DefaultTheme;
  const nav = { ...base, colors: { ...base.colors, background: c.bg, card: c.blue, border: c.line, primary: c.yellow, text: '#fff' } };
  return (
    <ThemeContext.Provider value={c}>
      <ThemeProvider value={nav}>
        <StatusBar style="light" />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Bangers_400Regular });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#1c5fc4' }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Themed>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#1c5fc4' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: fonts.display, fontSize: 24 },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="build/[id]" options={{ title: 'Hero Builder' }} />
            <Stack.Screen name="play/[id]" options={{ title: 'Play' }} />
          </Stack>
        </Themed>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
