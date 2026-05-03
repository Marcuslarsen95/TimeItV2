import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useColorScheme,
  Platform,
  View,
  DeviceEventEmitter,
} from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { createMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  AntDesign,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "@/hooks/use-user-preferences";
import { DEFAULT_THEME_COLOR } from "@/constants/theme-colors";

// Tag passed to expo-keep-awake so other potential keep-awake activations
// in the app (none today, but future-proofing) don't toggle ours off.
const TIMER_KEEP_AWAKE_TAG = "cria-timer-active";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // iOS-specific
    shouldShowList: true, // iOS-specific
  }),
});

export default function RootLayout() {
  return (
    <UserPreferencesProvider>
      <RootLayoutInner />
    </UserPreferencesProvider>
  );
}

function RootLayoutInner() {
  const colorScheme = useColorScheme(); // detects "dark" or "light";

  const [loaded] = useFonts({
    ShareTechMono: require("../assets/fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf"),
    ChivoMono: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBold.ttf"),
    ChivoMonoItalic: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      // Permission only — Android 13+ requires POST_NOTIFICATIONS for the
      // foreground service notification to display. The actual notification
      // channels (interval_channel and alarm_channel) are created natively
      // by IntervalService.kt, so we don't need to set them up here too.
      Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });
    }
  }, []);

  // Keep the screen awake while a timer is running so users can glance at
  // the countdown without the display sleeping mid-workout. We listen
  // globally to the native IntervalService events so this works regardless
  // of which tab the user is on.
  const keepAwakeActiveRef = useRef(false);
  useEffect(() => {
    const setActive = async (active: boolean) => {
      if (active === keepAwakeActiveRef.current) return;
      keepAwakeActiveRef.current = active;
      try {
        if (active) {
          await activateKeepAwakeAsync(TIMER_KEEP_AWAKE_TAG);
        } else {
          deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG);
        }
      } catch {
        // Some devices reject keep-awake under aggressive battery saver —
        // not worth surfacing to the user.
      }
    };

    const subUpdate = DeviceEventEmitter.addListener("IntervalUpdate", () => {
      setActive(true);
    });
    const subResume = DeviceEventEmitter.addListener("IntervalResumed", () => {
      setActive(true);
    });
    // Pause / Stop / Alarm-fired all signal "no longer actively counting".
    const subPause = DeviceEventEmitter.addListener("IntervalPaused", () => {
      setActive(false);
    });
    const subStop = DeviceEventEmitter.addListener("IntervalStopped", () => {
      setActive(false);
    });
    const subAlarmStart = DeviceEventEmitter.addListener("AlarmStarted", () => {
      setActive(false);
    });

    return () => {
      subUpdate.remove();
      subResume.remove();
      subPause.remove();
      subStop.remove();
      subAlarmStart.remove();
      // Belt-and-braces: ensure we don't leave the screen permanently awake
      // if the layout unmounts mid-timer (e.g. dev reload).
      if (keepAwakeActiveRef.current) {
        deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG);
        keepAwakeActiveRef.current = false;
      }
    };
  }, []);

  const { preferences } = useUserPreferences();
  const userColor = preferences.themeColor || DEFAULT_THEME_COLOR;
  // Compute the M3 palette directly so it derives from userColor
  // (the stateful useMaterial3Theme hook only uses sourceColor for its
  // initial value and doesn't re-run on prop changes)
  const md3Theme = useMemo(() => createMaterial3Theme(userColor), [userColor]);

  const theme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: md3Theme.dark }
      : {
          ...MD3LightTheme,
          colors: {
            ...md3Theme.light,
            background: "#F6F3EE", // slightly warm off-white
          },
        };

  useEffect(() => {
    // NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setButtonStyleAsync(
      colorScheme === "dark" ? "light" : "dark",
    );
  }, [colorScheme]);

  const [navBarVisible, setNavBarVisible] = useState(false);

  // useEffect(() => {
  //   if (Platform.OS !== "android") return;

  //   NavigationBar.setVisibilityAsync("hidden");

  //   const sub = NavigationBar.addVisibilityListener(({ visibility }) => {
  //     if (visibility === "visible") {
  //       setNavBarVisible(true);
  //       setTimeout(() => {
  //         NavigationBar.setVisibilityAsync("hidden");
  //         setNavBarVisible(false);
  //       }, 3000);
  //     }
  //   });

  //   return () => sub.remove();
  // }, []);
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "transparent" }}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <PaperProvider
        theme={theme}
        settings={{
          icon: ({ name, color, size }) => {
            if (!name) return null;
            if (name.startsWith("ant:")) {
              return (
                <AntDesign
                  name={name.slice(4) as any}
                  color={color}
                  size={size}
                />
              );
            }
            if (name.startsWith("mci:")) {
              return (
                <MaterialCommunityIcons
                  name={name.slice(4) as any}
                  color={color}
                  size={size}
                />
              );
            }
            if (name.startsWith("mi:")) {
              return (
                <MaterialIcons
                  name={name.slice(3) as any}
                  color={color}
                  size={size}
                />
              );
            }
            // Default: Ionicons
            return <Ionicons name={name as any} color={color} size={size} />;
          },
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
          }}
        />
        <View
          style={{ flex: 1, paddingBottom: navBarVisible ? 32 : 0 }}
          collapsable={false}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
