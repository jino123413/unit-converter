import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'unit-converter',
  plugins: [
    appsInToss({
      brand: {
        displayName: '단위변환기',
        primaryColor: '#5C6BC0',
        icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/unit-converter.png',
        bridgeColorMode: 'basic',
      },
      permissions: [],
    }),
    router(),
    hermes(),
  ],
});
