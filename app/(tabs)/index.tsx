import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import {
  useTheme,
  Button,
  Portal,
  Modal,
  IconButton,
} from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { layout } from "../../styles/layout";
import { formatDateTimer } from "../../utils/HelperFunctions";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets } from "@/hooks/use-workout-presets";

import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import DraggableSettings from "@/components/DraggableTimerContainer";
import PresetList from "@/components/PresetList";
import SavePresetDialog from "@/components/SavePresetDialog";
import TimerInfoBar from "@/components/TimerInfoBar";
import TimeWheelPicker from "@/components/TimeWheelPicker";

const { IntervalServiceModule } = NativeModules;
const SHEET_HEIGHT = 0.35;

export default function SimpleTimer() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [inputTimeSecs, setInputTimeSecs] = useState(60);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
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

  const { main } = formatDateTimer(timer, false);
  const countdownPresets = presets.filter((p) => p.type === "countdown");

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
      label: "COUNTDOWN",
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
    if (inputTimeSecs <= 0) {
      showSnackbar("Please input a timer", true);
      return;
    }
    try {
      setIsSettingsOpen(false);
      setIsPaused(false);
      IntervalServiceModule.startSequence(
        JSON.stringify([
          { name: "Countdown", durationMs: inputTimeSecs * 1000 },
        ]),
        false,
        "countdown",
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
    await savePreset(name, "countdown", { duration: inputTimeSecs });
    showSnackbar("Preset saved!");
  };

  const openPresets = () => {
    if (countdownPresets.length < 1) {
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
          if (state.timerType !== "countdown" || !state.isRunning) return;
          setIsPaused(state.isPaused);
        },
      )
      .catch(() => {});
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
          <TimerInfoBar type="countdown" durationSecs={inputTimeSecs} />
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
              label="Set timer duration"
              valueInSeconds={inputTimeSecs}
              onChange={setInputTimeSecs}
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
                presets={countdownPresets}
                onLoad={(preset) => {
                  const newDuration = preset.config.duration ?? 60;
                  setInputTimeSecs(newDuration);
                  updatePreference("countdown", { duration: newDuration });
                  setIsPresetsOpen(false);
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
