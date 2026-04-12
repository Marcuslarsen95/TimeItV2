import { View } from "react-native";
import React from "react";
import { IconButton, useTheme, Text } from "react-native-paper";

interface ActionButtonProps {
  timerActive: boolean;
  isPaused: boolean;
  withSkips?: boolean;
  pressPlay: () => void;
  pressPause: () => void;
  pressStop: () => void;
  pressSkipToNext: () => void;
  thirdButtonIcon: string;
  thirdButtonLabel: string;
  firstButtonIcon: string;
  firstButtonLabel: string;
}

const ActionButtonsRow = ({
  timerActive,
  isPaused,
  withSkips = false,
  pressPlay,
  pressPause,
  pressStop,
  pressSkipToNext,
  thirdButtonIcon,
  thirdButtonLabel,
  firstButtonIcon,
  firstButtonLabel,
}: ActionButtonProps) => {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        width: "100%",
        borderRadius: 50,
        // borderWidth: 1.5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        overflow: "visible",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <IconButton
          icon={firstButtonIcon}
          mode="outlined"
          size={40}
          onPress={pressStop}
          iconColor={theme.colors.secondary}
          contentStyle={{}}
          style={{ borderWidth: 0, marginBottom: -5 }}
        />
        <Text style={{ fontSize: 11, color: theme.colors.secondary }}>
          {firstButtonLabel}
        </Text>
      </View>
      <IconButton
        icon={isPaused ? "play" : "pause"}
        mode="outlined"
        size={64}
        onPress={() => {
          if (timerActive) {
            pressPause();
          } else {
            pressPlay();
          }
        }}
        iconColor={theme.colors.primary}
        style={{ borderWidth: 0 }}
      />
      <View style={{ alignItems: "center" }}>
        <IconButton
          icon={thirdButtonIcon}
          mode="outlined"
          size={40}
          onPress={pressSkipToNext}
          iconColor={theme.colors.secondary}
          style={{ borderWidth: 0, marginBottom: -5 }}
        />
        <Text style={{ fontSize: 11, color: theme.colors.secondary }}>
          {thirdButtonLabel}
        </Text>
      </View>
    </View>
  );
};

export default ActionButtonsRow;
