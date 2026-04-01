import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import { useTheme, Text } from "react-native-paper";
import { layout } from "../../styles/layout";
import React, { useState, useEffect } from "react";
import { formatDateTimer } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Your shared components
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import ErrorSnackbar from "@/components/errorSnackBar";
import DraggableSettings from "@/components/DraggableSetting";
import TimerInputGroup from "@/components/TimerInputGroup";

export default function SimpleTimer() {
  const theme = useTheme();

  // Timer State
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [inputTimeSecs, setInputTimeSecs] = useState(60);
  const { IntervalServiceModule } = NativeModules;

  // UI State
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [error, setError] = useState("");
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);

  const sheetHeight = isEditingTime ? 0.7 : 0.4;
  const { main } = formatDateTimer(timer, false);

  const getStatus = () => {
    // 1. Initial State (Timer is 0 and we haven't started)
    if (timer === 0) {
      return {
        label: "READY",
        color: theme.colors.secondary,
        icon: "play-circle-outline",
      };
    }

    // 2. User hit pause while it was running
    if (isPaused) {
      return {
        label: "PAUSED",
        color: theme.colors.outline,
        icon: "pause-circle",
      };
    }

    // 3. Active Countdown
    return {
      label: "COUNTDOWN",
      color: theme.colors.primary,
      icon: "timer-outline",
    };
  };

  const currentStatus = getStatus();

  const startTimer = () => {
    if (inputTimeSecs <= 0) return;

    setIsPaused(false);

    // Treat this as a single-item interval list
    const singleInterval = [
      {
        name: "Countdown",
        durationMs: inputTimeSecs * 1000,
      },
    ];

    IntervalServiceModule.startSequence(
      JSON.stringify(singleInterval),
      false,
      "countdown",
    );
  };

  const skipForward = () => {
    IntervalServiceModule.skipForward(10000);
  };

  // Replace togglePause with this:
  const togglePause = () => {
    IntervalServiceModule.toggle();
    // The listener below will update the isPaused state
  };

  React.useEffect(() => {
    IntervalServiceModule.getState().then(
      (state: { isRunning: boolean; isPaused: boolean; timerType: string }) => {
        if (state.timerType !== "countdown") return; // not our timer
        if (!state.isRunning) return;
        if (state.isRunning || !state.isPaused) {
          setIsPaused(state.isPaused);
        }
      },
    );
  }, []);

  useEffect(() => {
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data) => {
        if (data.timerType !== "countdown") return;
        setTimer(data.remainingMs);
      },
    );

    const subPause = DeviceEventEmitter.addListener(
      "IntervalPaused",
      (data) => {
        if (data?.timerType !== "countdown") return;
        setIsPaused(true);
      },
    );

    const subResume = DeviceEventEmitter.addListener(
      "IntervalResumed",
      (data) => {
        if (data?.timerType !== "countdown") return;
        setIsPaused(false);
      },
    );

    const subStop = DeviceEventEmitter.addListener(
      "IntervalStopped",
      (data) => {
        if (data?.timerType !== "countdown") return;
        setIsPaused(true);
        setTimer(0);
      },
    );

    return () => {
      subUpdate.remove();
      subPause.remove();
      subResume.remove();
      subStop.remove();
    };
  }, []);

  const stopTimer = async () => {
    setIsPaused(true);
    IntervalServiceModule.stop();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={[layout.mainContainer]}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />

          <TimerDisplay time={main} isPaused={isPaused} isRunning={!!timer} />

          <ActionButtonsRow
            timerActive={timer > 0}
            isPaused={isPaused}
            pressPlay={startTimer}
            pressPause={togglePause}
            pressStop={stopTimer}
            pressSkipToNext={skipForward}
            firstButtonIcon="stop"
            firstButtonLabel="Stop"
            thirdButtonIcon="play-forward"
            thirdButtonLabel="10s"
          />
        </View>

        <ErrorSnackbar
          visible={isSnackbarVisible}
          message={error}
          onDismiss={() => setIsSnackbarVisible(false)}
          color={theme.colors.error}
          textColor={theme.colors.onError}
        />
      </View>
      {/* Draggable Settings: Just the time input */}
      <DraggableSettings
        label="Timer Settings"
        isTimerRunning={!!timer}
        maxHeight={sheetHeight}
      >
        <View style={styles.inputWrapper}>
          <TimerInputGroup
            label="Set Duration"
            initialValueInSeconds={inputTimeSecs}
            isActive={!timer} // Only allow editing if timer isn't running
            onDurationChange={(newSecs) => setInputTimeSecs(newSecs)}
            onFocusChange={(focused) => setIsEditingTime(focused)}
          />
          {!timer && (
            <Text style={layout.helperText}>
              Adjust the time above, then press play to start.
            </Text>
          )}
        </View>
      </DraggableSettings>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    paddingVertical: 76,
    gap: 76,
  },
  inputWrapper: {
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
});
