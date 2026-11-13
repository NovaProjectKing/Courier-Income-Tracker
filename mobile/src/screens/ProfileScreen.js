import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { Card, ScreenTitle, SyncNotice } from '../components/UI';
import Icon from '../components/Icon';

export default function ProfileScreen() {
  const {
    profile,
    themeName,
    setTheme,
    signOut,
    syncError,
  } = useApp();
  const theme = themes[themeName];

  const confirmSignOut = () => {
    Alert.alert(
      'Выйти из аккаунта?',
      'Токены и кэш чеков этого устройства будут удалены. Данные в «Мой налог» не изменятся.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти и очистить',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Очистка кэша', error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle eyebrow="Настройки" title="Профиль" theme={theme} />

        <Card theme={theme} style={styles.accountCard}>
          <View style={styles.accountTop}>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Icon name="profile" color={theme.accentText} size={23} />
            </View>
            <View style={styles.accountDetails}>
              <Text style={[styles.accountName, { color: theme.text }]}>
                «Мой налог»
              </Text>
              <View style={styles.statusLine}>
                <View style={[styles.statusDot, { backgroundColor: theme.positive }]} />
                <Text style={[styles.statusText, { color: theme.muted }]}>
                  Авторизация активна
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.profileDivider, { backgroundColor: theme.line }]} />
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>ИНН</Text>
          <Text style={[styles.inn, { color: theme.text }]}>
            {profile?.inn || '—'}
          </Text>
        </Card>

        <Text style={[styles.groupLabel, { color: theme.muted }]}>ВНЕШНИЙ ВИД</Text>
        <Card theme={theme} style={styles.settingCard}>
          <View
            style={[
              styles.settingIcon,
              { backgroundColor: theme.surfaceAlt },
            ]}
          >
            <Icon
              name={themeName === 'dark' ? 'moon' : 'sun'}
              color={theme.text}
              size={19}
            />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Тёмная тема
            </Text>
            <Text style={[styles.settingCaption, { color: theme.muted }]}>
              Сохраняется на этом устройстве
            </Text>
          </View>
          <Switch
            accessibilityLabel="Переключить тёмную тему"
            value={themeName === 'dark'}
            onValueChange={(enabled) => setTheme(enabled ? 'dark' : 'light')}
            trackColor={{ false: theme.line, true: theme.accent }}
            thumbColor={theme.surface}
          />
        </Card>

        <Card theme={theme} style={styles.noticeCard}>
          <Icon name="shield" color={theme.muted} size={18} />
          <Text style={[styles.noticeText, { color: theme.muted }]}>
            Приложение обращается к неофициальному API личного кабинета НПД.
            Его работа зависит от доступности сервиса «Мой налог».
          </Text>
        </Card>

        {syncError ? <SyncNotice text={syncError} theme={theme} /> : null}

        <Pressable
          accessibilityRole="button"
          onPress={confirmSignOut}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: theme.line, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Icon name="logout" color={theme.danger} size={19} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>
            Выйти и очистить данные
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: theme.muted }]}>
          Мой доход: курьер · версия 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  accountCard: { padding: 18, marginBottom: 26 },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  accountDetails: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '700' },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  profileDivider: { height: 1, marginVertical: 17 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  inn: { fontSize: 17, fontWeight: '700', marginTop: 7, letterSpacing: 0.4 },
  groupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 9 },
  settingCard: { paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  settingIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '700' },
  settingCaption: { fontSize: 10, marginTop: 4 },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  logoutButton: { minHeight: 52, borderWidth: 1, borderRadius: 16, marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  logoutText: { fontSize: 13, fontWeight: '700' },
  version: { fontSize: 10, textAlign: 'center', marginTop: 20 },
});
