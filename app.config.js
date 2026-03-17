export default {
  expo: {
    name: "TimeItV2",
    slug: "TimeItV2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/new_logo_clean.png",
    scheme: "timeitv2",
    userInterfaceStyle: "automatic",

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/logo_no_bg.png",
      },

      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.agentperry.TimeItV2",
    },
    androidStatusBar: {
      translucent: true,
      backgroundColor: "transparent",
    },
    androidNavigationBar: {
      visible: "always",
      buttonColor: "#000000",
      backgroundColor: "#00000000",
    },

    ios: {
      supportsTablet: true,
    },

    web: {
      output: "static",
      favicon: "./assets/images/new_logo_clean.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo_no_bg.png",
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
          behavior: "sticky-immersive",
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
