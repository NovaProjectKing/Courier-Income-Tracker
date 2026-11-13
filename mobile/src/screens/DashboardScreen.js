import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useApp } from '../context/AppContext';
import { formatDateKey, formatMoney, formatShortDate, themes } from '../theme';
import { Card, ScreenTitle, SyncNotice } from '../components/UI';

const periods = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
];

function startOfPeriod(period) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setDate(1);
  return start.getTime();
}

function makeDayLabel(date) {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function DashboardScreen() {
  const {
    checks,
    themeName,
    syncing,
    syncError,
    lastSyncAt,
    syncNow,
  } = useApp();
  const theme = themes[themeName];
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState('today');
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 420 });
  }, [progress]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  const stats = useMemo(() => {
    const start = startOfPeriod(period);
    const end = Date.now();
    const selected = checks.filter(
      (check) => Number(check.paidAt) >= start && Number(check.paidAt) <= end,
    );
    const amount = selected.reduce(
      (total, check) => total + (Number(check.amount) || 0),
      0,
    );
    return {
      amount,
      orders: selected.length,
      average: selected.length ? amount / selected.length : 0,
    };
  }, [checks, period]);

  const chartData = useMemo(() => {
    const amounts = new Map();
    checks.forEach((check) => {
      const key = formatDateKey(Number(check.paidAt));
      amounts.set(key, (amounts.get(key) || 0) + Number(check.amount || 0));
    });
    return Array.from({ length: 30 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (29 - index));
      const key = formatDateKey(day);
      return {
        value: amounts.get(key) || 0,
        label: index % 7 === 0 || index === 29 ? makeDayLabel(day) : '',
      };
    });
  }, [checks]);

  const handleRefresh = async () => {
    try {
      await syncNow();
    } catch {
      // The existing Firestore cache remains visible when sync is unavailable.
    }
  };

  const chartWidth = Math.max(210, width - 108);
  const chartLabelStyle = useMemo(
    () => ({ color: theme.muted, fontSize: 9 }),
    [theme.muted],
  );

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
        <View style={styles.topRow}>
          <ScreenTitle eyebrow="Мой доход" title="Обзор" theme={theme} />
          <View
            style={[
              styles.liveDot,
              { backgroundColor: syncError ? theme.danger : theme.positive },
            ]}
          />
        </View>

        <Animated.View style={entranceStyle}>
          <Card
            theme={theme}
            style={[styles.earningsCard, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.cardEyebrow}>ЗАРАБОТАНО</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.amount}>
              {formatMoney(stats.amount)}
            </Text>
            <View style={styles.periods}>
              {periods.map((item) => {
                const active = period === item.key;
                return (
                  <Text
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPeriod(item.key)}
                    style={[
                      styles.period,
                      active ? styles.periodActive : styles.periodInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <View style={styles.metricsRow}>
          <Card theme={theme} style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: theme.muted }]}>
              Заказов
            </Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {stats.orders}
            </Text>
            <Text style={[styles.metricHint, { color: theme.muted }]}>
              за выбранный период
            </Text>
          </Card>
          <Card theme={theme} style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: theme.muted }]}>
              Средний чек
            </Text>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[styles.metricValue, { color: theme.text }]}
            >
              {formatMoney(stats.average)}
            </Text>
            <Text style={[styles.metricHint, { color: theme.muted }]}>
              на один заказ
            </Text>
          </Card>
        </View>

        <Card theme={theme} style={styles.chartCard}>
          <View style={styles.chartHeading}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                Динамика дохода
              </Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>
                Последние 30 дней
              </Text>
            </View>
            <View style={[styles.chartMarker, { backgroundColor: theme.accent }]} />
          </View>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={164}
            color={theme.positive}
            thickness={3}
            hideDataPoints
            curved
            isAnimated
            animationDuration={420}
            initialSpacing={5}
            endSpacing={5}
            noOfSections={3}
            maxValue={Math.max(1000, ...chartData.map((point) => point.value))}
            hideYAxisText
            xAxisColor={theme.line}
            rulesColor={theme.line}
            rulesThickness={1}
            xAxisLabelTextStyle={chartLabelStyle}
            xAxisLabelsHeight={24}
            yAxisThickness={0}
            backgroundColor={theme.surface}
            adjustToWidth
            showVerticalLines={false}
            disableScroll
          />
          <View style={styles.chartFooter}>
            <Text style={[styles.chartFooterText, { color: theme.muted }]}>
              {lastSyncAt
                ? `Обновлено ${formatShortDate(lastSyncAt)}`
                : 'Данные из чеков «Мой налог»'}
            </Text>
            <Text style={[styles.chartFooterText, { color: theme.muted }]}>
              Налог: 6%
            </Text>
          </View>
        </Card>

        {syncError ? <SyncNotice text={syncError} theme={theme} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginTop: 12 },
  earningsCard: {
    borderColor: 'transparent',
    padding: 22,
    marginBottom: 14,
  },
  cardEyebrow: {
    color: '#51471F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  amount: {
    color: '#17150A',
    fontSize: 43,
    fontWeight: '800',
    letterSpacing: -1.6,
    marginTop: 12,
  },
  periods: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 26, 10, 0.09)',
    borderRadius: 13,
    padding: 4,
    marginTop: 20,
  },
  period: { overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  periodActive: { backgroundColor: '#FFFFFF', color: '#201C0A' },
  periodInactive: { color: '#645A2C' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, minHeight: 118, justifyContent: 'space-between', padding: 15 },
  metricLabel: { fontSize: 12, fontWeight: '600' },
  metricValue: { fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  metricHint: { fontSize: 10 },
  chartCard: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 13 },
  chartHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  chartTitle: { fontSize: 15, fontWeight: '700' },
  chartSubtitle: { fontSize: 11, marginTop: 4 },
  chartMarker: { width: 11, height: 11, borderRadius: 4 },
  chartFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E6E1',
    paddingTop: 11,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartFooterText: { fontSize: 10 },
});
