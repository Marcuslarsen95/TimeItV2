import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import {
  useTheme,
  IconButton,
  Button,
  Portal,
  Modal,
} from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { layout } from "../../styles/layout";
import { getRandomMs } from "../../utils/HelperFunctions";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets } from "@/hooks/use-workout-presets";

import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import SavePresetDialog from "@/components/SavePresetDialog";
import PresetList from "@/components/PresetList";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import DraggableSettings from "@/components/DraggableTimerContainer";
import TimerInfoBar from "@/components/TimerInfoBar";

const { IntervalServiceModule } = NativeModules;
const SHEET_HEIGHT = 0.5;

export default function RandomScreen() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });

  // --- Hooks ---
  const { preferences, updatePreference } = useUserPreferences();
  const { presets, savePreset, deletePreset } = useWorkoutPresets();

  const { minSecs, maxSecs } = preferences.random;
  const randomPresets = presets.filter((p) => p.type === "random");

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
      label: "RUNNING",
      color: theme.colors.primary,
      icon: "timer-outline",
    };
  };
  const currentStatus = getStatus();

  // --- Preference helpers ---
  const setMinSecs = (value: number) =>
    updatePreference("random", { ...preferences.random, minSecs: value });

  const setMaxSecs = (value: number) =>
    updatePreference("random", { ...preferences.random, maxSecs: value });

  // --- Snackbar ---
  const showSnackbar = (message: string, isError = false) =>
    setSnackbar({ visible: true, message, isError });

  // --- Timer controls ---
  const startTimer = () => {
    if (minSecs <= 0 || maxSecs <= 0) return;
    if (maxSecs <= minSecs) {
      showSnackbar("Max time must be higher than minimum time!", true);
      return;
    }
    try {
      updatePreference("hasCompletedSetup", true);
      setIsPaused(false);
      setIsSettingsOpen(false);
      const randomTime = getRandomMs(minSecs * 1000, maxSecs * 1000);
      IntervalServiceModule.startSequence(
        JSON.stringify([{ name: "Random", durationMs: randomTime }]),
        false,
        "random",
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

  const skipForward = () => {
    try {
      IntervalServiceModule.skipForward(10000);
    } catch (e) {
      showSnackbar("Failed to skip forward", true);
    }
  };

  // --- Presets ---
  const handleSavePreset = async (name: string) => {
    await savePreset(name, "random", { minSecs, maxSecs });
    setIsPresetsOpen(false);
    showSnackbar("Preset saved!");
  };

  const openPresets = () => {
    if (randomPresets.length < 1) {
      showSnackbar("You don't have any saved presets", true);
    } else {
      setIsPresetsOpen(true);
    }
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
          if (state.timerType !== "random" || !state.isRunning) return;
          setIsPaused(state.isPaused);
        },
      )
      .catch(() => {});
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
            time="??:??"
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
          <TimerInfoBar type="random" minSecs={minSecs} maxSecs={maxSecs} />
        </View>

        <DraggableSettings
          label="Timer Settings"
          isTimerRunning={!!timer}
          maxHeight={SHEET_HEIGHT}
          onOpenChange={() => setIsSettingsOpen(!isSettingsOpen)}
          isOpen={isSettingsOpen}
        >
          <View style={styles.wheelContainer}>
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
          <View style={styles.presetRow}>
            <Button icon="save-outline" onPress={() => setShowSaveDialog(true)}>
              Save Preset
            </Button>
            <Button icon="bookmarks-outline" onPress={openPresets}>
              Load Presets
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
          contentContainerStyle={[
            layout.presetModalContainer,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          {isPresetsOpen && (
            <>
              <View style={styles.modalHeader}>
                <IconButton
                  icon="close"
                  onPress={() => setIsPresetsOpen(false)}
                  style={{ position: "absolute", top: -15, right: -20 }}
                />
              </View>
              <PresetList
                presets={randomPresets}
                onLoad={(preset) => {
                  updatePreference("random", {
                    minSecs: preset.config.minSecs ?? 60,
                    maxSecs: preset.config.maxSecs ?? 300,
                  });
                  setIsPresetsOpen(false);
                  showSnackbar("Preset loaded!");
                }}
                onDelete={(id) => {
                  deletePreset(id);
                  showSnackbar("Preset deleted!");
                  if (randomPresets.length < 1) setIsPresetsOpen(false);
                }}
              />
            </>
          )}
        </Modal>
      </Portal>

      <SavePresetDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={handleSavePreset}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    borderRadius: 50,
    width: "100%",
    paddingHorizontal: 10,
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 10,
    height: 40,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
});
