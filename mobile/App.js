import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { themes } from './src/theme';
import AppTabs from './src/navigation/AppTabs';
import LoginScreen from './src/screens/LoginScreen';

function AppContent() {
  const { ready, setupError, authStatus, themeName } = useApp();
  const theme = themes[themeName];

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={[styles.loadingText, { color: theme.muted }]}>
          Подготавливаем приложение
        </Text>
      </View>
    );
  }

  if (setupError) {
    return (
      <View style={[styles.setupError, { backgroundColor: theme.background }]}>
        <Text style={[styles.setupTitle, { color: theme.text }]}>
          Не удалось защитить кэш
        </Text>
        <Text style={[styles.setupDescription, { color: theme.muted }]}>
          Включите анонимный вход в Firebase Authentication и проверьте правила
          Firestore. После этого перезапустите приложение.
        </Text>
        <Text style={[styles.setupDescription, { color: theme.muted }]}>
          {setupError}
        </Text>
      </View>
    );
  }

  const navigationTheme =
    themeName === 'dark'
      ? {
          ...DarkTheme,
          colors: { ...DarkTheme.colors, background: theme.background },
        }
      : {
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, background: theme.background },
        };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
      />
      {authStatus === 'signedIn' ? <AppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14 },
  setupError: { flex: 1, justifyContent: 'center', padding: 28, gap: 12 },
  setupTitle: { fontSize: 24, fontWeight: '700' },
  setupDescription: { fontSize: 14, lineHeight: 21 },
});
