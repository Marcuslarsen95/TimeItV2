import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Platform, View } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

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
  const colorScheme = useColorScheme(); // detects "dark" or "light";

  const [loaded] = useFonts({
    ShareTechMono: require("../assets/fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf"),
    ChivoMono: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBold.ttf"),
    ChivoMonoItalic: require("../assets/fonts/Chivo_Mono/static/ChivoMono-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });

      Notifications.deleteNotificationChannelAsync("alarm").then(() => {
        Notifications.setNotificationChannelAsync("alarm", {
          name: "Alarm",
          importance: Notifications.AndroidImportance.MAX,
          sound: "bedside_alarm.mp3",
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          },
          bypassDnd: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      });

      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  const [userColor, setUserColor] = useState("#e9b570");
  const { theme: md3Theme } = useMaterial3Theme({
    sourceColor: userColor,
  });

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

  useEffect(() => {
    if (Platform.OS !== "android") return;

    NavigationBar.setVisibilityAsync("hidden");

    const sub = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (visibility === "visible") {
        setNavBarVisible(true);
        setTimeout(() => {
          NavigationBar.setVisibilityAsync("hidden");
          setNavBarVisible(false);
        }, 3000);
      }
    });

    return () => sub.remove();
  }, []);
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "transparent" }}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <PaperProvider
        theme={theme}
        settings={{ icon: (props) => <Ionicons {...props} /> }}
      >
        {/* <LinearGradient
          colors={[
            theme.colors.background,
            colorScheme === "dark"
              ? theme.colors.primary + "22"
              : theme.colors.primary + "CC",
          ]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          dither={false}
        /> */}
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
