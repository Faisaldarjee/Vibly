import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { useAuth } from '../_layout';
import { showToast } from '@/lib/toast';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      showToast(`Welcome to Vibly, ${data.user.name}! 🎉`, 'success');
      router.replace('/(tabs)');
    } catch (e: any) {
      showToast(e.message || 'Signup failed. Please try again.', 'error');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.appName}>VIBLY</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Create Account</Text>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              testID="signup-name-input"
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.text.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              testID="signup-email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.text.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              testID="signup-password-input"
              style={styles.input}
              placeholder="Password (min 6 chars)"
              placeholderTextColor={Colors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="signup-submit-button"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="signup-login-link"
            onPress={() => router.back()}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.l },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoLetter: { fontSize: 28, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 10 },
  form: { gap: 16 },
  heading: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.m, borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, height: 56,
  },
  input: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 12 },
  btn: {
    backgroundColor: Colors.brand.primary, borderRadius: Radius.m,
    height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: Colors.text.secondary, fontSize: 14 },
  linkBold: { color: Colors.brand.secondary, fontWeight: '600' },
});
