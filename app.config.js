export default {
  expo: {
    name: "Cria Timer",
    slug: "cria-timer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon_logo_full.png",
    scheme: "cria-timer",
    userInterfaceStyle: "automatic",

    android: {
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#16191d",
        foregroundImage: "./assets/images/icon_logo_adaptive.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.agentperry.criatimer",
      backgroundColor: "#16191d",
      allowBackup: true,
    },
    androidStatusBar: {
      translucent: true,
    },
    androidNavigationBar: {
      visible: "always",
      buttonColor: "#000000",
      backgroundColor: "#000000",
    },

    ios: {
      supportsTablet: true,
    },

    web: {
      output: "static",
      favicon: "./assets/images/icon_logo_full.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon_logo_full.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#16191d", // charcoal bg for light mode too
          dark: {
            backgroundColor: "#16191d", // same — unified look
          },
        },
      ],
      [
        "expo-navigation-bar",
        {
          appearance: "light",
          behavior: "inset-swipe",
          visibility: "hidden",
          isTranslucent: true,
        },
      ],
      "expo-font",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
