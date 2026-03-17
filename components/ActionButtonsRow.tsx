import { View, Text } from "react-native";
import React from "react";
import { Button, IconButton, useTheme } from "react-native-paper";
import { layout } from "../styles/layout";

interface ActionButtonProps {
  timerActive: boolean;
  isPaused: boolean;
  withSkips?: boolean;
  pressPlay: () => void;
  pressPause: () => void;
  pressStop: () => void;
  pressSkipToNext: () => void;
}

const ActionButtonsRow = ({
  timerActive,
  isPaused,
  withSkips = false,
  pressPlay,
  pressPause,
  pressStop,
  pressSkipToNext,
}: ActionButtonProps) => {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <IconButton
        icon="refresh"
        mode="outlined"
        size={40}
        onPress={pressStop}
        iconColor={theme.colors.secondary}
        contentStyle={{}}
        style={{ borderWidth: 0 }}
      />
      <IconButton
        icon={isPaused ? "play-outline" : "pause-outline"}
        mode="outlined"
        size={64}
        onPress={timerActive ? pressPause : pressPlay}
        iconColor={theme.colors.primary}
        contentStyle={{ marginLeft: 6 }}
        style={{ borderWidth: 0 }}
      />

      <IconButton
        icon="play-skip-forward-outline"
        mode="outlined"
        size={40}
        onPress={pressSkipToNext}
        iconColor={theme.colors.secondary}
        style={{ borderWidth: 0 }}
      />
    </View>
  );
};

export default ActionButtonsRow;
