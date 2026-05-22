import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IntroSlides } from '@/features/onboarding/components/IntroSlides';
import { GoalsForm } from '@/features/goals/components/GoalsForm';
import { useGoalsMutations } from '@/features/goals/hooks/useGoalsMutations';
import { colors, spacing, fontSize, fontWeight } from '@/lib/theme/tokens';

type Phase = 'intro' | 'goals';

export default function OnboardingScreen() {
  const [phase, setPhase] = useState<Phase>('intro');
  const { saveGoals } = useGoalsMutations();

  if (phase === 'intro') {
    return <IntroSlides onDone={() => setPhase('goals')} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          We'll use this to calculate your personalised calorie and macro targets.
        </Text>
      </View>

      <GoalsForm
        submitLabel="Get Started"
        onSubmit={values => {
          saveGoals.mutate(values, {
            onSuccess: () => router.replace('/(tabs)/diary'),
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
});
