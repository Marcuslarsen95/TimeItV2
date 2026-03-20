import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import React from "react";

import { Ionicons } from "@expo/vector-icons";

interface StatusBadgeProps {
  statusColor?: string;
  statusLabel: string;
  statusIcon?: string;
}

export default function StatusBadge({
  statusColor,
  statusLabel,
  statusIcon,
}: StatusBadgeProps) {
  const theme = useTheme();
  // Default color if none provided
  const activeColor = statusColor || theme.colors.primary;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        alignItems: "center",
        backgroundColor: activeColor,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 20,
      }}
    >
      {statusIcon && (
        <Ionicons
          name={statusIcon as any}
          size={20}
          color={theme.colors.onPrimary}
        />
      )}
      <Text
        style={{
          fontFamily: "ChivoMonoItalic",
          color: theme.colors.onPrimary,
          fontSize: 18,
        }}
      >
        {statusLabel}
      </Text>
    </View>
  );
}
