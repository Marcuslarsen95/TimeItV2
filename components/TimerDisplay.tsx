import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import React, { useEffect, useState, useRef } from "react";

interface TimerDisplayProps {
  time: string;
  ms?: string; // The ? makes it optional
  isPaused: boolean;
  isRunning: boolean;
  isRandom?: boolean;
}

const TimerDisplay = ({
  time,
  ms,
  isPaused,
  isRunning,
  isRandom = false,
}: TimerDisplayProps) => {
  const theme = useTheme();
  const [randomIndex, setRandomIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shared text style to keep it clean
  const timerTextStyle = {
    fontFamily: "ChivoMono",
    includeFontPadding: false,
    opacity: isPaused ? 0.5 : 1, // Dim the text when paused
  };

  const randomtimerArray = [
    "--:--",
    "?-:--",
    "??:--",
    "??:?-",
    "??:??",
    "-?:??",
    "--:??",
    "--:-?",
  ];

  useEffect(() => {
    if (isRandom && isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRandomIndex((prev) => (prev + 1) % randomtimerArray.length);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    if (!isRunning) {
      setRandomIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRandom, isRunning, isPaused]);

  const displayTime = isRandom ? randomtimerArray[randomIndex] : time;

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
        }}
      >
        {ms && <View style={{ width: 60 }} />}
        <View style={{ overflow: "visible" }}>
          <Text
            variant="displayLarge"
            style={[
              timerTextStyle,
              {
                fontSize: 96,
                lineHeight: 110,
                textAlign: "center",
                paddingHorizontal: 6,
              },
            ]}
          >
            {displayTime}
          </Text>
        </View>

        {ms && (
          <View style={{ width: 50 }}>
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
