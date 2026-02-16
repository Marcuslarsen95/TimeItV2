import { Stack } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { useEffect } from "react";
import { useKeepAwake } from "expo-keep-awake";
import * as Notifications from "expo-notifications";
import Ionicons from "@expo/vector-icons/Ionicons";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // iOS-specific
    shouldShowList: true, // iOS-specific
  }),
});

const _handleSearch = async () => {
  {
    /* insert functionality here */
  }
};

const _handleMore = async () => {
  {
    /* insert functionality here */
  }
};

const _goBack = async () => {
  {
    /* insert functionality here */
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme(); // detects "dark" or "light";

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("notif_3", {
        name: "notif_3",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "glass_fixed.wav", // must match your /res/raw file
      });
    }
  }, []);

  const lightColors = {
    primary: "#07881f",
    onPrimary: "#ffffff",

    secondary: "#5ff7c7",
    onSecondary: "#022c08",

    tertiary: "#0ce4b1",
    onTertiary: "#022c08",

    background: "#ecfeee",
    onBackground: "#022c08",

    surface: "#ffffff",
    onSurface: "#022c08",

    surfaceVariant: "#d7f3da",
    onSurfaceVariant: "#1a3d1f",

    outline: "#5a7c5f",
    outlineVariant: "#c3e6c7",
  };

  const darkColors = {
    primary: "#75f88e",
    onPrimary: "#011203",

    secondary: "#089e6f",
    onSecondary: "#d4fdda",

    tertiary: "#19f3c0",
    onTertiary: "#011203",

    background: "#011203",
    onBackground: "#d4fdda",

    surface: "#051a08",
    onSurface: "#d4fdda",

    surfaceVariant: "#0b2a12",
    onSurfaceVariant: "#bcecc4",

    outline: "#2f5a36",
    outlineVariant: "#1a3a20",
  };

  const theme = {
    ...(colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(colorScheme === "dark" ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...(colorScheme === "dark" ? darkColors : lightColors),
    },
  };

  return (
    <PaperProvider
      theme={theme}
      settings={{ icon: (props) => <Ionicons {...props} /> }}
    >
      <Stack
        screenOptions={{
          // This hides the outer Stack's header globally
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}
