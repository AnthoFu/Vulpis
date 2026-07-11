const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const clientIdPrefix = clientId.split('.')[0] || '';

module.exports = {
  expo: {
    name: "Vulpis",
    slug: "Vulpis",
    version: "0.3.1",
    scheme: [
      "vulpis",
      clientIdPrefix ? `com.googleusercontent.apps.${clientIdPrefix}` : null
    ].filter(Boolean),
    newArchEnabled: false,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anthofu.Vulpis",
      infoPlist: {
        UIBackgroundModes: [
          "audio"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#090A0F",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      permissions: [
        "WAKE_LOCK",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "READ_MEDIA_AUDIO",
        "READ_EXTERNAL_STORAGE"
      ],
      package: "com.anthofu.Vulpis"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-media-library",
        {
          "granularPermissions": [
            "audio"
          ]
        }
      ],
      "expo-web-browser"
    ]
  }
};
