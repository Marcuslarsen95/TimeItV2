import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface TimerDisplayProps {
  time: string;
  ms?: string; // The ? makes it optional
  isPaused: boolean;
  isRunning: boolean;
  statusLabel: string;
  statusColor?: string;
  statusIcon?: string;
}

const TimerDisplay = ({
  time,
  ms,
  isPaused,
  isRunning,
  statusLabel,
  statusColor,
  statusIcon,
}: TimerDisplayProps) => {
  const theme = useTheme();

  // Shared text style to keep it clean
  const timerTextStyle = {
    fontFamily: "ChivoMonoItalic",
    includeFontPadding: false,
    opacity: isPaused ? 0.5 : 1, // Dim the text when paused
  };

  // Default color if none provided
  const activeColor = statusColor || theme.colors.primary;

  return (
    <View
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 36,
        marginTop: 16,
      }}
    >
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          width: 250,
        }}
      >
        {ms && <View style={{ width: 60 }} />}
        <View>
          <Text
            variant="displayLarge"
            style={[
              timerTextStyle,
              {
                fontSize: 76,
                lineHeight: 110,
                textAlign: "center",
              },
            ]}
          >
            {isRunning ? time : "00:00"}
          </Text>
        </View>

        {ms && (
          <View style={{ width: 60 }}>
            <Text
              variant="headlineSmall"
              style={[
                timerTextStyle,
                {
                  fontSize: 32,
                  textAlign: "left",
                },
              ]}
            >
              {ms}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TimerDisplay;
