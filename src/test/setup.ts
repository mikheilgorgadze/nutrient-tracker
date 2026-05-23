// @testing-library/react-native v12.4+ includes Jest matchers built-in (no separate import needed)

// Pin all components to dark theme in tests so color assertions are deterministic.
// Tests should not care about theme switching — that's a visual concern, not a behaviour concern.
jest.mock('@/hooks/useColors', () => ({
  useColors: () => require('@/lib/theme/tokens').darkColors,
}));

// Silence Reanimated warnings in test environment
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Silence act() warnings
(global as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Simulate Hermes JS engine: crypto is NOT available as a global in React Native.
// This makes tests fail fast on any code that uses crypto.randomUUID() or similar,
// rather than silently passing in Node.js and crashing on device.
delete (global as unknown as Record<string, unknown>).crypto;

// Mock expo-constants with a test API key
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        ANTHROPIC_API_KEY: 'test-key-for-jest',
      },
    },
  },
}));

// Mock expo-sqlite — native module not available in Node/Jest
const mockSQLiteDb = {
  getAllSync: jest.fn().mockReturnValue([]),
  getFirstSync: jest.fn().mockReturnValue(null),
  runSync: jest.fn().mockReturnValue({ lastInsertRowId: 1, changes: 1 }),
  execSync: jest.fn().mockReturnValue(undefined),
  withTransactionSync: jest.fn().mockImplementation((fn: () => void) => fn()),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  execAsync: jest.fn().mockResolvedValue(undefined),
  withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockSQLiteDb),
}));

// Mock @expo/vector-icons — requires native font loading
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-image-picker — native camera/gallery access
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock expo-image-manipulator — native image processing
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'mock://image.jpg', base64: 'base64data' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

// Mock expo-haptics — native vibration not available in Jest
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
}));
