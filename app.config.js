export default {
  expo: {
    name: "TimeItV2",
    slug: "TimeItV2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/cria-icon.png",
    scheme: "timeitv2",
    userInterfaceStyle: "automatic",

    android: {
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/cria-icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.agentperry.TimeItV2",
      backgroundColor: "transparent",
    },
    androidStatusBar: {
      translucent: true,
      backgroundColor: "#00000000",
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
      favicon: "./assets/images/cria-icon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/cria-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
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
