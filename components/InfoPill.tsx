import React from "react";
import { View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface Props {
  /** Icon node — pass any vector-icon directly so caller picks the set */
  icon?: React.ReactNode;
  label: string;
  /** "default" = subtle surfaceVariant, "accent" = primaryContainer pop */
  tone?: "default" | "accent";
  style?: ViewStyle;
}

export default function InfoPill({
  icon,
  label,
  tone = "default",
  style,
}: Props) {
  const theme = useTheme();
  const bg =
    tone === "accent"
      ? theme.colors.primaryContainer
      : theme.colors.surfaceVariant;
  const fg =
    tone === "accent"
      ? theme.colors.onPrimaryContainer
      : theme.colors.onSurfaceVariant;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: bg,
          alignSelf: "flex-start", // hugs content width instead of stretching
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}
