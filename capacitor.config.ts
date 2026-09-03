import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.howsthefield.app',
  appName: "How's the Field?",
  webDir: 'www',
  // The native shell always loads the live site, so new complexes/reviews show up
  // instantly with no app-store rebuild. www/index.html above is only a same-origin
  // placeholder Capacitor's tooling wants on disk — it's never actually shown.
  server: {
    url: 'https://howsthefield.com',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 700,
      backgroundColor: '#FFFDF7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFDF7',
    },
  },
};

export default config;
