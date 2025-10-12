// app/signup.tsx

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match!");
      return;
    }
    // Handle successful sign-up logic here
    console.log({ email, password });
    Alert.alert('Success', 'Account created successfully!');
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <BlurView intensity={80} tint="light" style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <LinearGradient
                colors={['#89f7fe', '#66a6ff']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

           

          </BlurView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden', // This is important for borderRadius to work with BlurView
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    color: '#fff',
    fontSize: 16,
  },
  button: {
    width: '100%',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a233e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  }
});