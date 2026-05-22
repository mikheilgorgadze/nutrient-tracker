import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'book-outline',
    color: colors.accent,
    title: 'Log every meal',
    body: 'Search 10,000+ foods or scan a barcode to log breakfast, lunch, dinner, and snacks. Use the camera to let AI estimate your plate.',
  },
  {
    icon: 'trending-up-outline',
    color: '#a78bfa',
    title: 'Adaptive calorie targets',
    body: 'Your TDEE is calculated from your weight history — not just a formula. The more you log, the more accurate your targets get.',
  },
  {
    icon: 'scale-outline',
    color: '#34d399',
    title: 'Track your weight',
    body: 'Log your weight daily and watch the trend smooth out the noise. Consistency for 2+ weeks gives you a reliable picture.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#f59e0b',
    title: 'Fully offline & private',
    body: 'All your data stays on your phone. No account, no cloud sync. Export a backup JSON anytime from Settings.',
  },
];

interface IntroSlidesProps {
  onDone: () => void;
}

export function IntroSlides({ onDone }: IntroSlidesProps) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function goTo(next: number) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <Animated.View
            key={i}
            style={[styles.slide, i === index ? { opacity: fadeAnim } : { opacity: 0 }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: slide.color + '22' }]}>
              <Ionicons name={slide.icon} size={52} color={slide.color} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            accessibilityLabel={`Slide ${i + 1}`}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {index > 0 ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => goTo(index - 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={isLast ? onDone : () => goTo(index + 1)}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Get started' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color={colors.background} />}
        </TouchableOpacity>
      </View>

      {!isLast && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  slideTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  slideBody: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  nextBtnText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
});
