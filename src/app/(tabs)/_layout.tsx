import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '@/lib/theme/tokens';
import { useDb } from '@/hooks/useDb';
import { getGoals } from '@/lib/db/queries/goals';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

function OnboardingGate() {
  const db = useDb();
  useEffect(() => {
    if (!db) return;
    if (!getGoals(db)) {
      const id = setTimeout(() => router.replace('/onboarding'), 0);
      return () => clearTimeout(id);
    }
  }, [db]);
  return null;
}

export default function TabLayout() {
  return (
    <>
      <OnboardingGate />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
          },
        }}
      >
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Diary',
            tabBarAccessibilityLabel: 'Diary tab',
            tabBarIcon: tabIcon('book', 'book-outline'),
          }}
        />
        <Tabs.Screen
          name="foods"
          options={{
            title: 'Foods',
            tabBarAccessibilityLabel: 'Foods tab',
            tabBarIcon: tabIcon('search', 'search-outline'),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarAccessibilityLabel: 'Progress tab',
            tabBarIcon: tabIcon('trending-up', 'trending-up-outline'),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarAccessibilityLabel: 'Settings tab',
            tabBarIcon: tabIcon('person', 'person-outline'),
          }}
        />
      </Tabs>
    </>
  );
}
