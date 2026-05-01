import { View, StyleSheet } from "react-native";
import React from "react";
import { Button } from "react-native-paper";

interface ActionButtonProps {
  timerActive: boolean;
  isPaused: boolean;
  withSkips?: boolean;
  pressPlay: () => void;
  pressPause: () => void;
  leftButtonIcon?: string;
  leftButtonLabel: string;
  leftButtonPress: () => void;
  rightButtonIcon?: string;
  rightButtonLabel?: string;
  rightButtonPress?: () => void;
}

const BUTTON_RADIUS = 24;

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
  const onPrimaryPress = () => {
    if (timerActive) {
      pressPause();
    } else {
      pressPlay();
    }
  };

  const primaryLabel = !timerActive ? "Start" : isPaused ? "Resume" : "Pause";
  const primaryIcon = !timerActive ? "play" : isPaused ? "play" : "pause";

  return (
    <View style={styles.container}>
      {/* --- Top row: primary play/pause/resume button --- */}
      <View style={styles.row}>
        <Button
          mode="contained"
          icon={primaryIcon}
          onPress={onPrimaryPress}
          style={[styles.primaryButton, { borderRadius: BUTTON_RADIUS }]}
          contentStyle={styles.primaryContent}
          labelStyle={styles.primaryLabel}
        >
          {primaryLabel}
        </Button>
      </View>

      {/* --- Bottom row: secondary actions (hidden when stopped) --- */}
      {timerActive && (
        <View style={styles.row}>
          <Button
            mode="contained-tonal"
            icon={leftButtonIcon}
            onPress={leftButtonPress}
            style={[styles.sideButton, { borderRadius: BUTTON_RADIUS }]}
            contentStyle={styles.sideContent}
            labelStyle={styles.sideLabel}
          >
            {leftButtonLabel}
          </Button>
          {rightButtonIcon && (
            <Button
              mode="contained-tonal"
              icon={rightButtonIcon}
              onPress={rightButtonPress}
              style={[styles.sideButton, { borderRadius: BUTTON_RADIUS }]}
              contentStyle={styles.sideContent}
              labelStyle={styles.sideLabel}
            >
              {rightButtonLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  sideButton: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  primaryContent: {
    height: 56,
  },
  sideContent: {
    height: 48,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  sideLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

export default ActionButtonsRow;
