import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import { useTheme, Text } from "react-native-paper";
import { layout } from "../../styles/layout";
import React, { useState, useEffect } from "react";
import { formatDateTimer, getRandomMs } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Your shared components
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import ErrorSnackbar from "@/components/errorSnackBar";
import DraggableSettings from "@/components/DraggableSetting";
import TimerInputGroup from "@/components/TimerInputGroup";

import {
  Interval,
  Unit,
  UserPreferences,
  useUserPreferences,
} from "@/hooks/use-user-preferences";

export default function RandomScreen() {
  const theme = useTheme();

  // Timer State
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const { IntervalServiceModule } = NativeModules;

  // UI State
  const [isEditingMinTime, setIsEditingMinTime] = useState(false);
  const [isEditingMaxTime, setIsEditingMaxTime] = useState(false);
  const [error, setError] = useState("");
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);

  const sheetHeight = isEditingMinTime || isEditingMaxTime ? 0.7 : 0.4;
  const { main } = formatDateTimer(timer, false);

  const { preferences, updatePreference, isLoading } = useUserPreferences();
  const hasPreferences = preferences.hasCompletedSetup;
  const minSecs = preferences.random.minSecs;
  const maxSecs = preferences.random.maxSecs;

  const setMinSecs = (value: number) => {
    updatePreference("random", { ...preferences.random, minSecs: value });
  };

  const setMaxSecs = (value: number) => {
    updatePreference("random", { ...preferences.random, maxSecs: value });
  };

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
      label: "RUNNING",
      color: theme.colors.primary,
      icon: "timer-outline",
    };
  };

  const currentStatus = getStatus();

  const startTimer = () => {
    console.log("minSecs:", minSecs, "maxSecs:", maxSecs);
    if (minSecs <= 0 || maxSecs <= 0) return;
    if (maxSecs <= minSecs) {
      setError("Max time must be higher than Min time");
      setIsSnackbarVisible(true);
      return;
    }
    updatePreference("hasCompletedSetup", true);
    const minMs = minSecs * 1000;
    const maxMs = maxSecs * 1000;
    setIsPaused(false);

    const randomTime = getRandomMs(minMs, maxMs);

    // Treat this as a single-item interval list
    const singleInterval = [
      {
        name: "Random",
        durationMs: randomTime,
      },
    ];

    IntervalServiceModule.startSequence(
      JSON.stringify(singleInterval),
      false,
      "random",
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
        if (state.timerType !== "random") return; // not our timer
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
        if (data.timerType !== "random") return;
        setTimer(data.remainingMs);
      },
    );

    const subPause = DeviceEventEmitter.addListener(
      "IntervalPaused",
      (data) => {
        if (data?.timerType !== "random") return;
        setIsPaused(true);
      },
    );

    const subResume = DeviceEventEmitter.addListener(
      "IntervalResumed",
      (data) => {
        if (data?.timerType !== "random") return;
        setIsPaused(false);
      },
    );

    const subStop = DeviceEventEmitter.addListener(
      "IntervalStopped",
      (data) => {
        if (data?.timerType !== "random") return;
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

          <TimerDisplay
            time={"??:??"}
            isPaused={isPaused}
            isRunning={!!timer}
            isRandom={true}
          />

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
        initialOpen={!hasPreferences}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.inputItem}>
            <TimerInputGroup
              label="Set Min Duration"
              initialValueInSeconds={minSecs}
              isActive={!timer} // Only allow editing if timer isn't running
              onDurationChange={setMinSecs}
              onFocusChange={(focused) => setIsEditingMinTime(focused)}
              size={175}
            />
          </View>
          <View style={styles.inputItem}>
            <TimerInputGroup
              label="Set Max Duration"
              initialValueInSeconds={maxSecs}
              isActive={!timer} // Only allow editing if timer isn't running
              onDurationChange={setMaxSecs}
              onFocusChange={(focused) => setIsEditingMaxTime(focused)}
              size={175}
            />
          </View>
        </View>
        {!timer && (
          <Text style={layout.helperText}>
            Adjust the min and max times above, then press play to start.
          </Text>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  inputItem: {
    flex: 1,
    alignItems: "center",
  },
});
