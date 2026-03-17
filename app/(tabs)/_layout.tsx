import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import { Appbar, useTheme } from "react-native-paper";

export default function TabLayout() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => {
          const canGoBack = router.canGoBack();
          return (
            <Appbar.Header
              style={{
                backgroundColor: "transparent",
              }}
            >
              {canGoBack && <Appbar.BackAction onPress={() => router.back()} />}
              <Appbar.Content title={options.title} />
              {/* <Appbar.Action icon="search" onPress={() => {}} /> */}
              <Appbar.Action icon="menu" onPress={() => {}} />
            </Appbar.Header>
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          padding: 20,
          height: 60,
        },

        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen
        name="interval"
        options={{
          title: "Interval",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "swap-horizontal-sharp" : "swap-horizontal-outline"
              }
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Timer",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "timer-sharp" : "timer-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="random"
        options={{
          title: "Random",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "help-sharp" : "help-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
