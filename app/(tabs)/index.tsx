import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import { useTheme, Text, Button } from "react-native-paper";
import { layout } from "../../styles/layout";
import React, { useState, useEffect } from "react";
import { formatDateTimer } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import DraggableSettings from "@/components/DraggableTimerContainer";
import TimerInputGroup from "@/components/TimerInputGroup";
import SavePresetDialog from "@/components/SavePresetDialog";
import PresetList from "@/components/PresetList";
import TimeWheelPicker from "@/components/TimeWheelPicker";

// Hooks
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets, WorkoutPreset } from "@/hooks/use-workout-presets";

export default function SimpleTimer() {
  const theme = useTheme();
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [inputTimeSecs, setInputTimeSecs] = useState(60);
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
  const sheetHeight = 0.35;

  // presets
  const { presets, savePreset, deletePreset } = useWorkoutPresets();
  const randomPresets = presets.filter((p) => p.type === "random");

  const { preferences, updatePreference, isLoading } = useUserPreferences();
  const hasPreferences = preferences.hasCompletedSetup;

  const { main } = formatDateTimer(timer, false);
  const countdownPresets = presets.filter((p) => p.type === "countdown");
  const presetsHeight = countdownPresets.length * 0.07;

  const showSnackbar = (message: string, isError = false) => {
    setSnackbar({ visible: true, message, isError });
  };

  const handleSavePreset = async (name: string) => {
    await savePreset(name, "countdown", { duration: inputTimeSecs });
    showSnackbar("Preset saved!");
  };

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

  const scheduleAlarmNotification = async (durationMs: number) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up!",
        body: "Your timer has finished.",
        sound: "bedside_alarm.mp3",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: durationMs / 1000,
        channelId: "alarm",
      },
    });
  };

  const startTimer = () => {
    if (inputTimeSecs <= 0) {
      showSnackbar("Please input a timer", true);
      return;
    }
    setIsPaused(false);
    scheduleAlarmNotification(inputTimeSecs * 1000);
    IntervalServiceModule.startSequence(
      JSON.stringify([{ name: "Countdown", durationMs: inputTimeSecs * 1000 }]),
      false,
      "countdown",
    );
  };

  const togglePause = () => IntervalServiceModule.toggle();
  const stopTimer = () => {
    setIsPaused(true);
    IntervalServiceModule.stop();
  };
  const skipForward = () => IntervalServiceModule.skipForward(10000);

  React.useEffect(() => {
    IntervalServiceModule.getState().then(
      (state: { isRunning: boolean; isPaused: boolean; timerType: string }) => {
        if (state.timerType !== "countdown") return;
        if (!state.isRunning) return;
        if (state.isRunning || !state.isPaused) setIsPaused(state.isPaused);
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
        <AppSnackbar
          visible={snackbar.visible}
          message={snackbar.message}
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
          color={snackbar.isError ? theme.colors.error : theme.colors.primary}
          textColor={
            snackbar.isError ? theme.colors.onError : theme.colors.onPrimary
          }
        />
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
              valueInSeconds={inputTimeSecs}
              onChange={(newSecs) => setInputTimeSecs(newSecs)}
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
      </View>

      {/* <DraggableSettings
        label="Timer Settings"
        isTimerRunning={!!timer}
        maxHeight={sheetHeight}
      >
        <View style={styles.inputWrapper}>
          <TimerInputGroup
            label="Set Duration"
            initialValueInSeconds={inputTimeSecs}
            isActive={!timer}
            onDurationChange={(newSecs) => setInputTimeSecs(newSecs)}
            onFocusChange={(focused) => setIsEditingTime(focused)}
          />
          {!timer && (
            <Text style={layout.helperText}>
              Adjust the time above, then press play to start.
            </Text>
          )}
        </View>
        <Button onPress={() => setShowSaveDialog(true)}>Save as Preset</Button>
        <PresetList
          presets={countdownPresets}
          onLoad={(preset) => {
            setInputTimeSecs(preset.config.duration ?? 60);
            showSnackbar("Preset loaded!");
          }}
          onDelete={(id) => {
            deletePreset(id);
            showSnackbar("Preset deleted!");
          }}
        />
      </DraggableSettings>
      <SavePresetDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={handleSavePreset}
      /> */}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  inputWrapper: { marginTop: 20, alignItems: "center", width: "100%" },
  wheelContainer: {
    borderRadius: 50,
    width: "100%",
    paddingHorizontal: 10,
  },
});
