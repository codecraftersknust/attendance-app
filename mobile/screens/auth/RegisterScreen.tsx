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
          <Image
            source={require('@/assets/images/absense-logo.png')}
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
              placeholder="username@st.knust.edu.gh"
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
              Student ID <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="8 digits (e.g. 12345678)"
              placeholderTextColor={muted}
              value={studentId}
              onChangeText={(v) => setStudentId(v.replace(/\D/g, '').slice(0, 8))}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: muted }]}>
              Year <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTouch, { backgroundColor: inputBg, borderColor: border }]}
              onPress={() => setYearModalOpen(true)}
              disabled={isLoading}
            >
              <Text style={[styles.dropdownText, { color: level ? text : muted }]} numberOfLines={1}>
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
            <Text style={[styles.label, { color: muted }]}>
              Programme <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTouch, { backgroundColor: inputBg, borderColor: border }]}
              onPress={() => setProgrammeModalOpen(true)}
              disabled={isLoading}
            >
              <Text style={[styles.dropdownText, { color: programme ? text : muted }]} numberOfLines={1}>
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
            <Text style={[styles.label, { color: muted }]}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              placeholder="Min 8 chars, letter + number"
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
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 18,
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
  input: {
    height: 52,
    borderWidth: 1,
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
  footerText: { fontSize: 15 },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: Amber[600],
  },
});
