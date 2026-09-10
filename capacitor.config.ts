import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.howsthefield.app',
  appName: "How's the Field?",
  // The app bundles its own UI (built via `npm run cap:build`, which writes
  // a static export to out/) instead of loading the live site remotely —
  // it's a standalone app that talks to the same Supabase/API backend as
  // the website, not a wrapped browser view of howsthefield.com.
  webDir: 'out',
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
