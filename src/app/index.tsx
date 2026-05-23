import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useGoals } from '@/features/goals/hooks/useGoals';
import { useColors } from '@/hooks/useColors';

export default function Index() {
  const colors = useColors();
  const { goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (goals !== null) {
    return <Redirect href="/(tabs)/diary" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
