import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        // 1. Check if user has seen onboarding
        const onboarded = await AsyncStorage.getItem('onboarded');
        if (!onboarded) {
          router.replace('/onboarding' as any);
          return;
        }

        // 2. Check if user has a valid token
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const user = await res.json();
              await AsyncStorage.setItem('user', JSON.stringify(user));
              router.replace('/(tabs)');
              return;
            }
          } catch (_networkError) {
            // Network error — still try to navigate with cached user
            const cachedUser = await AsyncStorage.getItem('user');
            if (cachedUser) {
              router.replace('/(tabs)');
              return;
            }
          }
        }
      } catch (_e) {}

      // Fallback: clear stale data and go to login
      await AsyncStorage.multiRemove(['token', 'user']);
      router.replace('/(auth)/login');
    };
    setTimeout(check, 800);
  }, []);

  return (
    <View testID="splash-screen" style={styles.container}>
      <View style={styles.logoGlow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>V</Text>
        </View>
      </View>
      <Text style={styles.appName}>VIBLY</Text>
      <Text style={styles.tagline}>Track it. Feel it. Vibly.</Text>
      <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.bg.main,
    justifyContent: 'center', alignItems: 'center',
  },
  logoGlow: {
    padding: 12,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 30, elevation: 15,
  },
  logoLetter: { fontSize: 38, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 20, letterSpacing: 4 },
  tagline: { fontSize: 14, color: Colors.text.secondary, marginTop: 6, letterSpacing: 1 },
});
