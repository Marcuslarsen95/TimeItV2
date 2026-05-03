import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useProStatus } from "@/hooks/use-pro-status";
import SettingsModal from "./SettingsModal";

/**
 * Event name other screens can emit to pop the Settings modal open
 * (used by upgrade snackbars etc.). Kept here so callers don't have
 * to repeat the magic string.
 */
export const OPEN_SETTINGS_EVENT = "OpenSettings";

/**
 * Floating top-right icon that opens the Settings modal.
 * - Free users: diamond outline (signals Pro upsell)
 * - Pro users: burger menu
 *
 * Also listens for `OPEN_SETTINGS_EVENT` so anywhere in the app can
 * `DeviceEventEmitter.emit(OPEN_SETTINGS_EVENT)` to open the panel.
 */
const SettingsTrigger = () => {
  const theme = useTheme();
  const { isPro } = useProStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(OPEN_SETTINGS_EVENT, () => {
      setOpen(true);
    });
    return () => sub.remove();
  }, []);

  const iconName = isPro ? "menu-outline" : "diamond-outline";
  const iconColor = isPro ? theme.colors.onSurface : theme.colors.primary;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={12}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name={iconName as any} size={26} color={iconColor} />
      </Pressable>
      <SettingsModal visible={open} onDismiss={() => setOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SettingsTrigger;
