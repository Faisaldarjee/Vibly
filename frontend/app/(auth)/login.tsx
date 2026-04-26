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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}! 👋`, 'success');
      router.replace('/(tabs)');
    } catch (e: any) {
      showToast(e.message || 'Login failed. Please try again.', 'error');
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
          <Text style={styles.tagline}>Track it. Feel it. Vibly.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Welcome Back</Text>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              testID="login-email-input"
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
              testID="login-password-input"
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            testID="forgot-password-link"
            onPress={() => router.push('/(auth)/forgot-password' as any)}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-submit-button"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-signup-link"
            onPress={() => router.push('/(auth)/signup')}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkBold}>Sign Up</Text>
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
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  logoLetter: { fontSize: 32, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 12 },
  tagline: { fontSize: 13, color: Colors.text.secondary, marginTop: 4 },
  form: { gap: 16 },
  heading: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.m, borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, height: 56,
  },
  input: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 12 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { fontSize: 13, color: Colors.brand.secondary, fontWeight: '500' },
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
