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
import PresetList from "@/components/PresetList";
import SavePresetDialog from "@/components/SavePresetDialog";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import AlarmActiveView from "@/components/AlarmActiveView";

const { IntervalServiceModule } = NativeModules;

export default function SimpleTimer() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [inputTimeSecs, setInputTimeSecs] = useState(60);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });

  // --- Hooks ---
  const { preferences, updatePreference } = useUserPreferences();
  const { presets, savePreset, deletePreset } = useWorkoutPresets();

  const { main } = formatDateTimer(
    timer > 0 ? timer : inputTimeSecs * 1000,
    false,
  );
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

  const stopAlarm = () => {
    try {
      IntervalServiceModule.stopAlarm();
    } catch (e) {
      showSnackbar("Failed to stop alarm", true);
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

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    if (countdownPresets.length <= 1) setIsPresetsOpen(false);
    showSnackbar("Preset deleted!");
  };

  // --- Effects ---
  useEffect(() => {
    IntervalServiceModule.getState()
      .then(
        (state: {
          isRunning: boolean;
          isPaused: boolean;
          timerType: string;
          isAlarmRinging?: boolean;
        }) => {
          if (state.timerType === "countdown" && state.isAlarmRinging) {
            setIsAlarmActive(true);
            return;
          }
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
    const subAlarmStart = DeviceEventEmitter.addListener(
      "AlarmStarted",
      (data) => {
        if (data?.timerType !== "countdown") return;
        setIsAlarmActive(true);
      },
    );
    const subAlarmStop = DeviceEventEmitter.addListener(
      "AlarmStopped",
      (data) => {
        if (data?.timerType !== "countdown") return;
        setIsAlarmActive(false);
      },
    );

    return () => {
      subUpdate.remove();
      subPause.remove();
      subResume.remove();
      subStop.remove();
      subAlarmStart.remove();
      subAlarmStop.remove();
    };
  }, []);

  // --- Render ---
  if (isAlarmActive) {
    return (
      <GestureHandlerRootView style={layout.GestureRoot}>
        <View style={layout.outerContainer}>
          <View style={layout.mainContainer}>
            <StatusBadge
              statusLabel="TIME'S UP"
              statusColor={theme.colors.error}
              statusIcon="alarm-outline"
            />
            <AlarmActiveView onStop={stopAlarm} />
            <AppSnackbar
              visible={snackbar.visible}
              message={snackbar.message}
              onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
              color={
                snackbar.isError ? theme.colors.error : theme.colors.primary
              }
              textColor={
                snackbar.isError ? theme.colors.onError : theme.colors.onPrimary
              }
            />
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={layout.GestureRoot}>
      <View style={layout.outerContainer}>
        <View style={layout.mainContainer}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />

          <View style={styles.mainArea}>
            {timer > 0 ? (
              <TimerDisplay
                time={main}
                isPaused={isPaused}
                isRunning={!!timer}
              />
            ) : (
              <TimeWheelPicker
                valueInSeconds={inputTimeSecs}
                onChange={setInputTimeSecs}
              />
            )}
          </View>

          {timer === 0 && (
            <View style={styles.presetRow}>
              <Button
                icon="save-outline"
                onPress={() => setShowSaveDialog(true)}
              >
                Save for later
              </Button>
              <Button icon="bookmarks-outline" onPress={openPresets}>
                Load saved
              </Button>
            </View>
          )}

          <ActionButtonsRow
            timerActive={timer > 0}
            isPaused={isPaused}
            pressPlay={startTimer}
            pressPause={togglePause}
            leftButtonIcon="stop"
            leftButtonLabel="Stop"
            leftButtonPress={stopTimer}
            rightButtonIcon="play-forward"
            rightButtonLabel="10s"
            rightButtonPress={skipForward}
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
                type="countdown"
                onLoad={(preset) => {
                  const newDuration = preset.config.duration ?? 60;
                  setInputTimeSecs(newDuration);
                  updatePreference("countdown", { duration: newDuration });
                  setIsPresetsOpen(false);
                  showSnackbar("Preset loaded!");
                }}
                onDelete={(id) => {
                  handleDeletePreset(id);
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
  mainArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 300,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
});
