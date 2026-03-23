import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Emerald, Amber } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLoginIdentifierError } from '@/lib/auth-validation';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    const identifierErr = getLoginIdentifierError(identifier);
    if (identifierErr) {
      showToast(identifierErr, 'error');
      return;
    }

    if (!password.trim()) {
      showToast('Password is required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: identifier.trim(), password });

      if (rememberMe) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER, identifier.trim());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER);
      }

      showToast('Welcome back!', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore remembered identifier on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER);
        if (!mounted) return;
        if (saved) {
          setIdentifier(saved);
          setRememberMe(true);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const bg = isDark ? '#0f1419' : '#fcfcf7';
  const cardBg = isDark ? '#1a1f23' : '#fcfcf7';
  const inputBg = isDark ? '#2a2d30' : '#f0f1f3';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const placeholder = isDark ? '#6b7280' : '#8a8f98';
  const footerMuted = isDark ? '#5a6270' : '#b8bcc4';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: bg }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/animated-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            Sign in to continue
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          <View style={styles.inputGroup}>
            <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
              <IconSymbol name="envelope.fill" size={18} color={placeholder} />
              <TextInput
                style={[styles.inputWithIcon, { color: text }]}
                placeholder="Student Email or 8-digit ID"
                placeholderTextColor={placeholder}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
              <IconSymbol name="lock.fill" size={18} color={placeholder} />
              <TextInput
                style={[styles.inputWithIcon, { color: text }]}
                placeholder="Password"
                placeholderTextColor={placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((prev) => !prev)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: isDark ? '#4b5563' : '#d1d5db', backgroundColor: rememberMe ? Emerald[600] : 'transparent' },
                ]}
              >
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.rememberText, { color: muted }]}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} disabled={isLoading}>
              <Text
                style={styles.forgotText}
                onPress={() =>
                  Alert.alert(
                    'Forgot password',
                    'Please contact support team to reset your password.',
                    [
                      {
                        text: 'Email support',
                        onPress: () =>
                          Linking.openURL(
                            `mailto:codecraftersknust@gmail.com?subject=${encodeURIComponent('Password reset request')}&body=${encodeURIComponent(
                              `Hi Absense team,\n\nPlease help me reset my password.\n\nMy username/email: ${identifier || '(not provided)'}`
                            )}`
                          ),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  )
                }
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.consentRow}>
          <Text style={[styles.consentText, { color: footerMuted }]}>By signing in, you agree to</Text>
          <View style={styles.consentLinksRow}>
            <Text
              style={styles.consentLink}
              onPress={() => Linking.openURL('https://absense.knust.edu.gh/terms')}
            >
              Terms of Service
            </Text>
            <Text style={[styles.consentSeparator, { color: footerMuted }]}>•</Text>
            <Text
              style={styles.consentLink}
              onPress={() => Linking.openURL('https://absense.knust.edu.gh/privacy')}
            >
              Privacy Policy
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: footerMuted }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={isLoading} activeOpacity={0.7}>
            <Text style={styles.linkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'flex-start',
    marginVertical: 36,
    paddingLeft: 24,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingVertical: 0,
  },
  input: {
    height: 56,
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Amber[600],
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: Emerald[900],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  consentRow: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  consentText: {
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  consentLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  consentSeparator: {
    fontSize: 11,
  },
  consentLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
    color: Amber[600],
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 13 },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Amber[600],
  },
});
