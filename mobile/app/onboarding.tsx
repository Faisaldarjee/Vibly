import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, FadeIn, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius } from '@/constants/Colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OnboardingPage {
  icon: string;
  iconColor: string;
  circleBg: string;
  title: string;
  subtitle: string;
  emoji: string;
}

const PAGES: OnboardingPage[] = [
  {
    icon: 'checkmark-circle',
    iconColor: '#7C3AED',
    circleBg: 'rgba(124, 58, 237, 0.12)',
    title: 'Build Better Habits',
    subtitle: 'Track daily habits, maintain streaks, and transform your routine. Small consistent steps lead to extraordinary results.',
    emoji: '💪',
  },
  {
    icon: 'heart-circle',
    iconColor: '#10B981',
    circleBg: 'rgba(16, 185, 129, 0.12)',
    title: 'Track Your Wellness',
    subtitle: 'Monitor mood, sleep, water intake, and steps — all in one beautiful dashboard. Know your body, own your health.',
    emoji: '🧘',
  },
  {
    icon: 'sparkles',
    iconColor: '#3B82F6',
    circleBg: 'rgba(59, 130, 246, 0.12)',
    title: 'AI-Powered Coaching',
    subtitle: 'Get personalized insights, daily motivation, and smart recommendations from your AI wellness coach.',
    emoji: '🤖',
  },
];

function DotIndicator({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 24 : 8);
  const bgOpacity = useSharedValue(active ? 1 : 0.3);

  React.useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 200 });
    bgOpacity.value = withTiming(active ? 1 : 0.3, { duration: 300 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: Colors.brand.primary },
        animStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (page !== currentPage) setCurrentPage(page);
  }

  function goNext() {
    if (currentPage < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * SCREEN_W, animated: true });
    } else {
      completeOnboarding();
    }
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <View style={styles.topBar}>
        <View />
        {currentPage < PAGES.length - 1 && (
          <TouchableOpacity
            testID="onboarding-skip"
            onPress={completeOnboarding}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {PAGES.map((page, index) => (
          <View key={index} style={styles.page}>
            {/* Icon Circle */}
            <Animated.View
              entering={FadeIn.delay(200).duration(600)}
              style={[styles.iconOuterGlow, { backgroundColor: page.circleBg }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: page.circleBg }]}>
                <Ionicons name={page.icon as any} size={64} color={page.iconColor} />
              </View>
            </Animated.View>

            {/* Emoji */}
            <Animated.Text
              entering={FadeInDown.delay(400).duration(500)}
              style={styles.emoji}
            >
              {page.emoji}
            </Animated.Text>

            {/* Title */}
            <Animated.Text
              entering={FadeInUp.delay(300).duration(600)}
              style={styles.title}
            >
              {page.title}
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text
              entering={FadeInUp.delay(500).duration(600)}
              style={styles.subtitle}
            >
              {page.subtitle}
            </Animated.Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomArea}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {PAGES.map((_, i) => (
            <DotIndicator key={i} active={i === currentPage} />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          testID="onboarding-next"
          style={styles.nextBtn}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>
            {currentPage === PAGES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentPage === PAGES.length - 1 ? 'rocket' : 'arrow-forward'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.main,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    height: 48,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  page: {
    width: SCREEN_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  iconOuterGlow: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.m,
    height: 56,
    width: '100%',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
