export default {
  expo: {
    name: "TimeItV2",
    slug: "TimeItV2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo_no_bg_v4.png",
    scheme: "timeitv2",
    userInterfaceStyle: "automatic",

    notification: {
      icon: "./assets/images/notification_icon.png", // The all-white PNG you made
      color: "#3892B8", // The color that appears behind the icon in the drawer
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/logo_no_bg_v4.png",
      },

      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.agentperry.TimeItV2",
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
      favicon: "./assets/images/new_logo_clean.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo_no_bg_v4.png",
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
