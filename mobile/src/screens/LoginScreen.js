import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { PrimaryButton } from '../components/UI';

export default function LoginScreen() {
  const { signIn, themeName, syncError } = useApp();
  const theme = themes[themeName];
  const [inn, setInn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(inn.trim(), password);
      setPassword('');
    } catch (loginError) {
      setError(loginError?.message || 'Не удалось войти. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
            <Text style={[styles.brandSymbol, { color: theme.accentText }]}>₽</Text>
          </View>
          <Text style={[styles.brandEyebrow, { color: theme.muted }]}>
            ДЛЯ КУРЬЕРОВ И ВОДИТЕЛЕЙ
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Мой доход</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Чеки, заказы и заработок в одном месте. Данные загружаются из личного
            кабинета «Мой налог».
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>ИНН</Text>
            <TextInput
              accessibilityLabel="ИНН"
              value={inn}
              onChangeText={(value) => setInn(value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12 цифр"
              placeholderTextColor={theme.muted}
              keyboardType="number-pad"
              maxLength={12}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                  color: theme.text,
                },
              ]}
              returnKeyType="next"
            />

            <Text
              style={[
                styles.label,
                styles.passwordLabel,
                { color: theme.text },
              ]}
            >
              Пароль от «Мой налог»
            </Text>
            <TextInput
              accessibilityLabel="Пароль от Мой налог"
              value={password}
              onChangeText={setPassword}
              placeholder="Введите пароль"
              placeholderTextColor={theme.muted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                  color: theme.text,
                },
              ]}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
          </View>

          {error || syncError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>
              {error || syncError}
            </Text>
          ) : null}

          <PrimaryButton
            title="Войти в «Мой налог»"
            onPress={submit}
            theme={theme}
            loading={loading}
            disabled={inn.length !== 12 || !password.trim()}
          />

          <View style={[styles.securityNote, { borderColor: theme.line }]}>
            <Text style={[styles.securityIcon, { color: theme.positive }]}>●</Text>
            <Text style={[styles.securityText, { color: theme.muted }]}>
              Пароль не сохраняется. Токены входа хранятся в защищённом хранилище
              телефона.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  brandMark: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 23 },
  brandSymbol: { fontSize: 27, fontWeight: '800' },
  brandEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8 },
  title: { fontSize: 33, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { maxWidth: 340, fontSize: 14, lineHeight: 21, marginTop: 8 },
  form: { marginTop: 30, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  passwordLabel: { marginTop: 16 },
  input: { height: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 12, lineHeight: 18, marginBottom: 13 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderTopWidth: 1, paddingTop: 16, marginTop: 24 },
  securityIcon: { fontSize: 10, marginTop: 3 },
  securityText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
