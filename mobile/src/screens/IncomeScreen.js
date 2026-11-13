import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { formatDateKey, formatMoney, themes } from '../theme';
import { Card, PrimaryButton, ScreenTitle, SyncNotice } from '../components/UI';

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel() {
  return new Date().toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
}

function certificateMessage(result) {
  if (result.type === 'json') {
    const data = result.data || {};
    if (typeof data.message === 'string') return data.message;
    if (typeof data.status === 'string') return `Статус: ${data.status}`;
    return 'Личный кабинет «Мой налог» ответил на запрос.';
  }
  if (result.type === 'pdf') {
    return 'Личный кабинет сформировал PDF-ответ. Формат файла получен, но его скачивание пока не поддерживается.';
  }
  return 'Личный кабинет ответил на запрос справки.';
}

export default function IncomeScreen() {
  const {
    checks,
    themeName,
    syncing,
    syncError,
    syncNow,
    requestIncomeCertificate,
  } = useApp();
  const theme = themes[themeName];
  const [certificateLoading, setCertificateLoading] = useState(false);

  const monthly = useMemo(() => {
    const month = currentMonthKey();
    const monthChecks = checks.filter((check) =>
      formatDateKey(Number(check.paidAt)).startsWith(month),
    );
    const total = monthChecks.reduce(
      (sum, check) => sum + (Number(check.amount) || 0),
      0,
    );
    return {
      total,
      orders: monthChecks.length,
      tax: total * 0.06,
    };
  }, [checks]);

  const makeCertificate = async () => {
    setCertificateLoading(true);
    try {
      const result = await requestIncomeCertificate();
      Alert.alert('Справка о доходах', certificateMessage(result));
    } catch (error) {
      Alert.alert(
        'Не удалось получить справку',
        error?.message || 'Попробуйте ещё раз позже.',
      );
    } finally {
      setCertificateLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await syncNow();
    } catch {
      // Keep the Firestore cache visible while the network is unavailable.
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accentText]}
          />
        }
      >
        <ScreenTitle eyebrow="Сводка" title="Доходы" theme={theme} />

        <Card theme={theme} style={[styles.monthCard, { backgroundColor: theme.accent }]}>
          <Text style={styles.monthEyebrow}>ТЕКУЩИЙ МЕСЯЦ</Text>
          <Text style={styles.monthLabel}>{getMonthLabel()}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.monthTotal}>
            {formatMoney(monthly.total)}
          </Text>
          <Text style={styles.monthMeta}>
            {monthly.orders} {monthly.orders === 1 ? 'чек' : 'чеков'} из «Мой налог»
          </Text>
        </Card>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          РАСЧЁТ НАЛОГА
        </Text>
        <Card theme={theme} style={styles.taxCard}>
          <View style={styles.taxRow}>
            <View style={styles.taxText}>
              <Text style={[styles.taxTitle, { color: theme.text }]}>
                Начисленный налог
              </Text>
              <Text style={[styles.taxDescription, { color: theme.muted }]}>
                Расчёт по ставке 6% от дохода
              </Text>
            </View>
            <Text style={[styles.taxAmount, { color: theme.text }]}>
              {formatMoney(monthly.tax)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.line }]} />
          <View style={styles.taxFoot}>
            <Text style={[styles.taxFootLabel, { color: theme.muted }]}>
              Ставка
            </Text>
            <Text style={[styles.taxFootValue, { color: theme.text }]}>6%</Text>
          </View>
        </Card>

        <Card theme={theme} style={styles.certificateCard}>
          <View style={styles.certificateMark}>
            <Text style={styles.certificateMarkText}>₽</Text>
          </View>
          <Text style={[styles.certificateTitle, { color: theme.text }]}>
            Справка о доходах
          </Text>
          <Text style={[styles.certificateDescription, { color: theme.muted }]}>
            Запросить сведения за текущий период из личного кабинета «Мой налог».
          </Text>
          <PrimaryButton
            title="Сформировать справку"
            onPress={makeCertificate}
            theme={theme}
            loading={certificateLoading}
          />
        </Card>

        {syncing ? (
          <View style={styles.syncRow}>
            <ActivityIndicator size="small" color={theme.muted} />
            <Text style={[styles.syncText, { color: theme.muted }]}>
              Обновляем чеки
            </Text>
          </View>
        ) : null}
        {syncError ? <SyncNotice text={syncError} theme={theme} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  monthCard: { borderColor: 'transparent', padding: 21, marginBottom: 26 },
  monthEyebrow: { color: '#51471F', fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
  monthLabel: { color: '#51471F', fontSize: 13, marginTop: 8, textTransform: 'capitalize' },
  monthTotal: { color: '#17150A', fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.3, marginTop: 18 },
  monthMeta: { color: '#51471F', fontSize: 12, fontWeight: '600', marginTop: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 9 },
  taxCard: { padding: 17, marginBottom: 14 },
  taxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  taxText: { flex: 1 },
  taxTitle: { fontSize: 14, fontWeight: '700' },
  taxDescription: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  taxAmount: { fontSize: 18, fontWeight: '700' },
  divider: { height: 1, marginVertical: 16 },
  taxFoot: { flexDirection: 'row', justifyContent: 'space-between' },
  taxFootLabel: { fontSize: 11 },
  taxFootValue: { fontSize: 11, fontWeight: '700' },
  certificateCard: { padding: 18 },
  certificateMark: { height: 42, width: 42, borderRadius: 14, backgroundColor: '#FFDB4D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  certificateMarkText: { color: '#201C0A', fontSize: 21, fontWeight: '800' },
  certificateTitle: { fontSize: 17, fontWeight: '700' },
  certificateDescription: { fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 18 },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 15 },
  syncText: { fontSize: 11 },
});
