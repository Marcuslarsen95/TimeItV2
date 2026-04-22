import { View } from "react-native";
import React from "react";
import { IconButton, useTheme, Text } from "react-native-paper";

interface ActionButtonProps {
  timerActive: boolean;
  isPaused: boolean;
  withSkips?: boolean;
  pressPlay: () => void;
  pressPause: () => void;
  leftButtonIcon: string;
  leftButtonLabel: string;
  leftButtonPress: () => void;
  rightButtonIcon: string;
  rightButtonLabel: string;
  rightButtonPress: () => void;
}

const ActionButtonsRow = ({
  timerActive,
  isPaused,
  pressPlay,
  pressPause,
  leftButtonIcon,
  leftButtonLabel,
  leftButtonPress,
  rightButtonIcon,
  rightButtonLabel,
  rightButtonPress,
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
          icon={leftButtonIcon}
          mode="outlined"
          size={40}
          onPress={leftButtonPress}
          iconColor={theme.colors.secondary}
          contentStyle={{}}
          style={{ borderWidth: 0, marginBottom: -5 }}
        />
        <Text style={{ fontSize: 11, color: theme.colors.secondary }}>
          {leftButtonLabel}
        </Text>
      </View>
      <View style={{ alignItems: "center" }}>
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
          style={{ borderWidth: 0, marginBottom: -5 }}
        />
        {/* <Text style={{ fontSize: 11, color: theme.colors.secondary }}>
          {isPaused ? "play" : "pause"}
        </Text> */}
      </View>
      <View style={{ alignItems: "center" }}>
        <IconButton
          icon={rightButtonIcon}
          mode="outlined"
          size={40}
          onPress={rightButtonPress}
          iconColor={theme.colors.secondary}
          style={{ borderWidth: 0, marginBottom: -5 }}
        />
        <Text style={{ fontSize: 11, color: theme.colors.secondary }}>
          {rightButtonLabel}
        </Text>
      </View>
    </View>
  );
};

export default ActionButtonsRow;
