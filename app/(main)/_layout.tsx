import React from "react";
import { Stack } from "expo-router";
import { View, Platform } from "react-native";
import { useTheme } from "react-native-paper";
import HeaderMenu from "@/components/HeaderMenu";

export default function MainLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        // Instead of headerTitle, we provide a custom 'header' function
        // This gives us a 100% custom container that is NOT restricted by TS
        header: () => (
          <View
            style={{
              height: Platform.OS === "android" ? 100 : 80,
              paddingTop: Platform.OS === "android" ? 40 : 0,
              flexDirection: "row",
              alignItems: "center",
              // paddingHorizontal: 16,
              // We ensure this view is "above" the Root Pressable
              zIndex: 100,
            }}
          >
            <HeaderMenu />
          </View>
        ),
        contentStyle: { backgroundColor: "transparent" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="interval" />
      <Stack.Screen name="random" />
    </Stack>
  );
}
