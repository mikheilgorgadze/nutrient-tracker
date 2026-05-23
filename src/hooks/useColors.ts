import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type AppColors } from '@/lib/theme/tokens';
import { useThemeStore } from '@/store/themeStore';

export function useColors(): AppColors {
  const mode = useThemeStore(s => s.mode);
  const system = useColorScheme();

  const scheme = mode === 'system' ? (system ?? 'dark') : mode;
  return scheme === 'light' ? lightColors : darkColors;
}
