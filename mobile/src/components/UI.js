import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';

export function ScreenTitle({ eyebrow, title, theme }) {
  return (
    <View style={styles.titleWrap}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

export function Card({ children, theme, style }) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  theme,
  loading = false,
  disabled = false,
  icon,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: theme.accent,
          opacity: pressed ? 0.84 : disabled ? 0.55 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.accentText} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={theme.accentText} size={18} /> : null}
          <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function EmptyState({ title, detail, theme }) {
  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
        ]}
      >
        <Icon name="orders" color={theme.muted} size={23} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {detail ? (
        <Text style={[styles.emptyDetail, { color: theme.muted }]}>{detail}</Text>
      ) : null}
    </View>
  );
}

export function SyncNotice({ text, theme }) {
  if (!text) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.notice,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.line },
      ]}
    >
      <Icon name="shield" color={theme.muted} size={16} />
      <Text style={[styles.noticeText, { color: theme.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: { marginBottom: 18 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 18,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  emptyState: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    height: 52,
    width: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 14,
  },
  noticeText: { fontSize: 12, lineHeight: 17, flex: 1 },
});
