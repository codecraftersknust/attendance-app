import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Emerald, Amber } from '@/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [level, setLevel] = useState<number>(100);
  const [programme, setProgramme] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const PROGRAMMES = ['Computer Engineering', 'Telecommunication Engineering', 'Electrical Engineering', 'Biomedical Engineering'];
  const LEVELS = [100, 200, 300, 400];

  const { register } = useAuth();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      showToast('Fill in all required fields', 'error');
      return;
    }

    if (!programme.trim()) {
      showToast('Please select your programme', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords don't match", 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Use at least 6 characters for password', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Check your email address', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        user_id: studentId.trim() || undefined,
        role: 'student',
        level,
        programme: programme.trim(),
      });
      showToast('Account created successfully!', 'success');
      router.replace('/(auth)/setup-face');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const bg = isDark ? '#0f1419' : '#ffffff';
  const cardBg = isDark ? '#1a1f23' : '#ffffff';
  const inputBg = isDark ? '#252829' : '#f8fafc';
  const border = isDark ? '#383b3d' : '#e2e8f0';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: bg }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <IconSymbol name="chevron.left" size={24} color={Amber[600]} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: Emerald[900] }]}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={[styles.title, { color: text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            Join Absense for smart attendance
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="Enter your full name"
              placeholderTextColor={muted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="your.email@example.com"
              placeholderTextColor={muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Student ID <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="e.g., STU12345"
              placeholderTextColor={muted}
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Level <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.chip,
                    { backgroundColor: inputBg, borderColor: border },
                    level === lvl && { backgroundColor: Emerald[100], borderColor: Emerald[600] },
                  ]}
                  onPress={() => setLevel(lvl)}
                  disabled={isLoading}
                >
                  <Text style={[styles.chipText, { color: level === lvl ? Emerald[800] : text }]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Programme <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {PROGRAMMES.map((prog) => (
                <TouchableOpacity
                  key={prog}
                  style={[
                    styles.programmeChip,
                    { backgroundColor: inputBg, borderColor: border },
                    programme === prog && { backgroundColor: Emerald[100], borderColor: Emerald[600] },
                  ]}
                  onPress={() => setProgramme(prog)}
                  disabled={isLoading}
                >
                  <Text style={[styles.chipText, { color: programme === prog ? Emerald[800] : text }]} numberOfLines={1}>
                    {prog}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="At least 6 characters"
              placeholderTextColor={muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="Re-enter password"
              placeholderTextColor={muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: muted }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading} activeOpacity={0.7}>
            <Text style={styles.linkText}>Sign In</Text>
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
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  programmeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: '48%',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  required: { color: '#ef4444' },
  optional: { color: '#94a3b8', fontWeight: 'normal' },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 15 },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: Amber[600],
  },
});
