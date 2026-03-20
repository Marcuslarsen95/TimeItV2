import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import React from "react";

interface TimerDisplayProps {
  time: string;
  ms?: string; // The ? makes it optional
  isPaused: boolean;
  isRunning: boolean;
}

const TimerDisplay = ({ time, ms, isPaused, isRunning }: TimerDisplayProps) => {
  const theme = useTheme();

  // Shared text style to keep it clean
  const timerTextStyle = {
    fontFamily: "ChivoMonoItalic",
    includeFontPadding: false,
    opacity: isPaused ? 0.5 : 1, // Dim the text when paused
  };

  return (
    <View
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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
                fontSize: 96,
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
