import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import { Appbar, useTheme } from "react-native-paper";

export default function TabLayout() {
  const router = useRouter();
  const theme = useTheme();
  const navColor = theme.dark
    ? theme.colors.surfaceVariant
    : theme.colors.surfaceVariant;

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => {
          const canGoBack = router.canGoBack();
          return (
            <Appbar.Header
              style={{
                backgroundColor: navColor,
                borderBottomColor: theme.colors.outlineVariant,
                borderBottomWidth: 1,
              }}
            >
              {canGoBack && <Appbar.BackAction onPress={() => router.back()} />}
              <Appbar.Content title={options.title} />
              <Appbar.Action icon="search" onPress={() => {}} />
              <Appbar.Action icon="menu" onPress={() => {}} />
            </Appbar.Header>
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          backgroundColor: navColor,
          borderTopColor: theme.colors.outlineVariant, // Adds a subtle MD3 separator
          borderTopWidth: 1,
        },
      }}
    >
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
    </Tabs>
  );
}
