import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Platform, Keyboard, Pressable } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as NavigationBar from "expo-navigation-bar";
import HeaderMenu from "@/components/HeaderMenu";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // iOS-specific
    shouldShowList: true, // iOS-specific
  }),
});

const hideSystemBars = async () => {
  if (Platform.OS === "android") {
    try {
      await NavigationBar.setVisibilityAsync("hidden");
      Keyboard.dismiss();
    } catch (e) {
      console.log("[ROOT DEBUG] NavigationBar error", e);
    }
  }
};

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

  const [loaded] = useFonts({
    ShareTechMono: require("../assets/fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf"),
    ChivoMono: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBold.ttf"),
    ChivoMonoItalic: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("notif_3", {
        name: "notif_3",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "glass_fixed.wav",
      });
      NavigationBar.setBehaviorAsync("sticky-immersive" as any);
      // Then hide it
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  const { theme: md3Theme } = useMaterial3Theme({
    sourceColor: "#3892b8",
  });

  const theme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: md3Theme.dark }
      : { ...MD3LightTheme, colors: md3Theme.light };

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setButtonStyleAsync(
      colorScheme === "dark" ? "light" : "dark",
    );
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider
        theme={theme}
        settings={{ icon: (props) => <Ionicons {...props} /> }}
      >
        <LinearGradient
          colors={[theme.colors.background, theme.colors.primary]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
          dither={false}
        >
          {/* Pressable handles the immersive mode toggle globally */}
          <Pressable onPress={hideSystemBars} style={{ flex: 1 }} hitSlop={0}>
            <Stack
              screenOptions={{
                headerShown: false, // We hide the root header because (main) has its own
                contentStyle: { backgroundColor: "transparent" },
                animation: "fade",
              }}
            >
              {/* This points to your (main)/_layout.tsx which has the Burger Menu */}
              <Stack.Screen name="(main)" />
            </Stack>
          </Pressable>
        </LinearGradient>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
