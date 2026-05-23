import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NutrientTracker',
  slug: 'nutrient-tracker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F0F0F',
  },
  ios: {
    bundleIdentifier: 'com.nutrienttracker.app',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'Used to photograph food for nutrition estimation.',
      NSPhotoLibraryUsageDescription:
        'Used to select food photos for nutrition estimation.',
    },
  },
  android: {
    package: 'com.nutrienttracker.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F0F0F',
    },
    permissions: ['CAMERA', 'READ_MEDIA_IMAGES'],
    edgeToEdgeEnabled: true,
  },
  plugins: [
    ['expo-router', { root: 'src/app' }],
    'expo-sqlite',
    'expo-camera',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Used to select food photos for nutrition estimation.',
        cameraPermission:
          'Used to photograph food for nutrition estimation.',
      },
    ],
  ],
  scheme: 'nutrienttracker',
  extra: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? null,
    eas: { projectId: '1f0c7cbe-1960-458e-a588-bcde1ea7fcef' },
  },
});
