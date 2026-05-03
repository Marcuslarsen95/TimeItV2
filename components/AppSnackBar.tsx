import React from "react";
import { Pressable, View } from "react-native";
import { Snackbar, Text, useTheme } from "react-native-paper";

interface SnackAction {
  label: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  /**
   * Background colour. If omitted, Material 3's inverseSurface is used —
   * a dark-on-light (or light-on-dark) high-contrast surface that's
   * deliberately *not* the primary brand colour, so it stands out from
   * the play button. Pass `theme.colors.error` for error variants.
   */
  color?: string;
  textColor?: string;
  action?: SnackAction;
  /**
   * Optional second action button. When provided, the snackbar renders
   * both buttons inline (react-native-paper's native `action` prop only
   * supports one). Useful for upsell prompts that want both
   * "Upgrade" and "Manage presets".
   */
  secondaryAction?: SnackAction;
  /**
   * Optional override for how long the snackbar stays up (ms).
   * Defaults to 2000ms; prompts with actions want longer so the
   * user has time to read it and tap the action button.
   */
  duration?: number;
}

// Lift the snackbar high enough that it clears the action buttons row.
// ActionButtonsRow is ~50px tall + ~20px row margin + ~40px outerContainer
// bottom padding; 110 sits cleanly above with breathing room.
const DEFAULT_BOTTOM_OFFSET = 110;

export default function AppSnackbar({
  visible,
  message,
  onDismiss,
  color,
  textColor,
  action,
  secondaryAction,
  duration = 2000,
}: Props) {
  const theme = useTheme();

  // secondaryContainer is a subtle dark surface in dark mode (with a hint
  // of the seed colour) and a soft tinted surface in light mode. It's
  // already used by SettingsModal so the snackbar feels cohesive, and it
  // stays dark across all 10 theme seed colours from useMaterial3Theme.
  const resolvedColor = color ?? theme.colors.secondaryContainer;
  const resolvedTextColor = textColor ?? theme.colors.onSecondaryContainer;
  // Plain `primary` (orange) on the dark secondaryContainer reads cleanly
  // and ties the action back to the rest of the app's accent colour.
  const actionColor = theme.colors.primary;

  const hasTwoActions = !!action && !!secondaryAction;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      // Only feed the native `action` prop when we have a single action;
      // otherwise we render both inline ourselves below.
      action={hasTwoActions ? undefined : action}
      wrapperStyle={{ bottom: DEFAULT_BOTTOM_OFFSET }}
      style={{ backgroundColor: resolvedColor }}
      // Override the on-surface text colour the Snackbar uses internally
      // for its message string, so single-message snackbars are readable.
      theme={{ colors: { inverseOnSurface: resolvedTextColor } }}
    >
      {hasTwoActions ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Text style={{ color: resolvedTextColor, flexShrink: 1 }}>
            {message}
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginLeft: "auto" }}>
            {secondaryAction && (
              <Pressable
                onPress={() => {
                  secondaryAction.onPress();
                  onDismiss();
                }}
                hitSlop={8}
              >
                <Text
                  style={{
                    color: actionColor,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    fontSize: 13,
                  }}
                >
                  {secondaryAction.label}
                </Text>
              </Pressable>
            )}
            {action && (
              <Pressable
                onPress={() => {
                  action.onPress();
                  onDismiss();
                }}
                hitSlop={8}
              >
                <Text
                  style={{
                    color: actionColor,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: 13,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        message
      )}
    </Snackbar>
  );
}
