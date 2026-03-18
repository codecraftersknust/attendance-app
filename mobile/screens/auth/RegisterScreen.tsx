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
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Emerald, Amber } from '@/constants/theme';
import {
  getStudentEmailError,
  getStudentIdError,
  getPasswordError,
} from '@/lib/auth-validation';
import { LEVELS, levelToYearLabel } from '@/lib/level-utils';
import { PROGRAMMES } from '@/lib/programmes';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [level, setLevel] = useState<number>(0);
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [programme, setProgramme] = useState('');
  const [programmeModalOpen, setProgrammeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const handleRegister = async () => {
    if (!fullName.trim()) {
      showToast('Full name is required', 'error');
      return;
    }

    const emailErr = getStudentEmailError(email);
    if (emailErr) {
      showToast(emailErr, 'error');
      return;
    }

    const idErr = getStudentIdError(studentId);
    if (idErr) {
      showToast(idErr, 'error');
      return;
    }
    if (!level) {
      showToast('Please select your year', 'error');
      return;
    }
    if (!programme.trim()) {
      showToast('Please select your programme', 'error');
      return;
    }

    const pwdErr = getPasswordError(password);
    if (pwdErr) {
      showToast(pwdErr, 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords don't match", 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Please accept the Terms of Service and Privacy Policy to continue', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: 'student',
        user_id: studentId.trim(),
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

  const bg = isDark ? '#0f1419' : '#fcfcf7';
  const cardBg = isDark ? '#1a1f23' : '#fcfcf7';
  const inputBg = isDark ? '#2a2d30' : '#f0f1f3';
  const border = isDark ? '#383b3d' : '#e2e8f0';
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
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
          <Text style={[styles.title, { color: text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            Join Absense for smart attendance
          </Text>
        </View>


        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Full Name"
              placeholderTextColor={placeholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Email (username@st.knust.edu.gh)"
              placeholderTextColor={placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Student ID (8 digits)"
              placeholderTextColor={placeholder}
              value={studentId}
              onChangeText={(v) => setStudentId(v.replace(/\D/g, '').slice(0, 8))}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTouch, { backgroundColor: inputBg }]}
              onPress={() => setYearModalOpen(true)}
              disabled={isLoading}
            >
              <Text style={[styles.dropdownText, { color: level ? text : placeholder }]} numberOfLines={1}>
                {level ? levelToYearLabel(level) : 'Select year'}
              </Text>
              <IconSymbol name="chevron.down" size={18} color={muted} />
            </TouchableOpacity>
            <Modal visible={yearModalOpen} transparent animationType="slide">
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setYearModalOpen(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: cardBg }]} onStartShouldSetResponder={() => true}>
                  <Text style={[styles.modalTitle, { color: text }]}>Select Year</Text>
                  <FlatList
                    data={LEVELS}
                    keyExtractor={(item) => item.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.modalOption, level === item && { backgroundColor: Emerald[100] }]}
                        onPress={() => {
                          setLevel(item);
                          setYearModalOpen(false);
                        }}
                      >
                        <Text style={[styles.modalOptionText, { color: level === item ? Emerald[800] : text }]}>{levelToYearLabel(item)}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTouch, { backgroundColor: inputBg }]}
              onPress={() => setProgrammeModalOpen(true)}
              disabled={isLoading}
            >
              <Text style={[styles.dropdownText, { color: programme ? text : placeholder }]} numberOfLines={1}>
                {programme || 'Select your programme'}
              </Text>
              <IconSymbol name="chevron.down" size={18} color={muted} />
            </TouchableOpacity>
            <Modal visible={programmeModalOpen} transparent animationType="slide">
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setProgrammeModalOpen(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: cardBg }]} onStartShouldSetResponder={() => true}>
                  <Text style={[styles.modalTitle, { color: text }]}>Select Programme</Text>
                  <FlatList
                    data={PROGRAMMES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.modalOption, programme === item && { backgroundColor: Emerald[100] }]}
                        onPress={() => {
                          setProgramme(item);
                          setProgrammeModalOpen(false);
                        }}
                      >
                        <Text style={[styles.modalOptionText, { color: programme === item ? Emerald[800] : text }]}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Password"
              placeholderTextColor={placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text }]}
              placeholder="Confirm password"
              placeholderTextColor={placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Consent directly above button */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAcceptedTerms((prev) => !prev)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View
              style={[
                styles.consentCheckbox,
                { borderColor: border, backgroundColor: acceptedTerms ? Emerald[600] : 'transparent' },
              ]}
            >
              {acceptedTerms && <Text style={styles.consentCheckmark}>✓</Text>}
            </View>
            <Text style={[styles.consentText, { color: muted }]}>
              I agree to the{' '}
              <Text
                style={styles.consentLink}
                onPress={() => Linking.openURL('https://absense.knust.edu.gh/terms')}
              >
                Terms of Service
              </Text>
              {' '}&{' '}
              <Text
                style={styles.consentLink}
                onPress={() => Linking.openURL('https://absense.knust.edu.gh/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (isLoading || !acceptedTerms) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading || !acceptedTerms}
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
          <Text style={[styles.footerText, { color: footerMuted }]}>Already have an account? </Text>
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
    paddingHorizontal: 8,
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    height: 56,
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  dropdownTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  modalOptionText: {
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
  footerText: { fontSize: 13 },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Amber[600],
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 8,
  },
  consentCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontSize: 12,
  },
  consentLink: {
    textDecorationLine: 'underline',
    color: Amber[600],
    fontWeight: '600',
  },
});
