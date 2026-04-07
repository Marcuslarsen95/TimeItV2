import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

export default function MainLayout() {
  const theme = useTheme();

  React.useEffect(() => {
    Notifications.setNotificationChannelAsync("alarm", {
      name: "Alarm",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "bedside_alarm.mp3",
      enableVibrate: true,
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "transparent" }} />
        ),
        tabBarStyle: {
          borderTopWidth: 0,
          height: 60,
          elevation: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Countdown",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="interval"
        options={{
          title: "Interval",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stopwatch-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="random"
        options={{
          title: "Random",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shuffle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
