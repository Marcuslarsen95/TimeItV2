import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
  Text,
  ScrollView,
} from "react-native";
import { useTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { layout } from "../../styles/layout";
import { formatDateTimer } from "../../utils/HelperFunctions";

import LapList from "@/components/LapList";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useProStatus } from "@/hooks/use-pro-status";

const { IntervalServiceModule } = NativeModules;

export default function StopWatch() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });

  // --- Hooks ---
  const { preferences } = useUserPreferences();
  const { isPro } = useProStatus();

  const { main, ms } = formatDateTimer(timer, true);

  // --- Derived status ---
  const getStatus = () => {
    if (timer === 0)
      return {
        label: "READY",
        color: theme.colors.secondary,
        icon: "play-circle-outline",
      };
    if (isPaused)
      return {
        label: "PAUSED",
        color: theme.colors.outline,
        icon: "pause-circle",
      };
    return {
      label: "STOPWATCH",
      color: theme.colors.primary,
      icon: "timer-outline",
    };
  };
  const currentStatus = getStatus();

  // --- Snackbar ---
  const showSnackbar = (message: string, isError = false) =>
    setSnackbar({ visible: true, message, isError });

  // --- Timer controls ---
  const startTimer = () => {
    // if (inputTimeSecs <= 0) {
    //   showSnackbar("Please input a timer", true);
    //   return;
    // }
    try {
      setIsPaused(false);
      IntervalServiceModule.startSequence(
        JSON.stringify([{ name: "Stopwatch", durationMs: 999999999 }]),
        false,
        "stopwatch",
        isPro && preferences.voicePromptsEnabled,
      );
    } catch (e) {
      showSnackbar("Failed to start timer, please try again", true);
    }
  };

  const togglePause = () => {
    try {
      IntervalServiceModule.toggle();
    } catch (e) {
      showSnackbar("Failed to pause timer", true);
    }
  };

  const stopTimer = () => {
    try {
      setIsPaused(true);
      IntervalServiceModule.stop();
    } catch (e) {
      showSnackbar("Failed to stop timer", true);
    }
  };

  // lap logic
  const [laps, setLaps] = useState<number[]>([]);

  const pressLap = () => {
    if (!timer || isPaused) return;
    setLaps((prev) => [...prev, timer]);
  };

  const handleClearLaps = () => {
    setLaps([]);
  };

  // --- Effects ---
  useEffect(() => {
    IntervalServiceModule.getState()
      .then(
        (state: {
          isRunning: boolean;
          isPaused: boolean;
          timerType: string;
        }) => {
          if (state.timerType !== "stopwatch" || !state.isRunning) return;
          setIsPaused(state.isPaused);
        },
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data) => {
        if (data.timerType !== "stopwatch") return;
        setTimer(data.remainingMs);
      },
    );
    const subPause = DeviceEventEmitter.addListener(
      "IntervalPaused",
      (data) => {
        if (data?.timerType !== "stopwatch") return;
        setIsPaused(true);
      },
    );
    const subResume = DeviceEventEmitter.addListener(
      "IntervalResumed",
      (data) => {
        if (data?.timerType !== "stopwatch") return;
        setIsPaused(false);
      },
    );
    const subStop = DeviceEventEmitter.addListener(
      "IntervalStopped",
      (data) => {
        if (data?.timerType !== "stopwatch") return;
        setIsPaused(true);
        setTimer(0);
      },
    );
    const subLap = DeviceEventEmitter.addListener("StopwatchLap", (data) => {
      setLaps((prev) => [...prev, data.elapsedMs]);
    });

    return () => {
      subUpdate.remove();
      subPause.remove();
      subResume.remove();
      subStop.remove();
      subLap.remove();
    };
  }, []);

  // --- Render ---
  return (
    <GestureHandlerRootView style={layout.GestureRoot}>
      <View style={layout.outerContainer}>
        <View style={layout.mainContainer}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />
          <TimerDisplay
            time={main}
            ms={ms}
            isPaused={isPaused}
            isRunning={!!timer}
          />
          <View>
            <LapList laps={laps} onClear={handleClearLaps} />
          </View>
          <ActionButtonsRow
            timerActive={timer > 0}
            isPaused={isPaused}
            pressPlay={startTimer}
            pressPause={togglePause}
            leftButtonIcon="stop"
            leftButtonLabel="Stop"
            leftButtonPress={stopTimer}
            rightButtonIcon="stopwatch-outline"
            rightButtonLabel="Lap"
            rightButtonPress={pressLap}
          />

          <AppSnackbar
            visible={snackbar.visible}
            message={snackbar.message}
            onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
            color={snackbar.isError ? theme.colors.error : theme.colors.primary}
            textColor={
              snackbar.isError ? theme.colors.onError : theme.colors.onPrimary
            }
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
