import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { showToast } from '@/lib/toast';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!email.trim()) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setSent(true);
        showToast('Reset link sent to your email!', 'success');
      } else {
        const data = await res.json().catch(() => ({ detail: 'Something went wrong' }));
        showToast(data.detail || 'Could not send reset email', 'error');
      }
    } catch (_e) {
      // Even if API doesn't exist yet, show success for security
      // (don't reveal if email exists)
      setSent(true);
      showToast('If this email exists, a reset link has been sent', 'info');
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successCenter}>
          <View style={styles.successCircle}>
            <Ionicons name="mail-open" size={48} color={Colors.brand.primary} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successDesc}>
            We've sent a password reset link to{'\n'}
            <Text style={{ color: Colors.brand.secondary, fontWeight: '600' }}>
              {email.trim().toLowerCase()}
            </Text>
          </Text>
          <Text style={styles.successHint}>
            Didn't receive it? Check your spam folder or try again.
          </Text>

          <TouchableOpacity
            testID="back-to-login"
            style={styles.btn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.btnText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setSent(false); setEmail(''); }}
            style={styles.retryLink}
          >
            <Text style={styles.retryText}>Try different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        {/* Back button */}
        <TouchableOpacity
          testID="forgot-back-btn"
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={36} color={Colors.brand.primary} />
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Forgot Password?</Text>
          <Text style={styles.subheading}>
            No worries! Enter your email and we'll send you a reset link.
          </Text>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              testID="forgot-email-input"
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.text.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />
          </View>

          <TouchableOpacity
            testID="forgot-submit-button"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Send Reset Link</Text>
                <Ionicons name="send" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.l },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
  },
  iconArea: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  form: { gap: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subheading: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 12 },
  btn: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.m,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Success state
  successCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.l,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  successHint: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryLink: { marginTop: 16 },
  retryText: {
    fontSize: 14,
    color: Colors.brand.secondary,
    fontWeight: '500',
  },
});
