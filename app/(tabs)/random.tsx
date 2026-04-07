import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
  Animated,
} from "react-native";
import {
  useTheme,
  Text,
  IconButton,
  Button,
  Portal,
  Modal,
} from "react-native-paper";
import { layout } from "../../styles/layout";
import React, { useState, useEffect, useRef } from "react";
import { getRandomMs } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Shared components
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import SavePresetDialog from "@/components/SavePresetDialog";
import PresetList from "@/components/PresetList";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import DraggableSettings from "@/components/DraggableTimerContainer";

// Hooks
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets, WorkoutPreset } from "@/hooks/use-workout-presets";

export default function RandomScreen() {
  const theme = useTheme();

  // Timer State
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const { IntervalServiceModule } = NativeModules;

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);
  const sheetHeight = 0.5;

  // presets
  const { presets, savePreset, deletePreset } = useWorkoutPresets();
  const randomPresets = presets.filter((p) => p.type === "random");

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

  const handleSavePreset = async (name: string) => {
    await savePreset(name, "random", {
      minSecs: preferences.random.minSecs,
      maxSecs: preferences.random.maxSecs,
    });
    showSnackbar("Preset saved!");
  };

  // handle snackbar
  const showSnackbar = (message: string, isError = false) => {
    setSnackbar({ visible: true, message, isError });
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
    if (minSecs <= 0 || maxSecs <= 0) return;
    if (maxSecs <= minSecs) {
      showSnackbar("Max time must be higher than minimum time!", true);
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
    <GestureHandlerRootView style={layout.GestureRoot}>
      <View
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 40,
        }}
      >
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
        <DraggableSettings
          label="Timer Settings"
          isTimerRunning={!!timer}
          maxHeight={sheetHeight}
          onOpenChange={() => setIsSettingsOpen(!isSettingsOpen)}
          isOpen={isSettingsOpen}
        >
          <View style={[styles.wheelContainer, {}]}>
            <TimeWheelPicker
              label="Minimum duration"
              valueInSeconds={minSecs}
              onChange={setMinSecs}
            />

            <TimeWheelPicker
              label="Maximum duration"
              valueInSeconds={maxSecs}
              onChange={setMaxSecs}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingTop: 10,
            }}
          >
            <Button icon="save-outline" onPress={() => setShowSaveDialog(true)}>
              Save
            </Button>
            <Button
              icon="bookmarks-outline"
              onPress={() => setIsPresetsOpen(true)}
            >
              Load
            </Button>
          </View>
        </DraggableSettings>

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

      <Portal>
        <Modal
          visible={isPresetsOpen}
          onDismiss={() => setIsPresetsOpen(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.secondaryContainer,
            margin: 20,
            borderRadius: 24,
            padding: 20,
          }}
        >
          {isPresetsOpen && (
            <>
              <View style={styles.inputWrapper}>
                <IconButton
                  icon="close"
                  onPress={() => setIsPresetsOpen(false)}
                  style={{ position: "absolute", top: -10, right: -10 }}
                />
              </View>

              <PresetList
                presets={presets.filter((p) => p.type === "random")}
                onLoad={(preset) => {
                  updatePreference("random", {
                    minSecs: preset.config.minSecs ?? 60,
                    maxSecs: preset.config.maxSecs ?? 300,
                  });
                  showSnackbar("Preset loaded!");
                }}
                onDelete={(id) => {
                  deletePreset(id);
                  showSnackbar("Preset deleted!");
                }}
              />
            </>
          )}
        </Modal>
      </Portal>
      <SavePresetDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={(name) => handleSavePreset(name)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingTop: 76,
  },
  inputWrapper: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
  inputItem: {
    alignItems: "center",
    width: "100%",
  },
  wheelContainer: {
    borderRadius: 50,
    width: "100%",
    paddingHorizontal: 10,
  },
});
