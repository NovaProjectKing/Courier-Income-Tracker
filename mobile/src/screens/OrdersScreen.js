import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import {
  formatDateKey,
  formatMoney,
  formatDateTime,
  themes,
} from '../theme';
import { Card, EmptyState, ScreenTitle } from '../components/UI';
import Icon from '../components/Icon';

function normalizeDateSearch(value) {
  const trimmed = value.trim();
  const dotted = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2]}-${dotted[1]}`;
  return trimmed;
}

function groupByDay(checks) {
  const grouped = new Map();
  checks.forEach((check) => {
    const key = formatDateKey(Number(check.paidAt));
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(check);
  });

  return [...grouped.entries()]
    .sort(([first], [second]) => second.localeCompare(first))
    .map(([date, data]) => ({
      date,
      title: new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      data,
    }));
}

export default function OrdersScreen() {
  const { checks, themeName, syncing, syncNow } = useApp();
  const theme = themes[themeName];
  const [search, setSearch] = useState('');
  const searchDate = normalizeDateSearch(search);

  const sections = useMemo(() => {
    const filtered = searchDate
      ? checks.filter((check) =>
          formatDateKey(Number(check.paidAt)).includes(searchDate),
        )
      : checks;
    return groupByDay(filtered);
  }, [checks, searchDate]);

  const handleRefresh = async () => {
    try {
      await syncNow();
    } catch {
      // Keep the local Firestore copy visible while offline.
    }
  };

  const listHeader = (
    <View>
      <ScreenTitle
        eyebrow={`${checks.length} ${checks.length === 1 ? 'чек' : 'чеков'} в кэше`}
        title="Заказы"
        theme={theme}
      />
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
        <Icon name="search" color={theme.muted} size={19} />
        <TextInput
          accessibilityLabel="Поиск заказов по дате"
          value={search}
          onChangeText={setSearch}
          placeholder="Найти по дате"
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          returnKeyType="search"
        />
        <Text style={[styles.dateHint, { color: theme.muted }]}>ДД.ММ.ГГГГ</Text>
      </View>
      <Text style={[styles.listCaption, { color: theme.muted }]}>
        Чеки из личного кабинета «Мой налог»
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card theme={theme} style={styles.orderCard}>
            <View style={styles.orderMain}>
              <Text style={[styles.service, { color: theme.text }]} numberOfLines={2}>
                {item.service || 'Услуга'}
              </Text>
              <Text style={[styles.orderTime, { color: theme.muted }]}>
                {formatDateTime(Number(item.paidAt))}
              </Text>
            </View>
            <Text style={[styles.orderAmount, { color: theme.text }]}>
              {formatMoney(item.amount)}
            </Text>
          </Card>
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.muted }]}>
              {section.data.length}
            </Text>
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            theme={theme}
            title={search ? 'Заказов за эту дату нет' : 'Чеков пока нет'}
            detail={
              search
                ? 'Проверьте формат даты или попробуйте другую.'
                : 'Потяните список вниз, чтобы загрузить данные из «Мой налог».'
            }
          />
        }
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accentText]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, flexGrow: 1 },
  searchBox: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
  dateHint: { fontSize: 9, fontWeight: '600' },
  listCaption: { fontSize: 11, marginTop: 9, marginBottom: 7 },
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  sectionCount: { fontSize: 11, fontWeight: '600' },
  orderCard: {
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderMain: { flex: 1 },
  service: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  orderTime: { fontSize: 11, marginTop: 5 },
  orderAmount: { fontSize: 15, fontWeight: '700' },
});
