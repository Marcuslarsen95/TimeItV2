import React, { useState, useEffect } from "react";
import { View, NativeModules, DeviceEventEmitter } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { layout } from "../../styles/layout";
import { formatDateTimer } from "../../utils/HelperFunctions";

import LapList from "@/components/LapList";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import SaveRunDialog from "@/components/SaveRunDialog";
import LapHistoryModal from "@/components/LapHistoryModal";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useProStatus } from "@/hooks/use-pro-status";
import { useLapHistory } from "@/hooks/use-lap-history";
import { OPEN_SETTINGS_EVENT } from "@/components/SettingsTrigger";
import InfoPill from "@/components/InfoPill";

const { IntervalServiceModule } = NativeModules;

export default function StopWatch() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    isError: boolean;
    action?: { label: string; onPress: () => void };
    secondaryAction?: { label: string; onPress: () => void };
  }>({
    visible: false,
    message: "",
    isError: false,
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // --- Hooks ---
  const { preferences } = useUserPreferences();
  const { isPro } = useProStatus();
  const { runs: savedRuns, saveRun, deleteRun } = useLapHistory();

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
  const showSnackbar = (
    message: string,
    isError = false,
    action?: { label: string; onPress: () => void },
    secondaryAction?: { label: string; onPress: () => void },
  ) =>
    setSnackbar({ visible: true, message, isError, action, secondaryAction });

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
        1,
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

  // --- Lap history (Pro feature) ---
  const handleSaveRunClick = () => {
    if (laps.length === 0) {
      showSnackbar("Record at least one lap before saving.", true);
      return;
    }
    if (!isPro) {
      // Free users see an upsell with two routes — Upgrade or open the
      // history modal (so they can still browse anything they saved
      // previously, just not add new ones).
      showSnackbar(
        "Saving runs is a Pro feature. Upgrade for lap history.",
        false,
        {
          label: "Upgrade",
          onPress: () => DeviceEventEmitter.emit(OPEN_SETTINGS_EVENT),
        },
        savedRuns.length > 0
          ? {
              label: "View",
              onPress: () => setShowHistory(true),
            }
          : undefined,
      );
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveRun = async (name: string) => {
    const totalDurationMs = laps[laps.length - 1] ?? timer;
    const result = await saveRun(name, laps, totalDurationMs, isPro);
    if (!result.ok) {
      showSnackbar("Couldn't save run — Pro required.", true);
      return;
    }
    showSnackbar("Run saved!");
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
        {savedRuns.length > 0 && (
          <Button
            icon="ant:history"
            compact
            onPress={() => setShowHistory(true)}
            labelStyle={{ fontSize: 14 }}
            style={{ position: "absolute", zIndex: 10, top: 0, left: -20 }}
          >
            History
          </Button>
        )}
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
          <View style={{ alignItems: "center" }}>
            <LapList
              laps={laps}
              onClear={handleClearLaps}
              onSave={handleSaveRunClick}
            />
            {/* When there are no current laps but the user has previously
                saved runs, surface a quick way to browse them. */}
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
            color={snackbar.isError ? theme.colors.error : undefined}
            textColor={snackbar.isError ? theme.colors.onError : undefined}
            action={snackbar.action}
            secondaryAction={snackbar.secondaryAction}
            duration={snackbar.action || snackbar.secondaryAction ? 5000 : 2000}
          />
        </View>
      </View>

      <SaveRunDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={handleSaveRun}
      />

      <LapHistoryModal
        visible={showHistory}
        onDismiss={() => setShowHistory(false)}
        runs={savedRuns}
        onDelete={deleteRun}
      />
    </GestureHandlerRootView>
  );
}
