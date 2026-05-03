import { View, useColorScheme } from "react-native";
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
    opacity: isPaused ? 0.5 : 0.8, // Dim the text when paused
    color: theme.colors.onBackground,
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

  // Detect hh:mm:ss vs mm:ss by colon count so we can shrink the font enough
  // to fit the longer string on screen. Random patterns ("??:??") only ever
  // have one colon, so they fall through to the larger size automatically.
  const isHours = displayTime.split(":").length > 2;
  const mainFontSize = isHours ? 64 : 96;
  const mainLineHeight = isHours ? 76 : 110;

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
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              timerTextStyle,
              {
                fontSize: mainFontSize,
                lineHeight: mainLineHeight,
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
