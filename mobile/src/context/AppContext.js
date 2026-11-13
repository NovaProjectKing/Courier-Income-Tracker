import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInAnonymously } from '@react-native-firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  cacheIncomeChecks,
  clearDeviceCache,
  readDeviceCache,
  saveDeviceProfile,
} from '../services/firestoreCache';
import {
  clearMyTaxSession,
  loadIncomeChecks,
  loginToMyTax,
  refreshMyTaxSession,
  requestIncomeCertificate,
  restoreMyTaxSession,
} from '../services/myTaxApi';

const DEVICE_ID_KEY = 'my-income-courier.device-id';
const THEME_KEY = 'my-income-courier.theme';
const AppContext = createContext(null);

const isExpiredSession = (error) =>
  error?.message?.includes('Сессия истекла') ||
  error?.message?.includes('Сессия завершена');

async function ensureDeviceId() {
  const auth = getAuth();
  let user = auth.currentUser;
  if (!user) {
    const result = await signInAnonymously(auth);
    user = result.user;
  }
  if (!user?.uid) throw new Error('Не удалось создать профиль устройства.');

  const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (storedId !== user.uid) {
    await AsyncStorage.setItem(DEVICE_ID_KEY, user.uid);
  }
  return user.uid;
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [authStatus, setAuthStatus] = useState('checking');
  const [profile, setProfile] = useState(null);
  const [checks, setChecks] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [themeName, setThemeName] = useState('light');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const syncLock = useRef(false);
  const bootstrapStarted = useRef(false);

  const applyCache = useCallback((cache) => {
    setProfile(cache.profile || null);
    setChecks(
      [...(cache.checks || [])].sort(
        (a, b) => Number(b.paidAt) - Number(a.paidAt),
      ),
    );
    setEarnings(
      [...(cache.earnings || [])].sort((a, b) =>
        String(b.date).localeCompare(String(a.date)),
      ),
    );
  }, []);

  const syncNow = useCallback(
    async (showSpinner = true) => {
      if (!deviceId || syncLock.current) return;
      syncLock.current = true;
      if (showSpinner) setSyncing(true);
      setSyncError('');
      try {
        const rawChecks = await loadIncomeChecks();
        const cache = await cacheIncomeChecks(deviceId, rawChecks);
        await applyCache(cache);
        setLastSyncAt(Date.now());
      } catch (error) {
        if (isExpiredSession(error)) setAuthStatus('signedOut');
        setSyncError(error?.message || 'Не удалось обновить данные.');
        throw error;
      } finally {
        syncLock.current = false;
        setSyncing(false);
      }
    },
    [applyCache, deviceId],
  );

  useEffect(() => {
    if (bootstrapStarted.current) return undefined;
    bootstrapStarted.current = true;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (mounted && (savedTheme === 'dark' || savedTheme === 'light')) {
          setThemeName(savedTheme);
        }

        const id = await ensureDeviceId();
        if (!mounted) return;
        setDeviceId(id);

        const cache = await readDeviceCache(id);
        if (!mounted) return;
        applyCache(cache);
        if (cache.profile?.theme && !savedTheme) {
          setThemeName(cache.profile.theme);
          await AsyncStorage.setItem(THEME_KEY, cache.profile.theme);
        }

        const tokens = await restoreMyTaxSession();
        if (!mounted) return;
        if (!tokens?.refreshToken) {
          setAuthStatus('signedOut');
          setReady(true);
          return;
        }

        setAuthStatus('signedIn');
        setReady(true);

        if (
          !tokens.accessToken ||
          !tokens.expiresAt ||
          tokens.expiresAt < Date.now() + 60_000
        ) {
          try {
            await refreshMyTaxSession();
          } catch (error) {
            if (isExpiredSession(error)) {
              if (mounted) setAuthStatus('signedOut');
              return;
            }
            if (mounted) setSyncError(error.message);
            return;
          }
        }

        try {
          const rawChecks = await loadIncomeChecks();
          const updatedCache = await cacheIncomeChecks(id, rawChecks);
          if (mounted) {
            applyCache(updatedCache);
            setLastSyncAt(Date.now());
          }
        } catch (error) {
          // Cached earnings remain available when the tax service is offline.
          if (mounted) {
            if (isExpiredSession(error)) setAuthStatus('signedOut');
            setSyncError(error?.message || 'Не удалось обновить данные.');
          }
        }
      } catch (error) {
        if (mounted) {
          setSetupError(
            error?.message ||
              'Не удалось подключить защищённое хранилище устройства.',
          );
          setReady(true);
        }
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [applyCache]);

  const signIn = useCallback(
    async (inn, password) => {
      if (!/^\d{12}$/.test(inn)) {
        throw new Error('ИНН физического лица должен содержать 12 цифр.');
      }
      if (!password.trim()) throw new Error('Введите пароль от «Мой налог».');

      const tokens = await loginToMyTax(inn, password, deviceId);
      if (!tokens?.refreshToken) {
        throw new Error('Не удалось сохранить сессию «Мой налог».');
      }

      const nextProfile = {
        inn,
        theme: themeName,
        authenticatedAt: Date.now(),
      };
      await saveDeviceProfile(deviceId, nextProfile);
      setProfile(nextProfile);
      setAuthStatus('signedIn');
      try {
        await syncNow();
      } catch {
        // The login is valid even when the income service is temporarily offline.
      }
    },
    [deviceId, syncNow, themeName],
  );

  const setTheme = useCallback(
    async (nextTheme) => {
      if (nextTheme !== 'light' && nextTheme !== 'dark') return;
      setThemeName(nextTheme);
      await AsyncStorage.setItem(THEME_KEY, nextTheme);
      if (deviceId && profile?.inn) {
        const nextProfile = { ...profile, theme: nextTheme };
        setProfile(nextProfile);
        try {
          await saveDeviceProfile(deviceId, nextProfile);
        } catch (error) {
          setSyncError(
            error?.message || 'Тема сохранена на устройстве, но не в облаке.',
          );
        }
      }
    },
    [deviceId, profile],
  );

  const signOut = useCallback(async () => {
    let cacheError = null;
    let tokenError = null;
    try {
      await Promise.race([
        clearDeviceCache(deviceId),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);
    } catch (error) {
      cacheError = error;
    }
    try {
      await clearMyTaxSession();
    } catch (error) {
      tokenError = error;
    } finally {
      setAuthStatus('signedOut');
      setProfile(null);
      setChecks([]);
      setEarnings([]);
      setSyncError('');
      setLastSyncAt(null);
    }
    if (cacheError) {
      throw new Error(
        'Сессия удалена, но очистить кэш Firestore не удалось. Проверьте подключение.',
      );
    }
    if (tokenError) {
      throw new Error('Не удалось очистить защищённые токены на устройстве.');
    }
  }, [deviceId]);

  const value = useMemo(
    () => ({
      ready,
      setupError,
      deviceId,
      authStatus,
      profile,
      checks,
      earnings,
      themeName,
      syncing,
      syncError,
      lastSyncAt,
      signIn,
      signOut,
      setTheme,
      syncNow,
      requestIncomeCertificate,
    }),
    [
      ready,
      setupError,
      deviceId,
      authStatus,
      profile,
      checks,
      earnings,
      themeName,
      syncing,
      syncError,
      lastSyncAt,
      signIn,
      signOut,
      setTheme,
      syncNow,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp должен вызываться внутри AppProvider.');
  return context;
}
